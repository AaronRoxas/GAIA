"""
PATCH-5: Redis Response Caching Tests
Security Focus: Availability (CIA Triad) - Fast response times

Tests:
1. Redis cache connection and initialization
2. Cache key generation
3. Serialization/compression
4. Cache get/set operations
5. TTL expiration
6. Cache invalidation
7. Cache stats endpoint
8. Integration with API endpoints
"""

import pytest
import asyncio
import json
import time
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

# Import caching module
import sys
from pathlib import Path
project_root = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(project_root))


# =============================================================================
# UNIT TESTS: Cache Key Generation
# =============================================================================

class TestCacheKeyGeneration:
    """Test cache key generation functions."""
    
    def test_key_generation_simple(self):
        """Test simple cache key generation."""
        from backend.python.middleware.redis_cache import generate_cache_key, CACHE_PREFIX
        
        key = generate_cache_key("analytics", "stats")
        assert key.startswith(CACHE_PREFIX)
        assert "analytics" in key
        assert "stats" in key
    
    def test_key_generation_with_kwargs(self):
        """Test cache key generation with keyword arguments."""
        from backend.python.middleware.redis_cache import generate_cache_key, CACHE_PREFIX
        
        key = generate_cache_key("admin", "activity", user_id="123", limit=50)
        assert "user_id=123" in key
        assert "limit=50" in key
    
    def test_key_generation_none_values_excluded(self):
        """Test that None values are excluded from keys."""
        from backend.python.middleware.redis_cache import generate_cache_key
        
        key = generate_cache_key("hazards", "list", status=None, region="NCR")
        assert "status" not in key
        assert "region=NCR" in key
    
    def test_key_generation_deterministic(self):
        """Test that key generation is deterministic."""
        from backend.python.middleware.redis_cache import generate_cache_key
        
        key1 = generate_cache_key("api", "data", a="1", b="2", c="3")
        key2 = generate_cache_key("api", "data", c="3", a="1", b="2")  # Different order
        assert key1 == key2  # Should be same due to sorted kwargs
    
    def test_key_generation_long_key_hashing(self):
        """Test that long keys are hashed."""
        from backend.python.middleware.redis_cache import generate_cache_key
        
        # Create a very long key
        long_value = "x" * 300
        key = generate_cache_key("analytics", "data", long_param=long_value)
        
        # Should be hashed to < 200 chars
        assert len(key) < 200


# =============================================================================
# UNIT TESTS: Serialization
# =============================================================================

class TestSerialization:
    """Test value serialization and deserialization."""
    
    def test_serialize_simple_dict(self):
        """Test serializing a simple dictionary."""
        from backend.python.middleware.redis_cache import serialize_value, deserialize_value
        
        data = {"status": "success", "count": 42}
        serialized = serialize_value(data)
        deserialized = deserialize_value(serialized)
        
        assert deserialized == data
    
    def test_serialize_list(self):
        """Test serializing a list."""
        from backend.python.middleware.redis_cache import serialize_value, deserialize_value
        
        data = [1, 2, 3, "test", {"nested": True}]
        serialized = serialize_value(data)
        deserialized = deserialize_value(serialized)
        
        assert deserialized == data
    
    def test_serialize_datetime_handling(self):
        """Test that datetime objects are handled (as strings)."""
        from backend.python.middleware.redis_cache import serialize_value, deserialize_value
        
        # Datetime should be pre-converted to string before caching
        data = {"timestamp": "2024-01-01T00:00:00Z", "value": 100}
        serialized = serialize_value(data)
        deserialized = deserialize_value(serialized)
        
        assert deserialized["timestamp"] == "2024-01-01T00:00:00Z"
    
    def test_compression_for_large_data(self):
        """Test that large data is compressed."""
        from backend.python.middleware.redis_cache import serialize_value, COMPRESSION_THRESHOLD
        
        # Create data larger than compression threshold
        large_data = {"data": "x" * (COMPRESSION_THRESHOLD + 100)}
        serialized = serialize_value(large_data)
        
        # Compressed data should start with special marker
        assert serialized.startswith("COMPRESSED:") or len(serialized) < len(json.dumps(large_data))


# =============================================================================
# UNIT TESTS: TTL Configuration
# =============================================================================

