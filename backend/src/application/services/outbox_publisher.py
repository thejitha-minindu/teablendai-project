"""Outbox publisher - publishes events with retry logic."""
import asyncio
import json
from sqlalchemy.orm import Session
from src.infrastructure.repositories.outbox_repository import OutboxRepository
from src.domain.services.buyer.connection_manager import IConnectionManager
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager
import logging

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
POLL_INTERVAL = 0.1  # 100ms


class OutboxPublisher:
    """Publish events from outbox with retry logic."""
    
    def __init__(self, db_session_factory, manager: IConnectionManager = None):
        self.db_session_factory = db_session_factory
        self.manager = manager or auction_ws_manager
        self.running = False
    
    async def start(self) -> None:
        """Start background publisher task."""
        self.running = True
        logger.info("Outbox publisher started")
        asyncio.create_task(self._run())
    
    async def stop(self) -> None:
        """Stop background publisher."""
        self.running = False
        logger.info("Outbox publisher stopped")
    
    async def _run(self) -> None:
        """Background polling task."""
        while self.running:
            try:
                await self._publish_pending()
            except Exception as e:
                logger.error(f"Outbox publisher error: {e}")
            
            await asyncio.sleep(POLL_INTERVAL)
    
    async def _publish_pending(self) -> None:
        """Fetch and publish pending events."""
        db = self.db_session_factory()
        try:
            repo = OutboxRepository(db)
            pending = repo.get_pending_events(limit=50)
            
            for event in pending:
                await self._publish_event(event, repo)
        finally:
            db.close()
    
    async def _publish_event(self, event, repo: OutboxRepository) -> None:
        """Publish single event with retry logic."""
        try:
            # Parse payload
            payload = json.loads(event.payload)
            
            # Publish via WebSocket
            await self.manager.broadcast(
                room_id=event.auction_id,
                message=payload
            )
            
            # Mark as published
            repo.mark_published(event.event_id)
            logger.debug(f"Published outbox event: {event.event_id}")
        
        except Exception as e:
            # Retry logic
            if event.retry_count < MAX_RETRIES:
                repo.increment_retry(event.event_id, str(e))
                logger.warning(f"Retry {event.retry_count}/{MAX_RETRIES} for {event.event_id}: {e}")
            else:
                repo.mark_failed(event.event_id, str(e))
                logger.error(f"Failed to publish {event.event_id} after {MAX_RETRIES} retries")


# Global instance
_publisher = None


def init_outbox_publisher(db_session_factory, manager: IConnectionManager = None):
    """Initialize outbox publisher."""
    global _publisher
    _publisher = OutboxPublisher(db_session_factory, manager)


async def start_outbox_publisher() -> None:
    """Start publisher background task."""
    if _publisher:
        await _publisher.start()


async def stop_outbox_publisher() -> None:
    """Stop publisher background task."""
    if _publisher:
        await _publisher.stop()


def get_outbox_publisher() -> OutboxPublisher:
    """Get publisher instance."""
    return _publisher
