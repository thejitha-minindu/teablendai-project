"""Unit tests for rate limiter token bucket."""
import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from src.domain.services.rate_limiter import TokenBucket, RateLimiter


class TestTokenBucket:
    """Test token bucket refill and consumption."""
    
    def test_initial_capacity(self):
        """Bucket starts with full capacity."""
        bucket = TokenBucket(capacity=5, refill_rate_per_second=1.0)
        assert bucket.tokens >= 4.9  # Allow floating point tolerance
    
    def test_consume_token(self):
        """Consuming token reduces count."""
        bucket = TokenBucket(capacity=5, refill_rate_per_second=1.0)
        initial = bucket.tokens
        bucket.consume(1)
        assert bucket.tokens < initial
    
    def test_insufficient_tokens(self):
        """Consume fails when insufficient tokens."""
        bucket = TokenBucket(capacity=2, refill_rate_per_second=0.1)
        bucket.tokens = 0.5
        assert not bucket.consume(1)
    
    def test_refill_over_time(self):
        """Tokens refill after time passes."""
        bucket = TokenBucket(capacity=5, refill_rate_per_second=2.0)
        bucket.tokens = 0
        bucket.last_refill = datetime.now(timezone.utc) - timedelta(seconds=1)
        bucket._refill()
        assert bucket.tokens >= 1.9  # 2 tokens per second


class TestRateLimiter:
    """Test rate limiter for multiple users."""
    
    def test_new_user_allowed(self):
        """New user starts with tokens."""
        limiter = RateLimiter(capacity=5, refill_seconds=30)
        allowed, wait = limiter.is_allowed("user1")
        assert allowed
        assert wait == 0
    
    def test_capacity_exhausted(self):
        """After capacity exhausted, requests denied."""
        limiter = RateLimiter(capacity=2, refill_seconds=30)
        limiter.is_allowed("user2")
        limiter.is_allowed("user2")
        allowed, wait = limiter.is_allowed("user2")
        assert not allowed
        assert wait > 0
    
    def test_separate_buckets_per_user(self):
        """Each user has separate token bucket."""
        limiter = RateLimiter(capacity=2, refill_seconds=30)
        limiter.is_allowed("user3")
        limiter.is_allowed("user3")
        
        # user3 exhausted, but user4 is new
        allowed4, _ = limiter.is_allowed("user4")
        assert allowed4
    
    def test_remaining_tokens(self):
        """Get remaining tokens for user."""
        limiter = RateLimiter(capacity=5, refill_seconds=30)
        remaining = limiter.get_remaining_tokens("user5")
        assert remaining == 5
        
        limiter.is_allowed("user5")
        remaining = limiter.get_remaining_tokens("user5")
        assert remaining < 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