class TestTTLConfiguration:
    """Test cache TTL configurations."""
    
    def test_ttl_values_defined(self):
        """Test that TTL values are defined for key prefixes."""
        from backend.python.middleware.redis_cache import CACHE_TTLS
        
        # Check required TTL configurations exist
        assert "analytics:stats" in CACHE_TTLS
        assert "analytics:trends" in CACHE_TTLS
        assert "analytics:regions" in CACHE_TTLS
        assert "admin:activity" in CACHE_TTLS
        assert "hazards:list" in CACHE_TTLS
    
    def test_ttl_values_reasonable(self):
        """Test that TTL values are within reasonable bounds."""
        from backend.python.middleware.redis_cache import CACHE_TTLS, MAX_TTL
        
        for key, ttl in CACHE_TTLS.items():
            assert ttl > 0, f"TTL for {key} should be positive"
            assert ttl <= MAX_TTL, f"TTL for {key} should not exceed MAX_TTL"
    
    def test_realtime_data_short_ttl(self):
        """Test that real-time data has short TTLs."""
        from backend.python.middleware.redis_cache import CACHE_TTLS
        
        # Real-time sensitive data should have TTL <= 30s
        assert CACHE_TTLS.get("analytics:alerts", 60) <= 30
        assert CACHE_TTLS.get("hazards:list", 60) <= 30


# =============================================================================
# ASYNC TESTS: Redis Operations
# =============================================================================

@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    mock = AsyncMock()
    mock.ping = AsyncMock(return_value=True)
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock(return_value=True)
    mock.delete = AsyncMock(return_value=1)
    mock.scan = AsyncMock(return_value=(0, []))
    mock.info = AsyncMock(return_value={"used_memory_human": "1M", "used_memory_peak_human": "2M"})
    mock.close = AsyncMock()
    return mock


class TestCacheOperations:
    """Test async cache operations."""
    
    @pytest.mark.asyncio
    async def test_get_or_set_cache_miss(self, mock_redis):
        """Test get_or_set on cache miss."""
        from backend.python.middleware.redis_cache import get_or_set, CACHE_PREFIX
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.get.return_value = None  # Cache miss
            
            result = {"data": "fresh"}
            
            async def fetch_func():
                return result
            
            value = await get_or_set("test:key", fetch_func, ttl=60)
            
            # Should call fetch function and return result
            assert value == result
            # Should try to get from cache first
            mock_redis.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_or_set_cache_hit(self, mock_redis):
        """Test get_or_set on cache hit."""
        from backend.python.middleware.redis_cache import get_or_set, serialize_value
        
        cached_data = {"data": "cached"}
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.get.return_value = serialize_value(cached_data)
            
            async def fetch_func():
                return {"data": "should_not_be_called"}
            
            value = await get_or_set("test:key", fetch_func, ttl=60)
            
            # Should return cached value
            assert value == cached_data
            # Should not set cache again
            mock_redis.set.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_cache_invalidation(self, mock_redis):
        """Test cache invalidation by pattern."""
        from backend.python.middleware.redis_cache import invalidate_pattern, CACHE_PREFIX
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.scan.return_value = (0, [f"{CACHE_PREFIX}analytics:stats"])
            
            count = await invalidate_pattern("analytics:*")
            
            # Should delete matched keys
            mock_redis.delete.assert_called()


# =============================================================================
# ASYNC TESTS: Cache Stats
# =============================================================================

class TestCacheStats:
    """Test cache statistics functions."""
    
    @pytest.mark.asyncio
    async def test_get_cache_stats(self, mock_redis):
        """Test getting cache statistics."""
        from backend.python.middleware.redis_cache import get_cache_stats
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.info.return_value = {
                "used_memory_human": "1.5M",
                "used_memory_peak_human": "2M"
            }
            mock_redis.scan.return_value = (0, ["key1", "key2", "key3"])
            
            stats = await get_cache_stats()
            
            assert stats["backend"] == "redis"
            assert stats["status"] == "healthy"
            assert stats["used_memory"] == "1.5M"
            assert stats["total_keys"] == 3
    
    @pytest.mark.asyncio
    async def test_get_cache_stats_error(self, mock_redis):
        """Test cache stats when Redis is unavailable."""
        from backend.python.middleware.redis_cache import get_cache_stats
        
        with patch('backend.python.middleware.redis_cache.get_redis', side_effect=Exception("Connection failed")):
            stats = await get_cache_stats()
            
            assert stats["status"] == "error"
            assert "error" in stats


