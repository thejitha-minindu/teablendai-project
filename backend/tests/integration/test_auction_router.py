import pytest
import uuid
import os
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.base import Base

# Import BOTH get_db definitions to ensure they are both overridden
from src.infrastructure.database.base import get_db as get_db_base
from src.database import get_db as get_db_root
from src.infrastructure.database.connection import get_db as get_db_connection

from src.application.main import app
from src.domain.models.user import User
from src.domain.models.auction import Auction
from src.domain.models.auction_status import AuctionStatus
from src.domain.models.admin import Admin

from src.application.dependencies import (
    get_current_user,
    get_optional_current_user,
    get_optional_token_payload,
    get_current_admin,
    get_system_log_service
)
from src.infrastructure.repositories.seller.auction_repository import AuctionRepository

# Use a file-based SQLite database so all connections share the same tables and data
DB_FILE = "test_integration.db"
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_tables():
    """Create all tables in SQLite for the test module and clean up the file at the end."""
    # Ensure any existing test database is removed
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except Exception:
            pass
            
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up the file-based database after all tests in this module run
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
    
    # Clean tables
    session.query(Auction).delete()
    session.query(User).delete()
    session.commit()
    
    # Override get_db dependencies
    def override_get_db():
        yield session
            
    app.dependency_overrides[get_db_base] = override_get_db
    app.dependency_overrides[get_db_root] = override_get_db
    app.dependency_overrides[get_db_connection] = override_get_db
    yield session
    
    # Clean overrides
    app.dependency_overrides.clear()
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
        return requested_seller_id or AuctionRepository.DEV_SELLER_ID
    monkeypatch.setattr(
        AuctionRepository,
        "_resolve_seller_id",
        mock_resolve_seller_id
    )

@pytest.fixture
def test_seller(db_session):
    """Pre-create a test seller."""
    seller = User(
        user_id=uuid.UUID("12345678-1234-5678-1234-567812345678"),
        email="seller@teablendai.local",
        phone_num="1234567890",
        user_name="test_seller",
        first_name="Test",
        last_name="Seller",
        default_role="seller",
        seller_name="Premium Tea Brand"
    )
    db_session.add(seller)
    db_session.commit()
    db_session.refresh(seller)
    return seller

@pytest.fixture
def auth_seller(test_seller):
    """Setup client authentication dependencies for seller."""
    seller_email = test_seller.email
    app.dependency_overrides[get_optional_current_user] = lambda: test_seller
    app.dependency_overrides[get_optional_token_payload] = lambda: {"role": "seller", "sub": seller_email}
    return test_seller

def test_get_cloudinary_signature_unauthorized(db_session):
    """Verify generating Cloudinary signature requires authentication."""
    # Ensure anonymous user is returned
    app.dependency_overrides[get_optional_current_user] = lambda: None
    app.dependency_overrides[get_optional_token_payload] = lambda: None
    
    client = TestClient(app)
    response = client.get("/api/v1/auctions/cloudinary-signature")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_get_cloudinary_signature_authorized(db_session, auth_seller):
    """Verify signature generated successfully for authenticated seller."""
    client = TestClient(app)
    # Mock cloudinary.config
    with patch("cloudinary.config") as mock_config:
        mock_config.return_value.cloud_name = "test_cloud"
        mock_config.return_value.api_key = "test_key"
        mock_config.return_value.api_secret = "test_secret"
        
        response = client.get("/api/v1/auctions/cloudinary-signature")
        assert response.status_code == 200
        data = response.json()
        assert "signature" in data
        assert "timestamp" in data

def test_upload_image_file_type_validation(db_session, auth_seller):
    """Verify uploading invalid image formats returns 400."""
    client = TestClient(app)
    response = client.post(
        "/api/v1/auctions/upload-image",
        files={"file": ("test.gif", b"fake gif data", "image/gif")}
    )
    assert response.status_code == 400
    assert "Only JPEG, PNG, and WEBP are allowed" in response.json()["detail"]

def test_upload_image_file_size_validation(db_session, auth_seller):
    """Verify uploading large files (> 5MB) returns 400."""
    client = TestClient(app)
    large_data = b"x" * (6 * 1024 * 1024) # 6MB
    response = client.post(
        "/api/v1/auctions/upload-image",
        files={"file": ("large.png", large_data, "image/png")}
    )
    assert response.status_code == 400
    assert "File size too large" in response.json()["detail"]

