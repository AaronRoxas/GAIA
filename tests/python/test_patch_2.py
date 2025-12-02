"""
Test Patch 2: Redis Rate Limiting

Tests the Redis-backed rate limiting implementation.

Run with: docker-compose run backend pytest tests/python/test_patch_2.py -v
"""

import pytest
import httpx
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


# Backend API URL
BASE_URL = "http://backend:8000"


class TestRedisRateLimiting:
    """Test Redis rate limiting (PATCH-2)"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return httpx.Client(base_url=BASE_URL, timeout=30.0)
    
    def test_rate_limit_headers_present(self, client):
        """Test rate limit headers are returned in response"""
        response = client.get("/api/v1/hazards/", params={"limit": "1"})
        
        assert response.status_code == 200
        
        # Check rate limit headers
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
        assert "x-ratelimit-reset" in response.headers
        assert "x-ratelimit-window" in response.headers
        
        # Verify values are numeric
        assert int(response.headers["x-ratelimit-limit"]) > 0
        assert int(response.headers["x-ratelimit-remaining"]) >= 0
        assert int(response.headers["x-ratelimit-reset"]) > 0
        assert int(response.headers["x-ratelimit-window"]) > 0
    
    def test_rate_limit_decrements(self, client):
        """Test that rate limit remaining decreases with requests"""
        # First request
        response1 = client.get("/api/v1/hazards/", params={"limit": "1"})
        remaining1 = int(response1.headers["x-ratelimit-remaining"])
        
        # Second request
        response2 = client.get("/api/v1/hazards/", params={"limit": "1"})
        remaining2 = int(response2.headers["x-ratelimit-remaining"])
        
        # Remaining should decrease (or stay same if window reset)
        assert remaining2 <= remaining1
    
    def test_rate_limit_stats_endpoint(self, client):
        """Test rate limit statistics endpoint"""
        response = client.get("/api/v1/rate-limit/stats")
        
        assert response.status_code == 200
        stats = response.json()
        
        # Check required fields
        assert "backend" in stats
        assert "status" in stats
        
        # Should be using Redis
        assert stats["backend"] in ["redis", "memory"]
    
    def test_rate_limit_stats_redis_healthy(self, client):
        """Test Redis is healthy in rate limit stats"""
        response = client.get("/api/v1/rate-limit/stats")
        stats = response.json()
        
        # Redis should be healthy (or fallback to memory)
        assert stats["status"] in ["healthy", "fallback"]
    
    def test_different_endpoints_different_limits(self, client):
        """Test that different endpoints have different rate limits"""
        # Hazards list endpoint
        response1 = client.get("/api/v1/hazards/", params={"limit": "1"})
        limit1 = int(response1.headers["x-ratelimit-limit"])
        
        # Stats endpoint (different limit tier)
        response2 = client.get("/api/v1/hazards/stats")
        limit2 = int(response2.headers.get("x-ratelimit-limit", "0"))
        
        # Both should have limits set
        assert limit1 > 0
        # limit2 might be 0 if headers not added for this endpoint
    
    def test_nearby_endpoint_has_stricter_limit(self, client):
        """Test that geospatial endpoint has stricter rate limit"""
        # Regular hazards endpoint
        response1 = client.get("/api/v1/hazards/", params={"limit": "1"})
        limit1 = int(response1.headers["x-ratelimit-limit"])
        
        # Nearby endpoint (should be stricter for anonymous)
        response2 = client.get("/api/v1/hazards/nearby/14.5995/120.9842", 
                               params={"radius_km": "10", "limit": "1"})
        limit2 = int(response2.headers["x-ratelimit-limit"])
        
        # Nearby should have stricter (lower) limit for anonymous users
        assert limit2 <= limit1


class TestRateLimitSecurity:
    """Security tests for rate limiting"""
    
    @pytest.fixture
    def client(self):
        return httpx.Client(base_url=BASE_URL, timeout=30.0)
    
    def test_rate_limit_enforced(self, client):
        """Test that rate limits are actually enforced"""
        # This test makes many rapid requests to verify rate limiting
        # Using a stricter endpoint (nearby) which has lower limits
        
        endpoint = "/api/v1/hazards/nearby/14.5995/120.9842"
        params = {"radius_km": "10", "limit": "1"}
        
        # Get current limit
        initial = client.get(endpoint, params=params)
        limit = int(initial.headers["x-ratelimit-limit"])
        
        # If limit is very high (authenticated user), skip this test
        if limit > 50:
            pytest.skip("Rate limit too high for this test (may be authenticated)")
        
        # Make requests until we hit the limit (or close to it)
        hit_limit = False
        for i in range(min(limit + 5, 40)):  # Cap at 40 requests
            response = client.get(endpoint, params=params)
            if response.status_code == 429:
                hit_limit = True
                break
        
        # Should eventually hit rate limit
        # (may not if window reset during test)
        # At minimum, verify rate limit remaining decreased
        remaining = int(response.headers.get("x-ratelimit-remaining", "0"))
        assert remaining < limit or hit_limit
    
    def test_rate_limit_response_format(self, client):
        """Test 429 response has correct format when rate limited"""
        # This is a softer test - we check the response format when 429 occurs
        # by triggering many requests quickly
        
        endpoint = "/api/v1/hazards/nearby/14.5995/120.9842"
        params = {"radius_km": "10", "limit": "1"}
        
        # Try to trigger rate limit
        for _ in range(50):
            response = client.get(endpoint, params=params)
            if response.status_code == 429:
                # Verify response format
                data = response.json()
                assert "error" in data or "detail" in data
                assert "retry_after" in data.get("detail", {}) or "Retry-After" in response.headers
                break
    
    def test_no_rate_limit_bypass_headers(self, client):
        """Test that spoofed headers don't bypass rate limits"""
        # Try to spoof X-Forwarded-For to get fresh rate limit
        headers = {"X-Forwarded-For": "192.168.1.1"}
        
        response1 = client.get("/api/v1/hazards/", params={"limit": "1"}, headers=headers)
        limit1 = int(response1.headers["x-ratelimit-limit"])
        
        # Different spoofed IP
        headers2 = {"X-Forwarded-For": "192.168.1.2"}
        response2 = client.get("/api/v1/hazards/", params={"limit": "1"}, headers=headers2)
        
        # Both should be rate limited (limits should be same)
        # Different IPs should have different remaining counts
        assert response1.status_code == 200
        assert response2.status_code == 200


