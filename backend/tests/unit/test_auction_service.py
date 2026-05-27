import pytest
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.base import Base

# Import all required models to ensure they are created in SQLite
from src.domain.models.user import User
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.models.order import Order, WinsAuction
from src.domain.models.auction_status import AuctionStatus

from src.infrastructure.repositories.seller.auction_repository import AuctionRepository
from src.application.use_cases.seller.auction_service import AuctionService
from src.application.schemas.seller.auction import AuctionCreate

@pytest.fixture
def db_session():
    """Create a clean in-memory SQLite database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture(autouse=True)
def patch_mssql_methods(monkeypatch):
    """Patch SQL Server specific repository methods for SQLite compatibility."""
    monkeypatch.setattr(
        AuctionRepository,
        "_ensure_custom_auction_id_column",
        lambda self: None
    )
    def mock_resolve_seller_id(self, requested_seller_id):
        # Simply return requested or default seller id
        return requested_seller_id or AuctionRepository.DEV_SELLER_ID
    monkeypatch.setattr(
        AuctionRepository,
        "_resolve_seller_id",
        mock_resolve_seller_id
    )

@pytest.fixture
def test_seller(db_session):
    """Pre-create a test seller in the database."""
    seller = User(
        user_id=uuid.UUID("12345678-1234-5678-1234-567812345678"),
        email="seller@example.com",
        phone_num="1234567890",
        user_name="seller_user",
        first_name="Test",
        last_name="Seller",
        default_role="seller",
        seller_name="Seller Brand"
    )
    db_session.add(seller)
    db_session.commit()
    db_session.refresh(seller)
    return seller

def test_create_auction(db_session, test_seller):
    """Test successfully creating an auction via service."""
    service = AuctionService(db_session)
    
    start_time = datetime.now(timezone.utc) + timedelta(days=1)
    auction_data = AuctionCreate(
        auction_name="Premium Black Tea",
        seller_id=str(test_seller.user_id),
        seller_brand="Seller Brand",
        grade="OP",
        quantity=500.0,
        origin="Ruhuna",
        description="High quality black tea",
        base_price=10.5,
        start_time=start_time,
        duration=120  # minutes
    )
    
    auction = service.create_auction(auction_data)
    
    assert auction.auction_id is not None
    assert auction.custom_auction_id is not None
    assert auction.auction_name == "Premium Black Tea"
    assert str(auction.seller_id) == str(test_seller.user_id)
    assert auction.grade == "OP"
    assert auction.quantity == 500.0
    assert auction.origin == "Ruhuna"
    assert auction.base_price == 10.5
    assert auction.status == AuctionStatus.SCHEDULE.value
    assert auction.duration == 120

def test_get_auction(db_session, test_seller):
    """Test retrieving an auction by UUID or custom reference ID."""
    service = AuctionService(db_session)
    
    start_time = datetime.now(timezone.utc) + timedelta(days=1)
    auction_data = AuctionCreate(
        grade="BOPF",
        quantity=300.0,
        origin="Dimbola",
        base_price=8.0,
        start_time=start_time,
        duration=60
    )
    created = service.create_auction(auction_data)
    
    # Retrieve by UUID
    retrieved_by_uuid = service.get_auction(str(created.auction_id))
    assert retrieved_by_uuid is not None
    assert retrieved_by_uuid.auction_id == created.auction_id
    
    # Retrieve by Custom ID
    retrieved_by_custom = service.get_auction(created.custom_auction_id)
    assert retrieved_by_custom is not None
    assert retrieved_by_custom.auction_id == created.auction_id

def test_update_auction(db_session, test_seller):
    """Test updating a scheduled auction."""
    service = AuctionService(db_session)
    
    start_time = datetime.now(timezone.utc) + timedelta(days=1)
    created = service.create_auction(AuctionCreate(
        grade="BOPF",
        quantity=300.0,
        origin="Dimbola",
        base_price=8.0,
        start_time=start_time,
        duration=60
    ))
    
    # Update quantity and duration
    update_data = AuctionCreate(
        grade="BOPF",
        quantity=450.0,
        origin="Dimbola",
        base_price=8.0,
        start_time=start_time,
        duration=90
    )
    updated = service.update_auction(str(created.auction_id), update_data)
    
    assert updated is not None
    assert updated.quantity == 450.0
    assert updated.duration == 90

def test_delete_auction(db_session, test_seller):
    """Test deleting an auction."""
    service = AuctionService(db_session)
    
    start_time = datetime.now(timezone.utc) + timedelta(days=1)
    created = service.create_auction(AuctionCreate(
        grade="BOPF",
        quantity=300.0,
        origin="Dimbola",
        base_price=8.0,
        start_time=start_time,
        duration=60
    ))
    
    # Verify it exists
    auction_id_str = str(created.auction_id)
    assert service.get_auction(auction_id_str) is not None
    
    # Delete
    success = service.delete_auction(auction_id_str)
    assert success is True
    
    # Verify it is gone
    assert service.get_auction(auction_id_str) is None

def test_list_and_status_auctions(db_session, test_seller):
    """Test retrieving auctions filtered by status."""
    service = AuctionService(db_session)
    
    # Create an auction
    start_time = datetime.now(timezone.utc) + timedelta(days=1)
    auc = service.create_auction(AuctionCreate(
        grade="PEKOE",
        quantity=200.0,
        origin="Kandy",
        base_price=12.0,
        start_time=start_time,
        duration=180
    ))
    
    # By default, new auctions are SCHEDULED
    scheduled_auctions = service.get_scheduled_auctions(test_seller.user_id)
    assert len(scheduled_auctions) == 1
    assert scheduled_auctions[0].auction_id == auc.auction_id
    
    # Manually transition to LIVE for testing queries
    auc.status = AuctionStatus.LIVE.value
    db_session.commit()
    
    live_auctions = service.get_live_auctions(test_seller.user_id)
    assert len(live_auctions) == 1
    assert live_auctions[0].status == AuctionStatus.LIVE.value
    
    # Manually transition to HISTORY
    auc.status = AuctionStatus.HISTORY.value
    db_session.commit()
    
    history_auctions = service.get_history_auctions(test_seller.user_id)
    assert len(history_auctions) == 1
    assert history_auctions[0].status == AuctionStatus.HISTORY.value
