import pytest
import uuid
import os
import json
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from fastapi import status, WebSocketDisconnect
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.base import Base

# Import BOTH get_db definitions to ensure they are both overridden
from src.infrastructure.database.base import get_db as get_db_base
from src.database import get_db as get_db_root

from src.application.main import app
from src.domain.models.user import User
from src.domain.models.auction import Auction
from src.domain.models.order import Order, OrderStatus
from src.domain.models.order_message import OrderMessage

from src.application.dependencies import (
    get_current_user,
    get_ws_current_user
)

# Use a separate file-based SQLite database for messaging integration tests
DB_FILE = "test_messages_integration.db"
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_tables():
    """Create all tables in SQLite for this test module and clean up afterwards."""
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except Exception:
            pass
            
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except Exception:
            pass

@pytest.fixture
def db_session(db_tables):
    """Provide an isolated database session per test, overriding both get_db definitions."""
    session = TestingSessionLocal()
    
    # Clean tables in dependency order
    session.query(OrderMessage).delete()
    session.query(Order).delete()
    session.query(Auction).delete()
    session.query(User).delete()
    session.commit()
    
    # Override get_db dependencies
    def override_get_db():
        yield session
            
    app.dependency_overrides[get_db_base] = override_get_db
    app.dependency_overrides[get_db_root] = override_get_db
    yield session
    
    # Clean overrides
    app.dependency_overrides.clear()
    session.close()

@pytest.fixture
def test_buyer(db_session):
    """Pre-create a test buyer."""
    buyer = User(
        user_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        email="buyer@teablendai.local",
        phone_num="1234567890",
        user_name="test_buyer",
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
        email="seller@teablendai.local",
        phone_num="0987654321",
        user_name="test_seller",
        first_name="Jane",
        last_name="Seller",
        default_role="seller",
        seller_name="Highlands Gardens"
    )
    db_session.add(seller)
    db_session.commit()
    db_session.refresh(seller)
    return seller

@pytest.fixture
def test_order(db_session, test_buyer, test_seller):
    """Pre-create a won auction and its corresponding order."""
    auction = Auction(
        auction_id=uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        auction_name="Super Fine Pekoe",
        seller_id=test_seller.user_id,
        seller_brand="Highlands Gardens",
        grade="PEKOE",
        company_name="Highlands Co",
        estate_name="Highlands Tea Estate",
        quantity=500.0,
        origin="Kandy",
        base_price=300.0,
        start_time=datetime.now(timezone.utc),
        duration=120,
        status="history",
        buyer=test_buyer.user_id,
        sold_price=320.0
    )
    db_session.add(auction)
    
    order = Order(
        order_id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
        user_id=test_buyer.user_id,
        auction_id=auction.auction_id,
        total_amount=320.0,
        order_date=datetime.now(timezone.utc),
        status=OrderStatus.pending
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order

def test_get_order_chat_info_endpoint(db_session, test_order, test_buyer, test_seller):
    """Verify endpoint returns correct buyer and seller details to authorized parties."""
    client = TestClient(app)
    order_uuid = str(test_order.order_id)
    
    # 1. Test as Authorized Buyer
    app.dependency_overrides[get_current_user] = lambda: test_buyer
    response = client.get(f"/api/v1/messages/order/{order_uuid}/info")
    assert response.status_code == 200
    data = response.json()
    assert data["order_id"] == order_uuid
    assert data["buyer_name"] == "John Buyer"
    assert data["seller_name"] == "Highlands Gardens"
    assert data["estate_name"] == "Highlands Tea Estate"
    
    # 2. Test as Authorized Seller
    app.dependency_overrides[get_current_user] = lambda: test_seller
    response = client.get(f"/api/v1/messages/order/{order_uuid}/info")
    assert response.status_code == 200
    
    # 3. Test as Unauthorized External User -> Should be 403 Forbidden
    other_user = User(
        user_id=uuid.UUID("99999999-9999-9999-9999-999999999999"),
        email="other@teablendai.local",
        phone_num="1234567890",
        user_name="other_user",
        first_name="Other",
        last_name="User",
        default_role="buyer"
    )
    db_session.add(other_user)
    db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: other_user
    response = client.get(f"/api/v1/messages/order/{order_uuid}/info")
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]

def test_get_order_messages_endpoint(db_session, test_order, test_buyer, test_seller):
    """Verify retrieving list of chat messages for a specific order."""
    # Pre-populate some messages
    msg1 = OrderMessage(
        message_id=uuid.uuid4(),
        order_id=test_order.order_id,
        sender_id=test_buyer.user_id,
        content="Is it ready for collection?"
    )
    msg2 = OrderMessage(
        message_id=uuid.uuid4(),
        order_id=test_order.order_id,
        sender_id=test_seller.user_id,
        content="Yes, ready!"
    )
    db_session.add(msg1)
    db_session.add(msg2)
    db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: test_buyer
    client = TestClient(app)
    
    response = client.get(f"/api/v1/messages/order/{test_order.order_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["content"] == "Is it ready for collection?"
    assert data[1]["content"] == "Yes, ready!"

def test_create_order_message_endpoint(db_session, test_order, test_buyer):
    """Verify sending a message via HTTP POST endpoint."""
    app.dependency_overrides[get_current_user] = lambda: test_buyer
    client = TestClient(app)
    
    response = client.post(
        f"/api/v1/messages/order/{test_order.order_id}",
        json={"content": "Please send tracking info."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Please send tracking info."
    assert data["sender_id"] == str(test_buyer.user_id)
    assert data["order_id"] == str(test_order.order_id)
    
    # Check it actually saved in the DB
    saved = db_session.query(OrderMessage).filter(OrderMessage.order_id == test_order.order_id).first()
    assert saved is not None
    assert saved.content == "Please send tracking info."

def test_order_message_websocket(db_session, test_order, test_buyer):
    """Verify real-time communication using WebSockets."""
    # Override ws authentication dependency to return test_buyer
    app.dependency_overrides[get_ws_current_user] = lambda: test_buyer
    client = TestClient(app)
    
    order_uuid = str(test_order.order_id)
    # Establish WebSocket connection
    with client.websocket_connect(f"/api/v1/messages/order/{order_uuid}/ws?token=dummy_token") as websocket:
        # Send message via websocket
        websocket.send_text(json.dumps({"content": "Hello via WebSocket!"}))
        
        # Receive the broadcasted message
        data = websocket.receive_text()
        broadcasted = json.loads(data)
        
        assert broadcasted["content"] == "Hello via WebSocket!"
        assert broadcasted["sender_id"] == str(test_buyer.user_id)
        assert broadcasted["order_id"] == order_uuid
        
        # Verify it persisted to database
        saved = db_session.query(OrderMessage).filter(OrderMessage.content == "Hello via WebSocket!").first()
        assert saved is not None
        assert str(saved.sender_id) == str(test_buyer.user_id)
