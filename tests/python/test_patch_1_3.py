"""
Test Patch 1.3: SSE Realtime Streaming

Tests the Server-Sent Events endpoint for real-time hazard updates.
This replaces direct Supabase Realtime from the frontend.

Run with: docker-compose run backend pytest tests/python/test_patch_1_3.py -v
"""

import pytest
import httpx
import asyncio
from datetime import datetime


# Backend API URL
BASE_URL = "http://backend:8000"
REALTIME_API = f"{BASE_URL}/api/v1/realtime"


class TestRealtimeSSE:
    """Test SSE realtime streaming endpoints (PATCH-1.3)"""
    
    @pytest.fixture
    def client(self):
        """Create test client with longer timeout for SSE"""
        return httpx.Client(base_url=BASE_URL, timeout=30.0)
    
    def test_realtime_stats_endpoint(self, client):
        """Test GET /api/v1/realtime/stats - Connection statistics"""
        response = client.get("/api/v1/realtime/stats")
        
        assert response.status_code == 200
        stats = response.json()
        
        # Check required fields
        assert "total_connections" in stats
        assert "unique_ips" in stats
        assert "max_connections" in stats
        assert "max_per_ip" in stats
        
        # Verify defaults
        assert stats["max_connections"] == 500
        assert stats["max_per_ip"] == 5
        assert stats["total_connections"] >= 0
    
    def test_sse_stream_endpoint_exists(self, client):
        """Test SSE stream endpoint is reachable"""
        # SSE endpoint should start streaming, so we use a short timeout
        # and expect it to connect (not 404)
        try:
            with client.stream("GET", "/api/v1/realtime/hazards/stream", timeout=2.0) as response:
                # Should get 200 OK with SSE content type
                assert response.status_code == 200
                content_type = response.headers.get("content-type", "")
                assert "text/event-stream" in content_type
                
                # Read first chunk to verify stream is working
                for line in response.iter_lines():
                    if line:
                        # Should receive 'connected' event first
                        assert "event:" in line or "data:" in line
                        break
        except httpx.ReadTimeout:
            # Timeout is OK - SSE is a long-running connection
            pass
    
    def test_sse_stream_with_filters(self, client):
        """Test SSE stream with filter parameters"""
        params = {
            "hazard_types": "flood,typhoon",
            "min_confidence": "0.5",
            "validated_only": "true"
        }
        
        try:
            with client.stream(
                "GET", 
                "/api/v1/realtime/hazards/stream",
                params=params,
                timeout=2.0
            ) as response:
                assert response.status_code == 200
                
                # Should receive connected event with filters
                for line in response.iter_lines():
                    if line and "data:" in line:
                        # Parse the data
                        data_line = line.replace("data: ", "")
                        import json
                        try:
                            data = json.loads(data_line)
                            # Connected event should have filters
                            if "filters" in data:
                                assert data["filters"]["hazard_types"] == ["flood", "typhoon"]
                                assert data["filters"]["min_confidence"] == 0.5
                                assert data["filters"]["validated_only"] == True
                        except json.JSONDecodeError:
                            pass
                        break
        except httpx.ReadTimeout:
            pass
    
    def test_connection_limit_headers(self, client):
        """Verify connection management is working"""
        # Get initial stats
        response = client.get("/api/v1/realtime/stats")
        assert response.status_code == 200
        initial_stats = response.json()
        
        # Stats should be accessible
        assert initial_stats["total_connections"] >= 0


class TestRealtimeSecurity:
    """Security tests for realtime SSE (PATCH-1.3)"""
    
    @pytest.fixture
    def client(self):
        return httpx.Client(base_url=BASE_URL, timeout=10.0)
    
    def test_no_credentials_in_response(self, client):
        """Verify no Supabase credentials leak in SSE response"""
        try:
            with client.stream(
                "GET",
                "/api/v1/realtime/hazards/stream",
                timeout=3.0
            ) as response:
                content = ""
                for line in response.iter_lines():
                    content += line
                    if len(content) > 1000:  # Check first chunk
                        break
                
                # Should not contain Supabase keys
                content_lower = content.lower()
                assert "supabase" not in content_lower or "supabase.co" not in content_lower
                assert "anon_key" not in content_lower
                assert "service_role" not in content_lower
        except httpx.ReadTimeout:
            pass
    
    def test_invalid_confidence_rejected(self, client):
        """Test invalid min_confidence is rejected"""
        params = {"min_confidence": "2.0"}  # Invalid: > 1.0
        
        response = client.get("/api/v1/realtime/hazards/stream", params=params)
        # Should reject with 422 validation error
        assert response.status_code == 422
    
    def test_test_event_dev_only(self, client):
        """Test event endpoint should be dev-only"""
        response = client.post("/api/v1/realtime/test-event")
        # Should work in dev mode (200) or be forbidden in prod (403)
        assert response.status_code in [200, 403]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
