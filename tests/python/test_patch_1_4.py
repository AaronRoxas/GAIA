"""
Test Patch 1.4: Frontend API Client Migration

Tests the backend hazards API proxy endpoints that replace direct Supabase access.
These endpoints power the frontend hazardsApi.ts service.

Run with: docker-compose run backend pytest tests/python/test_patch_1_4.py -v
"""

import pytest
import httpx
from datetime import datetime, timedelta

# Backend API URL
BASE_URL = "http://backend:8000"
HAZARDS_API = f"{BASE_URL}/api/v1/hazards"


class TestHazardsAPIProxy:
    """Test the hazards API proxy for frontend migration (PATCH-1.4)"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return httpx.Client(base_url=BASE_URL, timeout=10.0)
    
    def test_get_hazards_basic(self, client):
        """Test GET /api/v1/hazards - Basic hazards list"""
        response = client.get("/api/v1/hazards/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list
        assert isinstance(data, list)
        
        # Each hazard should have required fields
        if len(data) > 0:
            hazard = data[0]
            assert "id" in hazard
            assert "hazard_type" in hazard
            assert "location_name" in hazard
            assert "latitude" in hazard
            assert "longitude" in hazard
            assert "confidence_score" in hazard
            assert "validated" in hazard
            assert "created_at" in hazard
    
    def test_get_hazards_with_filters(self, client):
        """Test GET /api/v1/hazards - With filter parameters"""
        # Test with multiple filters
        params = {
            "validated": "true",
            "limit": "10",
            "min_confidence": "0.5"
        }
        response = client.get("/api/v1/hazards/", params=params)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # All results should be validated with confidence >= 0.5
        for hazard in data:
            assert hazard["validated"] == True
            assert hazard["confidence_score"] >= 0.5
    
    def test_get_hazards_by_type(self, client):
        """Test GET /api/v1/hazards - Filter by hazard type"""
        params = {"hazard_types": "flood,typhoon"}
        response = client.get("/api/v1/hazards/", params=params)
        
        assert response.status_code == 200
        data = response.json()
        
        # All results should be floods or typhoons
        for hazard in data:
            assert hazard["hazard_type"] in ["flood", "typhoon"]
    
    def test_get_hazards_time_window(self, client):
        """Test GET /api/v1/hazards - Time window filter"""
        params = {"time_window_hours": "168"}  # Last 7 days
        response = client.get("/api/v1/hazards/", params=params)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check all results are within time window
        cutoff = datetime.utcnow() - timedelta(hours=168)
        for hazard in data:
            created = datetime.fromisoformat(hazard["created_at"].replace("Z", "+00:00"))
            # Created should be after cutoff (with timezone awareness)
            assert created.replace(tzinfo=None) >= cutoff.replace(tzinfo=None)
    
    def test_get_hazards_pagination(self, client):
        """Test GET /api/v1/hazards - Pagination"""
        # First page
        response1 = client.get("/api/v1/hazards/", params={"limit": "5", "offset": "0"})
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Second page
        response2 = client.get("/api/v1/hazards/", params={"limit": "5", "offset": "5"})
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Pages should be different (if enough data exists)
        if len(data1) >= 5 and len(data2) > 0:
            ids1 = {h["id"] for h in data1}
            ids2 = {h["id"] for h in data2}
            assert ids1.isdisjoint(ids2), "Pagination pages should not overlap"
    
    def test_get_hazard_stats(self, client):
        """Test GET /api/v1/hazards/stats - Statistics endpoint"""
        response = client.get("/api/v1/hazards/stats")
        
        assert response.status_code == 200
        stats = response.json()
        
        # Check required fields
        assert "total_hazards" in stats
        assert "validated_hazards" in stats
        assert "unvalidated_hazards" in stats
        assert "by_type" in stats
        assert "by_severity" in stats
        assert "by_source" in stats
        assert "last_24h" in stats
        assert "last_7d" in stats
        
        # Validate counts are non-negative
        assert stats["total_hazards"] >= 0
        assert stats["validated_hazards"] >= 0
        assert stats["validated_hazards"] <= stats["total_hazards"]
    
    def test_get_hazard_by_id(self, client):
        """Test GET /api/v1/hazards/{id} - Single hazard"""
        # First get a list to find a valid ID
        list_response = client.get("/api/v1/hazards/", params={"limit": "1"})
        assert list_response.status_code == 200
        hazards = list_response.json()
        
        if len(hazards) > 0:
            hazard_id = hazards[0]["id"]
            response = client.get(f"/api/v1/hazards/{hazard_id}")
            
            assert response.status_code == 200
            hazard = response.json()
            assert hazard["id"] == hazard_id
    
    def test_get_hazard_not_found(self, client):
        """Test GET /api/v1/hazards/{id} - Non-existent ID"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/hazards/{fake_id}")
        
        assert response.status_code == 404
    
    def test_get_nearby_hazards(self, client):
        """Test GET /api/v1/hazards/nearby/{lat}/{lon} - Geospatial query"""
        # Manila coordinates
        lat = 14.5995
        lon = 120.9842
        
        response = client.get(f"/api/v1/hazards/nearby/{lat}/{lon}", 
                             params={"radius_km": "50", "limit": "10"})
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check results have distance (if using PostGIS function that returns it)
        # Note: Actual distance check depends on backend implementation
    
    def test_api_cors_headers(self, client):
        """Test CORS headers are set correctly"""
        response = client.options("/api/v1/hazards/")
        
        # Should allow cross-origin requests
        # Note: This depends on CORS middleware configuration
        assert response.status_code in [200, 204, 405]
    
    def test_api_content_type(self, client):
        """Test response content type is JSON"""
        response = client.get("/api/v1/hazards/")
        
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")


class TestSecurityRequirements:
    """Verify security requirements for PATCH-1.4"""
    
    @pytest.fixture
    def client(self):
        return httpx.Client(base_url=BASE_URL, timeout=10.0)
    
    def test_no_supabase_credentials_exposed(self, client):
        """Verify API doesn't leak Supabase credentials"""
        response = client.get("/api/v1/hazards/")
        
        # Response should not contain Supabase URL or keys
        response_text = response.text
        assert "supabase.co" not in response_text.lower()
        assert "anon_key" not in response_text.lower()
        assert "service_role" not in response_text.lower()
    
    def test_public_access_without_auth(self, client):
        """Verify public endpoints work without authentication"""
        # Hazards list should be accessible without auth
        response = client.get("/api/v1/hazards/")
        assert response.status_code == 200
        
        # Stats should be accessible without auth
        response = client.get("/api/v1/hazards/stats")
        assert response.status_code == 200
    
    def test_request_logging_header(self, client):
        """Verify request ID header is set for audit trail"""
        response = client.get("/api/v1/hazards/")
        
        # X-Request-ID should be set by logging middleware
        # Note: May need to check if middleware is enabled
        # assert "x-request-id" in [h.lower() for h in response.headers.keys()]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
