"""Outbox repository for event persistence."""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_
from src.domain.models.outbox import AuctionOutbox
import logging

logger = logging.getLogger(__name__)


class OutboxRepository:
    """Manage outbox event persistence and retrieval."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def save_event(self, event_id: str, auction_id: str, event_type: str, payload: str) -> AuctionOutbox:
        """Save event to outbox (part of transaction)."""
        outbox = AuctionOutbox(
            event_id=event_id,
            auction_id=auction_id,
            event_type=event_type,
            payload=payload
        )
        self.db.add(outbox)
        return outbox
    
    def get_pending_events(self, limit: int = 100) -> list:
        """Get unpublished events ordered by creation time."""
        return self.db.query(AuctionOutbox).filter(
            and_(AuctionOutbox.published_at == None, AuctionOutbox.failed == False)
        ).order_by(AuctionOutbox.created_at.asc()).limit(limit).all()
    
    def get_event_by_id(self, event_id: str) -> AuctionOutbox:
        """Get event by ID."""
        return self.db.query(AuctionOutbox).filter(AuctionOutbox.event_id == event_id).first()
    
    def mark_published(self, event_id: str) -> None:
        """Mark event as published."""
        event = self.get_event_by_id(event_id)
        if event:
            event.mark_published()
            self.db.commit()
            logger.debug(f"Outbox event published: {event_id}")
    
    def increment_retry(self, event_id: str, error: str = None) -> None:
        """Increment retry count."""
        event = self.get_event_by_id(event_id)
        if event:
            event.increment_retry(error)
            self.db.commit()
    
    def mark_failed(self, event_id: str, error: str = None) -> None:
        """Mark as permanently failed."""
        event = self.get_event_by_id(event_id)
        if event:
            event.mark_failed(error)
            self.db.commit()
            logger.error(f"Outbox event failed: {event_id} - {error}")
    
    def cleanup_published(self, days: int = 7) -> int:
        """Delete published events older than N days."""
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = self.db.query(AuctionOutbox).filter(
            and_(AuctionOutbox.published_at != None, AuctionOutbox.published_at < cutoff)
        ).delete()
        self.db.commit()
        logger.info(f"Cleaned up {result} old outbox events")
        return result
