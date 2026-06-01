"""Outbox model for transactional event publishing."""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean
from src.infrastructure.database.base import Base


class AuctionOutbox(Base):
    """Outbox table for reliable event publishing."""
    __tablename__ = "auction_outbox"
    
    event_id = Column(String(36), primary_key=True)
    auction_id = Column(String(36), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)  # BID_CREATED, AUCTION_ENDED, etc
    payload = Column(Text, nullable=False)  # JSON serialized event
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    failed = Column(Boolean, default=False, nullable=False)  # Permanent failure flag
    error_message = Column(String(255), nullable=True)
    
    def is_pending(self) -> bool:
        """Check if event not yet published."""
        return self.published_at is None and not self.failed
    
    def mark_published(self) -> None:
        """Mark as successfully published."""
        self.published_at = datetime.utcnow()
        self.retry_count = 0
    
    def increment_retry(self, error: str = None) -> None:
        """Increment retry count."""
        self.retry_count += 1
        if error:
            self.error_message = error[:255]
    
    def mark_failed(self, error: str = None) -> None:
        """Mark as permanently failed."""
        self.failed = True
        self.error_message = error[:255] if error else "Max retries exceeded"
