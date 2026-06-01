"""Token bucket rate limiter for bid frequency control."""
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class TokenBucket:
    """Token bucket for single user."""
    
    def __init__(self, capacity: int = 5, refill_rate_per_second: float = 5.0 / 30.0):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate_per_second
        self.last_refill = datetime.now(timezone.utc)
    
    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = datetime.now(timezone.utc)
        elapsed = (now - self.last_refill).total_seconds()
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now
    
    def consume(self, amount: int = 1) -> bool:
        """Try to consume tokens. Return True if allowed."""
        self._refill()
        if self.tokens >= amount:
            self.tokens -= amount
            return True
        return False
    
    def time_until_refill(self) -> float:
        """Seconds until 1 token is available."""
        self._refill()
        if self.tokens >= 1:
            return 0
        needed = 1 - self.tokens
        return needed / self.refill_rate


class RateLimiter:
    """Manage rate limits for users bidding."""
    
    def __init__(self, capacity: int = 5, refill_seconds: int = 30):
        self.capacity = capacity
        self.refill_rate = capacity / refill_seconds
        self.buckets: Dict[str, TokenBucket] = {}
    
    def is_allowed(self, user_id: str) -> Tuple[bool, float]:
        """
        Check if user can place bid.
        Return: (allowed, wait_seconds)
        """
        if user_id not in self.buckets:
            self.buckets[user_id] = TokenBucket(self.capacity, self.refill_rate)
        
        bucket = self.buckets[user_id]
        if bucket.consume(1):
            logger.debug(f"Bid allowed for user {user_id}")
            return True, 0
        
        wait_time = bucket.time_until_refill()
        logger.warning(f"Rate limit exceeded for user {user_id}, wait {wait_time:.1f}s")
        return False, wait_time
    
    def get_remaining_tokens(self, user_id: str) -> float:
        """Get remaining tokens for user."""
        if user_id not in self.buckets:
            return self.capacity
        return min(self.capacity, self.buckets[user_id].tokens)


# Global instance
rate_limiter = RateLimiter(capacity=5, refill_seconds=30)