# =============================================================================
# ASYNC TESTS: Clear Cache
# =============================================================================

class TestClearCache:
    """Test cache clearing functions."""
    
    @pytest.mark.asyncio
    async def test_clear_all_cache(self, mock_redis):
        """Test clearing all cache entries."""
        from backend.python.middleware.redis_cache import clear_all_cache, CACHE_PREFIX
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.scan.return_value = (0, [f"{CACHE_PREFIX}key1", f"{CACHE_PREFIX}key2"])
            mock_redis.delete.return_value = 2
            
            count = await clear_all_cache()
            
            assert count == 2
            mock_redis.delete.assert_called()


# =============================================================================
# INTEGRATION TESTS: API Endpoints
# =============================================================================

class TestCacheEndpoints:
    """Test cache-related API endpoints."""
    
    @pytest.mark.asyncio
    async def test_cache_stats_endpoint(self, mock_redis):
        """Test cache stats function (simulating endpoint)."""
        from backend.python.middleware.redis_cache import get_cache_stats
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.info.return_value = {"used_memory_human": "1M", "used_memory_peak_human": "2M"}
            mock_redis.scan.return_value = (0, [])
            
            stats = await get_cache_stats()
            
            assert stats["backend"] == "redis"
            assert stats["status"] == "healthy"
            assert stats["used_memory"] == "1M"
    
    @pytest.mark.asyncio
    async def test_cache_clear_endpoint(self, mock_redis):
        """Test cache clear function (simulating endpoint)."""
        from backend.python.middleware.redis_cache import clear_all_cache
        
        with patch('backend.python.middleware.redis_cache.get_redis', return_value=mock_redis):
            mock_redis.scan.return_value = (0, [])
            mock_redis.delete.return_value = 0
            
            count = await clear_all_cache()
            
            assert count == 0  # No keys to delete


# =============================================================================
# PERFORMANCE TESTS
# =============================================================================

class TestCachePerformance:
    """Test cache performance characteristics."""
    
    def test_key_generation_performance(self):
        """Test that key generation is fast."""
        from backend.python.middleware.redis_cache import generate_cache_key
        
        start = time.time()
        
        for i in range(1000):
            generate_cache_key("analytics", "stats", iteration=i, user_id="test")
        
        elapsed = time.time() - start
        
        # 1000 key generations should take < 100ms
        assert elapsed < 0.1, f"Key generation too slow: {elapsed}s"
    
    def test_serialization_performance(self):
        """Test that serialization is fast for typical data."""
        from backend.python.middleware.redis_cache import serialize_value, deserialize_value
        
        # Typical API response
        data = {
            "status": "success",
            "data": [
                {"id": i, "name": f"item_{i}", "value": i * 100}
                for i in range(100)
            ],
            "total": 100,
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
        start = time.time()
        
        for _ in range(100):
            serialized = serialize_value(data)
            deserialize_value(serialized)
        
        elapsed = time.time() - start
        
        # 100 serialize/deserialize cycles should take < 100ms
        assert elapsed < 0.1, f"Serialization too slow: {elapsed}s"


# =============================================================================
# EDGE CASE TESTS
# =============================================================================

class TestCacheEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_value_serialization(self):
        """Test serializing empty values."""
        from backend.python.middleware.redis_cache import serialize_value, deserialize_value
        
        # Empty dict
        assert deserialize_value(serialize_value({})) == {}
        
        # Empty list
        assert deserialize_value(serialize_value([])) == []
        
        # None
        assert deserialize_value(serialize_value(None)) is None
    
    def test_special_characters_in_key(self):
        """Test cache keys with special characters."""
        from backend.python.middleware.redis_cache import generate_cache_key
        
        # Should handle special characters gracefully
        key = generate_cache_key("api", "search", query="test & query", filter="a=b&c=d")
        assert ":" in key  # Should still be a valid Redis key
    
    def test_unicode_in_value(self):
        """Test serializing Unicode values."""
        from backend.python.middleware.redis_cache import serialize_value, deserialize_value
        
        data = {
            "location": "Maynila, Pilipinas",
            "hazard": "Bagyong 台风",
            "emoji": "🌊⚠️🔥"
        }
        
        serialized = serialize_value(data)
        deserialized = deserialize_value(serialized)
        
        assert deserialized == data


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