@patch("cloudinary.uploader.upload")
def test_upload_image_success(mock_upload, db_session, auth_seller):
    """Verify successful upload mock."""
    mock_upload.return_value = {"secure_url": "https://cloudinary.com/abcd.png"}
    client = TestClient(app)
    response = client.post(
        "/api/v1/auctions/upload-image",
        files={"file": ("tea.jpg", b"fake jpeg data", "image/jpeg")}
    )
    assert response.status_code == 200
    assert response.json()["image_url"] == "https://cloudinary.com/abcd.png"

def test_create_auction_endpoint_role_validation(db_session):
    """Verify non-seller users cannot create auctions."""
    buyer = User(
        user_id=uuid.UUID("99999999-9999-9999-9999-999999999999"),
        email="buyer@teablendai.local",
        phone_num="1234567890",
        user_name="test_buyer",
        first_name="Test",
        last_name="Buyer",
        default_role="buyer"
    )
    db_session.add(buyer)
    db_session.commit()
    
    app.dependency_overrides[get_optional_current_user] = lambda: buyer
    app.dependency_overrides[get_optional_token_payload] = lambda: {"role": "buyer", "sub": buyer.email}
    
    client = TestClient(app)
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    response = client.post(
        "/api/v1/auctions",
        json={
            "grade": "PEKOE",
            "quantity": 150.0,
            "origin": "Uva",
            "base_price": 5.0,
            "start_time": start_time,
            "duration": 60
        }
    )
    assert response.status_code == 403
    assert "Only sellers can create auctions" in response.json()["detail"]

def test_create_and_query_auctions(db_session, auth_seller):
    """Verify successful creation, list retrieval, and detailed retrieval."""
    client = TestClient(app)
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    
    # 1. Create Auction
    response = client.post(
        "/api/v1/auctions",
        json={
            "grade": "BOPF",
            "quantity": 500.0,
            "origin": "Ruhuna",
            "base_price": 9.5,
            "start_time": start_time,
            "duration": 180,
            "seller_brand": "Premium Tea Brand"
        }
    )
    assert response.status_code == 201
    created_data = response.json()
    assert created_data["grade"] == "BOPF"
    assert created_data["origin"] == "Ruhuna"
    assert created_data["status"] == AuctionStatus.SCHEDULE.value
    
    # 2. Get All Auctions
    list_response = client.get("/api/v1/auctions")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["auction_id"] == created_data["auction_id"]
    
    # 3. Get Single Auction by UUID
    detail_response = client.get(f"/api/v1/auctions/{created_data['auction_id']}")
    assert detail_response.status_code == 200
    assert detail_response.json()["custom_auction_id"] == created_data["custom_auction_id"]

def test_update_and_delete_ownership_constraints(db_session, auth_seller):
    """Verify update and delete validate both status and ownership constraints."""
    client = TestClient(app)
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    
    # Create auction owned by auth_seller
    response = client.post(
        "/api/v1/auctions",
        json={
            "grade": "OP",
            "quantity": 200.0,
            "origin": "Galle",
            "base_price": 7.0,
            "start_time": start_time,
            "duration": 120,
            "seller_brand": "Premium Tea Brand"
        }
    )
    auc_data = response.json()
    auc_uuid = auc_data["auction_id"]
    
    # Create another seller
    other_seller = User(
        user_id=uuid.UUID("88888888-8888-8888-8888-888888888888"),
        email="other@teablendai.local",
        phone_num="0000000000",
        user_name="other_seller",
        first_name="Other",
        last_name="Seller",
        default_role="seller"
    )
    db_session.add(other_seller)
    db_session.commit()
    
    other_email = other_seller.email
    # Switch auth to other_seller
    app.dependency_overrides[get_optional_current_user] = lambda: other_seller
    app.dependency_overrides[get_optional_token_payload] = lambda: {"role": "seller", "sub": other_email}
    
    # Attempt to UPDATE other seller's auction -> Should be 403 Forbidden
    update_response = client.put(
        f"/api/v1/auctions/{auc_uuid}",
        json={
            "grade": "OP",
            "quantity": 300.0,
            "origin": "Galle",
            "base_price": 7.0,
            "start_time": start_time,
            "duration": 120
        }
    )
    assert update_response.status_code == 403
    assert "does not belong to you" in update_response.json()["detail"]
    
    # Attempt to DELETE other seller's auction -> Should be 403 Forbidden
    delete_response = client.delete(f"/api/v1/auctions/{auc_uuid}")
    assert delete_response.status_code == 403
    assert "does not belong to you" in delete_response.json()["detail"]
    
    seller_email = auth_seller.email
    # Switch auth back to original owner
    app.dependency_overrides[get_optional_current_user] = lambda: auth_seller
    app.dependency_overrides[get_optional_token_payload] = lambda: {"role": "seller", "sub": seller_email}
    
    # Successfully UPDATE
    update_response = client.put(
        f"/api/v1/auctions/{auc_uuid}",
        json={
            "grade": "OP",
            "quantity": 300.0,
            "origin": "Galle",
            "base_price": 7.5,
            "start_time": start_time,
            "duration": 120
        }
    )
    assert update_response.status_code == 200
    assert update_response.json()["quantity"] == 300.0
    assert update_response.json()["base_price"] == 7.5
    
    # Successfully DELETE
    delete_response = client.delete(f"/api/v1/auctions/{auc_uuid}")
    assert delete_response.status_code == 204 or delete_response.status_code == 244