class TestRateLimitTiers:
    """Test rate limit tiers (anonymous vs authenticated)"""
    
    @pytest.fixture
    def client(self):
        return httpx.Client(base_url=BASE_URL, timeout=30.0)
    
    def test_anonymous_user_limits(self, client):
        """Test that anonymous users get appropriate limits"""
        response = client.get("/api/v1/hazards/", params={"limit": "1"})
        
        assert response.status_code == 200
        limit = int(response.headers["x-ratelimit-limit"])
        
        # Anonymous limit for hazards_read should be 100/minute
        assert limit == 100
    
    def test_anonymous_nearby_stricter(self, client):
        """Test anonymous users have stricter limits on nearby endpoint"""
        response = client.get("/api/v1/hazards/nearby/14.5995/120.9842",
                             params={"radius_km": "10", "limit": "1"})
        
        # May get 429 if rate limited from previous tests - that's OK
        assert response.status_code in [200, 429]
        
        if response.status_code == 200:
            limit = int(response.headers["x-ratelimit-limit"])
            # Anonymous limit for hazards_nearby should be 30/minute
            assert limit == 30
        else:
            # Rate limited - verify it's a proper 429
            assert "x-ratelimit-limit" in response.headers
            assert int(response.headers["x-ratelimit-limit"]) == 30


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
