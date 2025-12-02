"""
Hazards API - Backend Proxy for Hazard Data Access
Replaces direct Supabase client access from frontend

Security: PATCH-1 (Critical Security Fixes)
- No Supabase credentials exposed to frontend
- All queries go through backend with validation
- RBAC enforcement and audit logging
- Rate limiting applied (will be moved to Redis in Patch 2)

Module: GV-02 (Geospatial Visualization), FP-01 to FP-04 (Filtering)
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query, Request, status
from pydantic import BaseModel, Field

from backend.python.lib.supabase_client import supabase
from backend.python.middleware.rbac import UserContext, require_auth, get_current_user_optional
# PATCH-2: Import Redis rate limiter
from backend.python.middleware.redis_rate_limiter import (
    RateLimitHazardsRead,
    RateLimitHazardsNearby,
    RateLimitDefault,
)
from backend.python.middleware.activity_logger import ActivityLogger

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/hazards",
    tags=["Hazards API"],
    responses={404: {"description": "Not found"}},
)


# ============================================================================
# Pydantic Models
# ============================================================================

class HazardResponse(BaseModel):
    """Hazard data response model"""
    id: str
    hazard_type: str
    location_name: str
    latitude: float
    longitude: float
    severity: Optional[str] = None  # Can be null in database
    confidence_score: float
    validated: bool
    source_type: str
    source_url: Optional[str] = None
    source_title: Optional[str] = None  # Match actual database schema
    source_content: Optional[str] = None  # Match actual database schema (was 'description')
    created_at: str
    validated_at: Optional[str] = None
    validated_by: Optional[str] = None
    
    class Config:
        # Allow extra fields from database
        extra = "ignore"


class HazardFilters(BaseModel):
    """Query filters for hazards endpoint"""
    hazard_types: Optional[List[str]] = Field(None, description="Filter by hazard types")
    source_types: Optional[List[str]] = Field(None, description="Filter by source (rss, citizen_report)")
    validated: Optional[bool] = Field(None, description="Filter by validation status")
    min_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    severity: Optional[List[str]] = Field(None, description="Filter by severity")
    time_window_hours: Optional[int] = Field(None, ge=1, le=8760, description="Filter by time window")
    region: Optional[str] = Field(None, description="Filter by Philippine region")
    province: Optional[str] = Field(None, description="Filter by province")
    limit: int = Field(100, ge=1, le=1000, description="Maximum results")
    offset: int = Field(0, ge=0, description="Pagination offset")


class HazardStatsResponse(BaseModel):
    """Hazard statistics response"""
    total_hazards: int
    validated_hazards: int
    unvalidated_hazards: int
    by_type: Dict[str, int]
    by_severity: Dict[str, int]
    by_source: Dict[str, int]
    last_24h: int
    last_7d: int
    last_30d: int


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/", response_model=List[HazardResponse])
async def get_hazards(
    request: Request,
    hazard_types: Optional[str] = Query(None, description="Comma-separated hazard types"),
    source_types: Optional[str] = Query(None, description="Comma-separated source types"),
    validated: Optional[bool] = Query(None, description="Filter by validation status"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0),
    severity: Optional[str] = Query(None, description="Comma-separated severity levels"),
    time_window_hours: Optional[int] = Query(None, ge=1, le=8760),
    region: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user: Optional[UserContext] = Depends(get_current_user_optional),
    _rate_limit: None = Depends(RateLimitHazardsRead)  # PATCH-2: Redis rate limiting
):
    """
    Get hazards with optional filtering
    
    Public endpoint with rate limiting
    Authenticated users get higher rate limits and more details
    """
    try:
        # Build query
        query = supabase.schema("gaia").from_("hazards").select("*")
        
        # Apply filters
        if hazard_types:
            types_list = [t.strip() for t in hazard_types.split(",")]
            query = query.in_("hazard_type", types_list)
        
        if source_types:
            sources_list = [s.strip() for s in source_types.split(",")]
            query = query.in_("source_type", sources_list)
        
        if validated is not None:
            query = query.eq("validated", validated)
        
        if min_confidence is not None:
            query = query.gte("confidence_score", min_confidence)
        
        if severity:
            severity_list = [s.strip() for s in severity.split(",")]
            query = query.in_("severity", severity_list)
        
        if time_window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=time_window_hours)
            query = query.gte("created_at", cutoff.isoformat())
        
        if region:
            query = query.eq("region", region)
        
        if province:
            query = query.eq("province", province)
        
        # Order by newest first
        query = query.order("created_at", desc=True)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        # Log activity (for authenticated users)
        if user:
            await ActivityLogger.log_activity(
                user_context=user,
                action="VIEW_HAZARDS",
                request=request,
                resource_type="hazards",
                details={
                    "filters": {
                        "hazard_types": hazard_types,
                        "source_types": source_types,
                        "validated": validated,
                        "limit": limit,
                        "offset": offset
                    },
                    "results_count": len(response.data) if response.data else 0
                }
            )
        
        return response.data or []
        
    except Exception as e:
        logger.error(f"Error fetching hazards: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch hazards: {str(e)}"
        )


@router.get("/stats", response_model=HazardStatsResponse)
async def get_hazard_stats(
    request: Request,
    user: Optional[UserContext] = Depends(get_current_user_optional),
    _rate_limit: None = Depends(RateLimitDefault)  # PATCH-2: Redis rate limiting
):
    """
    Get hazard statistics
    
    Public endpoint with stricter rate limiting
    """
    try:
        # Get total counts
        total_response = supabase.schema("gaia").from_("hazards").select("id", count="exact").execute()
        total = total_response.count or 0
        
        validated_response = supabase.schema("gaia").from_("hazards").select("id", count="exact").eq("validated", True).execute()
        validated = validated_response.count or 0
        
        # Get counts by type
        type_response = supabase.schema("gaia").from_("hazards").select("hazard_type").execute()
        by_type = {}
        for item in (type_response.data or []):
            htype = item.get("hazard_type") or "unknown"  # Handle None values
            by_type[htype] = by_type.get(htype, 0) + 1
        
        # Get counts by severity
        severity_response = supabase.schema("gaia").from_("hazards").select("severity").execute()
        by_severity = {}
        for item in (severity_response.data or []):
            sev = item.get("severity") or "unassigned"  # Handle None values - use "unassigned" for null severity
            by_severity[sev] = by_severity.get(sev, 0) + 1
        
        # Get counts by source
        source_response = supabase.schema("gaia").from_("hazards").select("source_type").execute()
        by_source = {}
        for item in (source_response.data or []):
            src = item.get("source_type") or "unknown"  # Handle None values
            by_source[src] = by_source.get(src, 0) + 1
        
        # Time-based counts
        now = datetime.utcnow()
        last_24h_response = supabase.schema("gaia").from_("hazards").select("id", count="exact").gte("created_at", (now - timedelta(hours=24)).isoformat()).execute()
        last_7d_response = supabase.schema("gaia").from_("hazards").select("id", count="exact").gte("created_at", (now - timedelta(days=7)).isoformat()).execute()
        last_30d_response = supabase.schema("gaia").from_("hazards").select("id", count="exact").gte("created_at", (now - timedelta(days=30)).isoformat()).execute()
        
        stats = HazardStatsResponse(
            total_hazards=total,
            validated_hazards=validated,
            unvalidated_hazards=total - validated,
            by_type=by_type,
            by_severity=by_severity,
            by_source=by_source,
            last_24h=last_24h_response.count or 0,
            last_7d=last_7d_response.count or 0,
            last_30d=last_30d_response.count or 0
        )
        
        # Log activity
        if user:
            await ActivityLogger.log_activity(
                user_context=user,
                action="VIEW_HAZARD_STATS",
                request=request,
                resource_type="hazard_stats"
            )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching hazard stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch statistics: {str(e)}"
        )


@router.get("/{hazard_id}", response_model=HazardResponse)
async def get_hazard_by_id(
    hazard_id: str,
    request: Request,
    user: Optional[UserContext] = Depends(get_current_user_optional),
    _rate_limit: None = Depends(RateLimitHazardsRead)  # PATCH-2: Redis rate limiting
):
    """
    Get a single hazard by ID
    
    Public endpoint with rate limiting
    """
    try:
        response = supabase.schema("gaia").from_("hazards").select("*").eq("id", hazard_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hazard not found: {hazard_id}"
            )
        
        # Log activity
        if user:
            await ActivityLogger.log_activity(
                user_context=user,
                action="VIEW_HAZARD_DETAIL",
                request=request,
                resource_type="hazard",
                resource_id=hazard_id
            )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching hazard {hazard_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch hazard: {str(e)}"
        )


@router.get("/nearby/{latitude}/{longitude}", response_model=List[HazardResponse])
async def get_nearby_hazards(
    latitude: float,
    longitude: float,
    radius_km: float = Query(50.0, ge=1.0, le=500.0, description="Search radius in kilometers"),
    limit: int = Query(20, ge=1, le=100),
    request: Request = None,
    user: Optional[UserContext] = Depends(get_current_user_optional),
    _rate_limit: None = Depends(RateLimitHazardsNearby)  # PATCH-2: Redis rate limiting
):
    """
    Get hazards near a location using PostGIS spatial query
    
    Public endpoint with stricter rate limiting
    """
    try:
        # Use PostGIS function (must be created in database)
        # This assumes you have a function: get_nearby_hazards(lat, lon, radius_km, limit)
        response = supabase.schema("gaia").rpc(
            "get_nearby_hazards",
            {
                "lat": latitude,
                "lon": longitude,
                "radius_km": radius_km,
                "max_results": limit
            }
        ).execute()
        
        # Log activity
        if user:
            await ActivityLogger.log_activity(
                user_context=user,
                action="SEARCH_NEARBY_HAZARDS",
                request=request,
                resource_type="hazards",
                details={
                    "latitude": latitude,
                    "longitude": longitude,
                    "radius_km": radius_km,
                    "results_count": len(response.data) if response.data else 0
                }
            )
        
        return response.data or []
        
    except Exception as e:
        logger.error(f"Error fetching nearby hazards: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch nearby hazards: {str(e)}"
        )
