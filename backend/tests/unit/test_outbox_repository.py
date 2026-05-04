"""Unit tests for outbox repository."""
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.domain.models.outbox import AuctionOutbox
from src.infrastructure.repositories.outbox_repository import OutboxRepository
from src.domain.models.base import Base
import json


@pytest.fixture
def db_session():
    """Create in-memory test database."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_save_event(db_session):
    """Test saving event to outbox."""
    repo = OutboxRepository(db_session)
    
    event = repo.save_event(
        event_id="evt-1",
        auction_id="auc-1",
        event_type="BID_CREATED",
        payload='{"bid_id":"bid-1","amount":150}'
    )
    
    assert event.event_id == "evt-1"
    assert event.auction_id == "auc-1"
    assert event.event_type == "BID_CREATED"
    assert event.published_at is None
    assert event.failed is False
    assert event.retry_count == 0


def test_get_pending_events(db_session):
    """Test retrieving pending events."""
    repo = OutboxRepository(db_session)
    
    # Save multiple events
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{"bid":1}')
    repo.save_event("evt-2", "auc-1", "BID_CREATED", '{"bid":2}')
    repo.save_event("evt-3", "auc-2", "BID_CREATED", '{"bid":3}')
    db_session.commit()
    
    # Get pending
    pending = repo.get_pending_events()
    
    assert len(pending) == 3
    assert pending[0].event_id == "evt-1"  # Ordered by creation


def test_get_event_by_id(db_session):
    """Test finding event by ID."""
    repo = OutboxRepository(db_session)
    
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{}')
    db_session.commit()
    
    event = repo.get_event_by_id("evt-1")
    
    assert event is not None
    assert event.event_id == "evt-1"


def test_mark_published(db_session):
    """Test marking event as published."""
    repo = OutboxRepository(db_session)
    
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{}')
    db_session.commit()
    
    repo.mark_published("evt-1")
    
    event = repo.get_event_by_id("evt-1")
    assert event.published_at is not None
    assert event.published_at.replace(tzinfo=None) > datetime.now(timezone.utc).replace(tzinfo=None) - timezone.utc.localize(datetime.now()).utcoffset()


def test_increment_retry(db_session):
    """Test incrementing retry count."""
    repo = OutboxRepository(db_session)
    
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{}')
    db_session.commit()
    
    repo.increment_retry("evt-1", "Connection error")
    
    event = repo.get_event_by_id("evt-1")
    assert event.retry_count == 1
    assert "Connection error" in event.error_message


def test_mark_failed(db_session):
    """Test marking event as failed."""
    repo = OutboxRepository(db_session)
    
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{}')
    db_session.commit()
    
    repo.mark_failed("evt-1", "Max retries exceeded")
    
    event = repo.get_event_by_id("evt-1")
    assert event.failed is True
    assert "Max retries exceeded" in event.error_message


def test_pending_excludes_published(db_session):
    """Test that published events are excluded from pending."""
    repo = OutboxRepository(db_session)
    
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{}')
    repo.save_event("evt-2", "auc-1", "BID_CREATED", '{}')
    db_session.commit()
    
    repo.mark_published("evt-1")
    
    pending = repo.get_pending_events()
    
    assert len(pending) == 1
    assert pending[0].event_id == "evt-2"


def test_pending_excludes_failed(db_session):
    """Test that failed events are excluded from pending."""
    repo = OutboxRepository(db_session)
    
    repo.save_event("evt-1", "auc-1", "BID_CREATED", '{}')
    repo.save_event("evt-2", "auc-1", "BID_CREATED", '{}')
    db_session.commit()
    
    repo.mark_failed("evt-1", "Error")
    
    pending = repo.get_pending_events()
    
    assert len(pending) == 1
    assert pending[0].event_id == "evt-2"
