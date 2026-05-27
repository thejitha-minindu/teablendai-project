import pytest
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.base import Base

from src.domain.models.user import User
from src.domain.models.auction import Auction
from src.domain.models.order import Order, OrderStatus
from src.domain.models.order_message import OrderMessage

from src.application.use_cases.order_message_service import OrderMessageService
from src.infrastructure.repositories.order_message_repository import OrderMessageRepository

@pytest.fixture
def db_session():
    """Create a clean in-memory SQLite database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def test_buyer(db_session):
    """Pre-create a test buyer."""
    buyer = User(
        user_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="buyer@example.com",
        phone_num="1234567890",
        user_name="buyer_user",
        first_name="John",
        last_name="Buyer",
        default_role="buyer"
    )
    db_session.add(buyer)
    db_session.commit()
    db_session.refresh(buyer)
    return buyer

@pytest.fixture
def test_seller(db_session):
    """Pre-create a test seller."""
    seller = User(
        user_id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        email="seller@example.com",
        phone_num="0987654321",
        user_name="seller_user",
        first_name="Jane",
        last_name="Seller",
        default_role="seller",
        seller_name="Premium Gardens"
    )
    db_session.add(seller)
    db_session.commit()
    db_session.refresh(seller)
    return seller

@pytest.fixture
def test_order(db_session, test_buyer, test_seller):
    """Pre-create an auction and a corresponding won auction order."""
    # Create auction
    auction = Auction(
        auction_id=uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        auction_name="Grand BOPF Auction",
        seller_id=test_seller.user_id,
        seller_brand="Premium Gardens",
        grade="BOPF",
        company_name="Premium Gardens Co",
        estate_name="Nuwara Eliya",
        quantity=1000.0,
        origin="Nuwara Eliya",
        base_price=500.0,
        start_time=datetime.now(timezone.utc),
        duration=180,
        status="history",
        buyer=test_buyer.user_id,
        sold_price=550.0
    )
    db_session.add(auction)
    
    # Create order
    order = Order(
        order_id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
        user_id=test_buyer.user_id,
        auction_id=auction.auction_id,
        total_amount=550.0,
        order_date=datetime.now(timezone.utc),
        status=OrderStatus.pending
    )
    db_session.add(order)
    db_session.commit()
    
    db_session.refresh(order)
    return order

def test_verify_access_buyer_allowed(db_session, test_order, test_buyer):
    """Verify that the buyer of the order is allowed access to chat."""
    service = OrderMessageService(db_session)
    order = service._verify_access(str(test_order.order_id), str(test_buyer.user_id))
    assert order is not None
    assert order.order_id == test_order.order_id

def test_verify_access_seller_allowed(db_session, test_order, test_seller):
    """Verify that the seller of the auction in the order is allowed access."""
    service = OrderMessageService(db_session)
    order = service._verify_access(str(test_order.order_id), str(test_seller.user_id))
    assert order is not None
    assert order.order_id == test_order.order_id

def test_verify_access_unauthorized_denied(db_session, test_order):
    """Verify that third-party users are denied access to the order's chat."""
    service = OrderMessageService(db_session)
    unauthorized_id = "99999999-9999-9999-9999-999999999999"
    with pytest.raises(HTTPException) as exc:
        service._verify_access(str(test_order.order_id), unauthorized_id)
    assert exc.value.status_code == 403
    assert "Not authorized" in exc.value.detail

def test_verify_access_order_not_found(db_session, test_buyer):
    """Verify that referencing a non-existent order raises a 404."""
    service = OrderMessageService(db_session)
    non_existent_order_id = "00000000-0000-0000-0000-000000000000"
    with pytest.raises(HTTPException) as exc:
        service._verify_access(non_existent_order_id, str(test_buyer.user_id))
    assert exc.value.status_code == 404
    assert "Order not found" in exc.value.detail

def test_create_and_get_messages(db_session, test_order, test_buyer, test_seller):
    """Verify sending a message and retrieving the conversation history."""
    service = OrderMessageService(db_session)
    
    # Send from buyer
    msg1 = service.create_message(
        order_id=str(test_order.order_id),
        sender_id=str(test_buyer.user_id),
        content="Hello, when can you ship the tea?"
    )
    assert msg1.message_id is not None
    assert msg1.content == "Hello, when can you ship the tea?"
    assert str(msg1.sender_id) == str(test_buyer.user_id)
    
    # Send from seller
    msg2 = service.create_message(
        order_id=str(test_order.order_id),
        sender_id=str(test_seller.user_id),
        content="Hi! We will ship it tomorrow morning."
    )
    assert msg2.content == "Hi! We will ship it tomorrow morning."
    assert str(msg2.sender_id) == str(test_seller.user_id)
    
    # Retrieve messages as buyer
    messages = service.get_messages(str(test_order.order_id), test_buyer)
    assert len(messages) == 2
    assert messages[0].content == "Hello, when can you ship the tea?"
    assert messages[1].content == "Hi! We will ship it tomorrow morning."
    assert messages[0].timestamp <= messages[1].timestamp
