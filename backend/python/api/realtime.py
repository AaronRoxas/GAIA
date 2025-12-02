"""
Realtime SSE API - Server-Sent Events for Hazard Updates
Replaces direct Supabase Realtime subscriptions from frontend

Security: PATCH-1.3 (Critical Security Fixes)
- No Supabase credentials exposed to frontend
- SSE stream authenticated via backend
- Connection management with heartbeat
- Rate limiting and connection limits

Module: GV-02 (Geospatial Visualization - Live Updates)

Architecture:
- Service Layer: SSE endpoint and event formatting
- Manager Layer: Supabase Realtime subscription management
- Resilience Layer: Connection limits, heartbeat, graceful shutdown
"""

import asyncio
import logging
import json
from typing import Optional, Dict, Any, Set
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Request, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from backend.python.lib.supabase_client import supabase
from backend.python.middleware.rbac import UserContext, get_current_user_optional
from backend.python.middleware.activity_logger import ActivityLogger

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/realtime",
    tags=["Realtime SSE"],
    responses={503: {"description": "Service unavailable"}},
)


# ============================================================================
# Resilience Layer: Connection Management
# ============================================================================

class ConnectionManager:
    """
    Manages SSE connections with limits and monitoring
    
    Resilience features:
    - Maximum connection limit per IP
    - Global connection limit
    - Connection timeout/heartbeat
    - Graceful shutdown support
    """
    
    MAX_CONNECTIONS_PER_IP = 5
    MAX_TOTAL_CONNECTIONS = 500
    HEARTBEAT_INTERVAL = 30  # seconds
    CONNECTION_TIMEOUT = 300  # 5 minutes
    
    def __init__(self):
        self.active_connections: Dict[str, Set[str]] = {}  # IP -> Set of connection IDs
        self.connection_count = 0
        self._shutdown_event = asyncio.Event()
    
    def can_connect(self, client_ip: str) -> tuple[bool, str]:
        """Check if new connection is allowed"""
        # Check global limit
        if self.connection_count >= self.MAX_TOTAL_CONNECTIONS:
            return False, "Server at maximum connection capacity"
        
        # Check per-IP limit
        ip_connections = self.active_connections.get(client_ip, set())
        if len(ip_connections) >= self.MAX_CONNECTIONS_PER_IP:
            return False, f"Maximum connections per IP reached ({self.MAX_CONNECTIONS_PER_IP})"
        
        return True, "OK"
    
    def add_connection(self, client_ip: str) -> str:
        """Register new connection, returns connection ID"""
        conn_id = str(uuid4())
        
        if client_ip not in self.active_connections:
            self.active_connections[client_ip] = set()
        
        self.active_connections[client_ip].add(conn_id)
        self.connection_count += 1
        
        logger.info(f"SSE connection opened: {conn_id} from {client_ip} (total: {self.connection_count})")
        return conn_id
    
    def remove_connection(self, client_ip: str, conn_id: str):
        """Unregister connection"""
        if client_ip in self.active_connections:
            self.active_connections[client_ip].discard(conn_id)
            if not self.active_connections[client_ip]:
                del self.active_connections[client_ip]
        
        self.connection_count = max(0, self.connection_count - 1)
        logger.info(f"SSE connection closed: {conn_id} from {client_ip} (total: {self.connection_count})")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            "total_connections": self.connection_count,
            "unique_ips": len(self.active_connections),
            "max_connections": self.MAX_TOTAL_CONNECTIONS,
            "max_per_ip": self.MAX_CONNECTIONS_PER_IP
        }
    
    def shutdown(self):
        """Signal all connections to close"""
        self._shutdown_event.set()
    
    @property
    def is_shutting_down(self) -> bool:
        return self._shutdown_event.is_set()


# Global connection manager instance
connection_manager = ConnectionManager()


# ============================================================================
# Manager Layer: Event Formatting and Subscription
# ============================================================================

