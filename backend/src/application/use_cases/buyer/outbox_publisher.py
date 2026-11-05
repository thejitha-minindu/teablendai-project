# Outbox publisher - publishes events with retry logic.
import asyncio
import json
from dataclasses import dataclass
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import Session
from src.infrastructure.repositories.outbox_repository import OutboxRepository
from src.domain.services.buyer.connection_manager import IConnectionManager
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager
from src.domain.models.outbox import AuctionOutbox
from src.infrastructure.database.base import engine
from src.config import get_settings
import logging

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
POLL_INTERVAL = 2.0


@dataclass(frozen=True)
class PendingEvent:
    event_id: str
    auction_id: str
    payload: str


class OutboxPublisher:
    # Publish events from outbox with retry logic.
    
    def __init__(self, db_session_factory, manager: IConnectionManager = None, poll_interval: float | None = None):
        self.db_session_factory = db_session_factory
        self.manager = manager or auction_ws_manager
        self.running = False
        self._missing_table_warning_logged = False
        self.poll_interval = get_settings().OUTBOX_POLL_INTERVAL_SECONDS if poll_interval is None else poll_interval
        if self.poll_interval <= 0:
            raise ValueError("Outbox poll interval must be positive")
        self._task = None
        self._stop_event = asyncio.Event()
        self._publish_lock = asyncio.Lock()
    
    async def start(self) -> None:
        # Start background publisher task.
        if self._task is not None and not self._task.done():
            return
        self.running = True
        self._stop_event.clear()
        logger.info("Outbox publisher started (%ss intervals)", self.poll_interval)
        self._task = asyncio.create_task(self._run())
    
    async def stop(self) -> None:
        # Stop background publisher.
        self.running = False
        self._stop_event.set()
        if self._task is not None:
            await self._task
            self._task = None
        logger.info("Outbox publisher stopped")
    
    async def _run(self) -> None:
        # Background polling task.
        while self.running:
            try:
                await self._publish_pending()
            except Exception as e:
                logger.error(f"Outbox publisher error: {e}")
            
            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=self.poll_interval)
            except asyncio.TimeoutError:
                pass
    
    async def _publish_pending(self) -> None:
        # Never keep a session or a read transaction open while awaiting sockets.
        async with self._publish_lock:
            pending = await asyncio.to_thread(self._load_pending)
            deliveries = []
            for event in pending:
                error = await self._publish_event(event)
                deliveries.append((event.event_id, error))
            if deliveries:
                await asyncio.to_thread(self._record_deliveries, deliveries)

    def _load_pending(self) -> list[PendingEvent]:
        db = self.db_session_factory()
        try:
            repo = OutboxRepository(db)
            return [
                PendingEvent(str(event.event_id), str(event.auction_id), event.payload)
                for event in repo.get_pending_events(limit=50)
            ]
        except ProgrammingError as exc:
            # Gracefully handle environments where migrations are not applied yet.
            message = str(exc).lower()
            if "invalid object name" in message and "auction_outbox" in message:
                if not self._missing_table_warning_logged:
                    logger.warning(
                        "Outbox table 'auction_outbox' is missing. Run DB migrations. "
                        "Outbox publisher will keep running and retry later."
                    )
                    self._missing_table_warning_logged = True
                return []
            else:
                raise
        finally:
            db.close()
    
    async def _publish_event(self, event: PendingEvent) -> str | None:
        # Publish single event with retry logic.
        try:
            # Parse payload
            payload = json.loads(event.payload)
            
            # Publish via WebSocket
            await self.manager.broadcast(
                room_id=event.auction_id,
                message=payload
            )
            
            logger.debug(f"Published outbox event: {event.event_id}")
            return None
        except Exception as e:
            return str(e)

    def _record_deliveries(self, deliveries: list[tuple[str, str | None]]) -> None:
        # A separate, short transaction acknowledges the batch in its own thread.
        db = self.db_session_factory()
        try:
            for event_id, error in deliveries:
                event = db.get(AuctionOutbox, event_id)
                if event is None or not event.is_pending():
                    continue
                if error is None:
                    event.mark_published()
                elif event.retry_count < MAX_RETRIES:
                    event.increment_retry(error)
                    logger.warning("Retry %s/%s for %s: %s", event.retry_count, MAX_RETRIES, event_id, error)
                else:
                    event.mark_failed(error)
                    logger.error("Failed to publish %s after %s retries", event_id, MAX_RETRIES)
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()


# Global instance
_publisher = None


def init_outbox_publisher(db_session_factory, manager: IConnectionManager = None):
    # Initialize outbox publisher.
    global _publisher
    _publisher = OutboxPublisher(db_session_factory, manager)


def ensure_outbox_table_exists() -> None:
    """Create outbox table if missing so publisher can start safely."""
    try:
        AuctionOutbox.__table__.create(bind=engine, checkfirst=True)
        logger.info("Outbox table check completed")
    except Exception:
        logger.exception("Failed to ensure outbox table exists")


async def start_outbox_publisher() -> None:
    # Start publisher background task.
    if _publisher:
        await _publisher.start()


async def stop_outbox_publisher() -> None:
    # Stop publisher background task.
    if _publisher:
        await _publisher.stop()


def get_outbox_publisher() -> OutboxPublisher:
    # Get publisher instance.
    return _publisher