def test_admin_delete_auction_unauthorized(db_session):
    """Verify delete auction by admin requires admin authentication."""
    client = TestClient(app)
    response = client.delete("/api/v1/admin/auctions/some-auction-id")
    assert response.status_code in (401, 403)


def test_admin_delete_auction_not_found(db_session):
    """Verify deleting a non-existent auction returns 404."""
    admin = Admin(
        admin_id="admin-123",
        username="admin_test",
        email="admin@teablendai.local",
        status="active"
    )
    from unittest.mock import MagicMock
    mock_log_service = MagicMock()
            
    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_system_log_service] = lambda: mock_log_service
    
    client = TestClient(app)
    response = client.delete(f"/api/v1/admin/auctions/{uuid.uuid4()}")
    assert response.status_code == 404
    assert "Auction not found" in response.json()["detail"]

def test_admin_delete_auction_invalid_status(db_session, auth_seller):
    """Verify deleting an auction that is not scheduled (e.g. live or completed) returns 400."""
    admin = Admin(
        admin_id="admin-123",
        username="admin_test",
        email="admin@teablendai.local",
        status="active"
    )
    from unittest.mock import MagicMock
    mock_log_service = MagicMock()

    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_system_log_service] = lambda: mock_log_service

    client = TestClient(app)
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    response = client.post(
        "/api/v1/auctions",
        json={
            "grade": "BOPF",
            "quantity": 500.0,
            "origin": "Ruhuna",
            "base_price": 9.5,
            "start_time": start_time,
            "duration": 180,
            "seller_brand": "Premium Tea Brand"
        }
    )
    assert response.status_code == 201
    auc_id = response.json()["auction_id"]

    # Update status to live in DB to trigger the status constraint
    auction = db_session.query(Auction).filter(Auction.auction_id == auc_id).first()
    auction.status = "live"
    db_session.commit()

    response = client.delete(f"/api/v1/admin/auctions/{auc_id}")
    assert response.status_code == 400
    assert "Only scheduled auctions can be deleted" in response.json()["detail"]


def test_admin_delete_auction_success(db_session, auth_seller):
    """Verify successful deletion of a live/scheduled auction by admin."""
    admin = Admin(
        admin_id="admin-123",
        username="admin_test",
        email="admin@teablendai.local",
        status="active"
    )
    from unittest.mock import MagicMock
    mock_log_service = MagicMock()

    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_system_log_service] = lambda: mock_log_service

    client = TestClient(app)
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    response = client.post(
        "/api/v1/auctions",
        json={
            "grade": "BOPF",
            "quantity": 500.0,
            "origin": "Ruhuna",
            "base_price": 9.5,
            "start_time": start_time,
            "duration": 180,
            "seller_brand": "Premium Tea Brand"
        }
    )
    assert response.status_code == 201
    auc_id = response.json()["auction_id"]

    response = client.delete(f"/api/v1/admin/auctions/{auc_id}")
    assert response.status_code == 204

    # Verify deleted from DB
    assert db_session.query(Auction).filter(Auction.auction_id == auc_id).first() is None
    # Verify logged
    mock_log_service.log.assert_called_once()
    call_kwargs = mock_log_service.log.call_args[1]
    assert call_kwargs["activity_type"] == "Auction Deleted"
    assert "BOPF - Ruhuna" in call_kwargs["details"]
