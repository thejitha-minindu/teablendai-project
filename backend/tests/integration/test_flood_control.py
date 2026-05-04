"""Integration tests for rate limiting (flood control)."""
import pytest
from src.domain.services.rate_limiter import rate_limiter


class TestRateLimitingIntegration:
    """Test rate limiting prevents bid flooding."""
    
    def test_rate_limit_429_response(self):
        """Exceed rate limit returns 429."""
        limiter = rate_limiter
        user_id = "test_user_flood"
        
        # Exhaust tokens
        for _ in range(5):
            allowed, wait = limiter.is_allowed(user_id)
            assert allowed
        
        # Next should fail
        allowed, wait = limiter.is_allowed(user_id)
        assert not allowed
        assert wait > 0
    
    def test_rate_limit_isolation(self):
        """Rate limit per user isolated."""
        u1 = "user_isolated_1"
        u2 = "user_isolated_2"
        
        # User 1 exhausts
        for _ in range(5):
            rate_limiter.is_allowed(u1)
        
        # User 2 still has tokens
        allowed, wait = rate_limiter.is_allowed(u2)
        assert allowed


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
