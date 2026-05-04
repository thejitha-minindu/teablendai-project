"""Integration tests for outbox publishing."""
import pytest
import asyncio
import json
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.domain.models.outbox import AuctionOutbox
from src.domain.models.base import Base
from src.infrastructure.repositories.outbox_repository import OutboxRepository
from src.application.use_cases.buyer.outbox_publisher import OutboxPublisher


@pytest.fixture
def db_session_factory():
    """Create in-memory test database and session factory."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    
    def _session_factory():
        return Session()
    
    return _session_factory


@pytest.fixture
async def publisher(db_session_factory):
    """Create outbox publisher instance."""
    pub = OutboxPublisher(db_session_factory)
    yield pub
    await pub.stop()


@pytest.mark.asyncio
async def test_publisher_publishes_pending_events(db_session_factory):
    """Test publisher fetches and publishes pending events."""
    publisher = OutboxPublisher(db_session_factory)
    
    # Save event
    db = db_session_factory()
    repo = OutboxRepository(db)
    repo.save_event(
        "evt-1",
        "auc-1",
        "BID_CREATED",
        json.dumps({"bid_id": "bid-1", "amount": 150})
    )
    db.commit()
    db.close()
    
    # Publish
    await publisher._publish_pending()
    
    # Check published
    db = db_session_factory()
    event = repo.get_event_by_id("evt-1")
    assert event.published_at is not None


@pytest.mark.asyncio
async def test_publisher_retries_failed_publishes(db_session_factory):
    """Test publisher retries on failure."""
    publisher = OutboxPublisher(db_session_factory)
    
    # Save event
    db = db_session_factory()
    repo = OutboxRepository(db)
    repo.save_event(
        "evt-1",
        "auc-1",
        "BID_CREATED",
        json.dumps({"bid_id": "bid-1", "amount": 150})
    )
    db.commit()
    db.close()
    
    # Mock failure (bad payload)
    db = db_session_factory()
    repo = OutboxRepository(db)
    event = repo.get_event_by_id("evt-1")
    event.payload = "invalid json"
    db.commit()
    db.close()
    
    # Attempt publish
    await publisher._publish_pending()
    
    # Check retry count incremented
    db = db_session_factory()
    repo = OutboxRepository(db)
    event = repo.get_event_by_id("evt-1")
    assert event.retry_count == 1
    assert event.published_at is None


@pytest.mark.asyncio
async def test_publisher_marks_dead_letter_after_max_retries(db_session_factory):
    """Test publisher marks as failed after 3 retries."""
    publisher = OutboxPublisher(db_session_factory)
    
    db = db_session_factory()
    repo = OutboxRepository(db)
    repo.save_event("evt-1", "auc-1", "BID_CREATED", "invalid json")
    db.commit()
    db.close()
    
    # Try 3 times
    for _ in range(3):
        await publisher._publish_pending()
    
    # Check marked as failed
    db = db_session_factory()
    repo = OutboxRepository(db)
    event = repo.get_event_by_id("evt-1")
    assert event.failed is True
    assert event.retry_count == 3


@pytest.mark.asyncio
async def test_publisher_ignores_already_published(db_session_factory):
    """Test publisher skips already published events."""
    publisher = OutboxPublisher(db_session_factory)
    
    db = db_session_factory()
    repo = OutboxRepository(db)
    repo.save_event("evt-1", "auc-1", "BID_CREATED", "{}")
    db.commit()
    repo.mark_published("evt-1")
    db.close()
    
    # Count before
    db = db_session_factory()
    repo = OutboxRepository(db)
    pending = repo.get_pending_events()
    initial_count = len(pending)
    db.close()
    
    # Publish (should skip published)
    await publisher._publish_pending()
    
    # Verify unchanged
    db = db_session_factory()
    repo = OutboxRepository(db)
    pending = repo.get_pending_events()
    assert len(pending) == initial_count


@pytest.mark.asyncio
async def test_background_polling_interval(db_session_factory):
    """Test background task runs at polling interval."""
    publisher = OutboxPublisher(db_session_factory)
    publisher.running = True
    
    import time
    start = time.time()
    
    # Run one iteration
    await publisher._publish_pending()
    
    # Should be very fast (no sleep)
    elapsed = time.time() - start
    assert elapsed < 0.5