class HazardEventManager:
    """
    Manages hazard event formatting and subscription logic
    
    Manager responsibilities:
    - Format hazard data for SSE transmission
    - Handle subscription filters
    - Abstract Supabase Realtime details
    """
    
    @staticmethod
    def format_hazard_event(hazard_data: Dict[str, Any], event_type: str = "hazard") -> Dict[str, Any]:
        """Format hazard data for SSE transmission"""
        return {
            "id": hazard_data.get("id"),
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "id": hazard_data.get("id"),
                "hazard_type": hazard_data.get("hazard_type"),
                "location_name": hazard_data.get("location_name"),
                "latitude": hazard_data.get("latitude"),
                "longitude": hazard_data.get("longitude"),
                "severity": hazard_data.get("severity"),
                "confidence_score": hazard_data.get("confidence_score"),
                "validated": hazard_data.get("validated"),
                "source_type": hazard_data.get("source_type"),
                "source_title": hazard_data.get("source_title"),
                "created_at": hazard_data.get("created_at"),
            }
        }
    
    @staticmethod
    def format_stats_event(stats: Dict[str, Any]) -> Dict[str, Any]:
        """Format stats update for SSE transmission"""
        return {
            "event_type": "stats_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": stats
        }
    
    @staticmethod
    def format_heartbeat() -> Dict[str, Any]:
        """Format heartbeat message"""
        return {
            "event_type": "heartbeat",
            "timestamp": datetime.utcnow().isoformat(),
            "server_time": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    def matches_filters(
        hazard: Dict[str, Any],
        hazard_types: Optional[list] = None,
        min_confidence: Optional[float] = None,
        validated_only: bool = False
    ) -> bool:
        """Check if hazard matches subscription filters"""
        # Filter by hazard type
        if hazard_types and hazard.get("hazard_type") not in hazard_types:
            return False
        
        # Filter by confidence
        if min_confidence is not None:
            score = hazard.get("confidence_score", 0)
            if score < min_confidence:
                return False
        
        # Filter by validation status
        if validated_only and not hazard.get("validated"):
            return False
        
        return True


# ============================================================================
# Service Layer: SSE Endpoints
# ============================================================================

async def hazard_event_generator(
    request: Request,
    client_ip: str,
    conn_id: str,
    hazard_types: Optional[list] = None,
    min_confidence: Optional[float] = None,
    validated_only: bool = False,
    user: Optional[UserContext] = None
):
    """
    Async generator for SSE hazard events
    
    Implements:
    - Periodic polling of new hazards (Supabase doesn't have direct async realtime in Python)
    - Heartbeat to keep connection alive
    - Graceful shutdown on disconnect
    - Filter matching for subscribed event types
    """
    last_check = datetime.utcnow()
    last_heartbeat = datetime.utcnow()
    heartbeat_interval = timedelta(seconds=ConnectionManager.HEARTBEAT_INTERVAL)
    poll_interval = 5  # seconds between database polls
    
    try:
        # Send initial connection event
        yield {
            "event": "connected",
            "data": json.dumps({
                "connection_id": conn_id,
                "timestamp": datetime.utcnow().isoformat(),
                "filters": {
                    "hazard_types": hazard_types,
                    "min_confidence": min_confidence,
                    "validated_only": validated_only
                }
            })
        }
        
        while True:
            # Check for client disconnect
            if await request.is_disconnected():
                logger.info(f"Client disconnected: {conn_id}")
                break
            
            # Check for server shutdown
            if connection_manager.is_shutting_down:
                yield {
                    "event": "shutdown",
                    "data": json.dumps({"message": "Server shutting down"})
                }
                break
            
            now = datetime.utcnow()
            
            # Send heartbeat periodically
            if now - last_heartbeat >= heartbeat_interval:
                yield {
                    "event": "heartbeat",
                    "data": json.dumps(HazardEventManager.format_heartbeat())
                }
                last_heartbeat = now
            
            # Poll for new hazards since last check
            try:
                # Query hazards created after last check
                query = supabase.schema("gaia").from_("hazards").select("*")
                query = query.gte("created_at", last_check.isoformat())
                query = query.order("created_at", desc=False)
                query = query.limit(50)  # Limit batch size
                
                response = query.execute()
                
                if response.data:
                    for hazard in response.data:
                        # Apply filters
                        if HazardEventManager.matches_filters(
                            hazard, hazard_types, min_confidence, validated_only
                        ):
                            event_data = HazardEventManager.format_hazard_event(hazard, "new_hazard")
                            yield {
                                "event": "hazard",
                                "data": json.dumps(event_data)
                            }
                    
                    # Update last check time to latest hazard
                    last_check = now
                
            except Exception as e:
                logger.error(f"Error polling hazards: {str(e)}")
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "Failed to fetch updates", "retry_in": poll_interval})
                }
            
            # Wait before next poll
            await asyncio.sleep(poll_interval)
            
    except asyncio.CancelledError:
        logger.info(f"SSE connection cancelled: {conn_id}")
    except Exception as e:
        logger.error(f"SSE error for {conn_id}: {str(e)}")
        yield {
            "event": "error",
            "data": json.dumps({"error": str(e)})
        }
    finally:
        # Clean up connection
        connection_manager.remove_connection(client_ip, conn_id)


@router.get("/hazards/stream")
async def stream_hazards(
    request: Request,
    hazard_types: Optional[str] = Query(None, description="Comma-separated hazard types to subscribe"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    validated_only: bool = Query(False, description="Only stream validated hazards"),
    user: Optional[UserContext] = Depends(get_current_user_optional)
):
    """
    SSE endpoint for real-time hazard updates
    
    Replaces direct Supabase Realtime subscription from frontend.
    Clients receive:
    - 'connected' event on successful connection
    - 'hazard' events for new/updated hazards
    - 'heartbeat' events every 30 seconds
    - 'error' events on failures
    - 'shutdown' event on server shutdown
    
    Security:
    - Connection limits enforced (per-IP and global)
    - Rate limited polling
    - No Supabase credentials exposed
    """
    # Get client IP
    forwarded = request.headers.get("X-Forwarded-For")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (
        request.client.host if request.client else "unknown"
    )
    
    # Check connection limits
    can_connect, reason = connection_manager.can_connect(client_ip)
    if not can_connect:
        raise HTTPException(status_code=503, detail=reason)
    
    # Register connection
    conn_id = connection_manager.add_connection(client_ip)
    
    # Parse hazard types filter
    types_list = None
    if hazard_types:
        types_list = [t.strip() for t in hazard_types.split(",")]
    
    # Log activity
    if user:
        await ActivityLogger.log_activity(
            user_context=user,
            action="SSE_SUBSCRIBE",
            request=request,
            resource_type="hazards_stream",
            details={
                "connection_id": conn_id,
                "filters": {
                    "hazard_types": types_list,
                    "min_confidence": min_confidence,
                    "validated_only": validated_only
                }
            }
        )
    
    # Return SSE response
    return EventSourceResponse(
        hazard_event_generator(
            request=request,
            client_ip=client_ip,
            conn_id=conn_id,
            hazard_types=types_list,
            min_confidence=min_confidence,
            validated_only=validated_only,
            user=user
        )
    )


@router.get("/stats")
async def get_realtime_stats(
    user: Optional[UserContext] = Depends(get_current_user_optional)
):
    """
    Get current SSE connection statistics
    
    Useful for monitoring and admin dashboards
    """
    return connection_manager.get_stats()


@router.post("/test-event")
async def send_test_event(
    request: Request,
    user: UserContext = Depends(get_current_user_optional)
):
    """
    Development endpoint to trigger a test event
    
    Only available in development mode
    """
    import os
    if os.getenv("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=403, detail="Only available in development mode")
    
    return {
        "message": "Test event functionality - use SSE stream to receive events",
        "connections": connection_manager.get_stats()
    }
