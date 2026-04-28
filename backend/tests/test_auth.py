"""
Tests for authentication and password reset functionality.
Run with: pytest tests/test_auth.py -v
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.domain.models.user import User
from src.domain.models.password_reset import PasswordReset
from src.infrastructure.services.auth_service import AuthService
from src.infrastructure.database.base import SessionLocal


@pytest.fixture
def db():
    """Provide a test database session."""
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password=AuthService.hash_password("TestPassword123"),
        phone_num="1234567890",
        user_name="testuser",
        first_name="Test",
        last_name="User",
        default_role="buyer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class TestPasswordHashing:
    """Tests for password hashing functionality."""

    def test_hash_password_creates_hash(self):
        """Test that hash_password creates a hash."""
        password = "MySecurePassword123"
        hashed = AuthService.hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 20  # bcrypt hashes are long

    def test_verify_password_success(self):
        """Test that verify_password works with correct password."""
        password = "MySecurePassword123"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Test that verify_password fails with incorrect password."""
        password = "MySecurePassword123"
        wrong_password = "WrongPassword123"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password(wrong_password, hashed) is False

    def test_verify_password_with_empty_strings(self):
        """Test verify_password with empty strings."""
        assert AuthService.verify_password("", "") is False
        assert AuthService.verify_password("password", "") is False
        assert AuthService.verify_password("", "hash") is False

    def test_hash_password_empty_string_raises_error(self):
        """Test that hashing empty password raises error."""
        with pytest.raises(ValueError):
            AuthService.hash_password("")


class TestOTPGeneration:
    """Tests for OTP generation functionality."""

    def test_generate_otp_length(self):
        """Test that OTP has correct length."""
        otp = AuthService.generate_otp()
        assert len(otp) == 6

    def test_generate_otp_custom_length(self):
        """Test OTP generation with custom length."""
        otp = AuthService.generate_otp(length=8)
        assert len(otp) == 8

    def test_generate_otp_is_numeric(self):
        """Test that OTP contains only digits."""
        otp = AuthService.generate_otp()
        assert otp.isdigit()

    def test_generate_otp_uniqueness(self):
        """Test that multiple OTPs are different."""
        otps = [AuthService.generate_otp() for _ in range(100)]
        # Most should be unique (allow small chance of collision)
        assert len(set(otps)) > 95


class TestPasswordReset:
    """Tests for password reset functionality."""

    def test_create_password_reset_request(self, db, test_user):
        """Test creating a password reset request."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        
        assert reset.user_id == test_user.user_id
        assert len(reset.otp_code) == 6
        assert reset.otp_code.isdigit()
        assert reset.attempts == 0
        assert reset.is_used is False
        assert reset.expires_at > datetime.utcnow()

    def test_password_reset_expiry(self, db, test_user):
        """Test that OTP expiry is set correctly."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id), otp_expiry_minutes=5)
        
        expected_expiry = datetime.utcnow() + timedelta(minutes=5)
        # Allow 2 second difference for test execution time
        assert abs((reset.expires_at - expected_expiry).total_seconds()) < 2

    def test_create_password_reset_deletes_old_requests(self, db, test_user):
        """Test that old OTP requests are deleted when new one is created."""
        reset1 = AuthService.create_password_reset_request(db, str(test_user.user_id))
        reset2 = AuthService.create_password_reset_request(db, str(test_user.user_id))
        
        old_resets = db.query(PasswordReset).filter(
            PasswordReset.user_id == test_user.user_id,
            PasswordReset.id == reset1.id
        ).all()
        
        assert len(old_resets) == 0

    def test_verify_otp_success(self, db, test_user):
        """Test successful OTP verification."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        otp_code = reset.otp_code
        
        verified = AuthService.verify_otp(db, str(test_user.user_id), otp_code)
        
        assert verified is not None
        assert verified.id == reset.id

    def test_verify_otp_wrong_code(self, db, test_user):
        """Test OTP verification with wrong code."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        
        verified = AuthService.verify_otp(db, str(test_user.user_id), "000000")
        
        assert verified is None

    def test_verify_otp_expired(self, db, test_user):
        """Test OTP verification with expired OTP."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id), otp_expiry_minutes=0)
        # Manually set expired time
        reset.expires_at = datetime.utcnow() - timedelta(seconds=1)
        db.commit()
        
        verified = AuthService.verify_otp(db, str(test_user.user_id), reset.otp_code)
        
        assert verified is None

    def test_verify_otp_max_attempts_exceeded(self, db, test_user):
        """Test OTP verification fails after max attempts."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        
        # Try 3 times with wrong code
        for _ in range(3):
            AuthService.verify_otp(db, str(test_user.user_id), "000000")
        
        # 4th attempt should fail
        verified = AuthService.verify_otp(db, str(test_user.user_id), reset.otp_code)
        assert verified is None

    def test_verify_otp_increments_attempts(self, db, test_user):
        """Test that verification attempts are incremented."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        initial_attempts = reset.attempts
        
        AuthService.verify_otp(db, str(test_user.user_id), "000000")
        reset_after = db.query(PasswordReset).filter(PasswordReset.id == reset.id).first()
        
        assert reset_after.attempts == initial_attempts + 1


class TestResetPassword:
    """Tests for password reset functionality."""

    def test_reset_password_success(self, db, test_user):
        """Test successful password reset."""
        old_password = "OldPassword123"
        new_password = "NewPassword123"
        
        test_user.hashed_password = AuthService.hash_password(old_password)
        db.commit()
        
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        
        success = AuthService.reset_password(
            db,
            str(test_user.user_id),
            new_password,
            str(reset.id)
        )
        
        assert success is True
        
        # Verify new password works
        updated_user = db.query(User).filter(User.user_id == test_user.user_id).first()
        assert AuthService.verify_password(new_password, updated_user.hashed_password)
        assert not AuthService.verify_password(old_password, updated_user.hashed_password)

    def test_reset_password_marks_otp_used(self, db, test_user):
        """Test that OTP is marked as used after password reset."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        
        AuthService.reset_password(db, str(test_user.user_id), "NewPassword123", str(reset.id))
        
        reset_after = db.query(PasswordReset).filter(PasswordReset.id == reset.id).first()
        assert reset_after.is_used is True

    def test_reset_password_invalid_user(self, db):
        """Test password reset with invalid user."""
        reset = PasswordReset(
            user_id="invalid-id",
            otp_code="123456",
            expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        db.add(reset)
        db.commit()
        
        success = AuthService.reset_password(
            db,
            "invalid-id",
            "NewPassword123",
            str(reset.id)
        )
        
        assert success is False

    def test_reset_password_invalid_reset_id(self, db, test_user):
        """Test password reset with invalid reset ID."""
        success = AuthService.reset_password(
            db,
            str(test_user.user_id),
            "NewPassword123",
            "invalid-id"
        )
        
        assert success is False


class TestGetUserByEmail:
    """Tests for user lookup functionality."""

    def test_get_user_by_email_success(self, db, test_user):
        """Test getting user by email."""
        user = AuthService.get_user_by_email(db, test_user.email)
        
        assert user is not None
        assert user.email == test_user.email
        assert user.user_id == test_user.user_id

    def test_get_user_by_email_not_found(self, db):
        """Test getting non-existent user by email."""
        user = AuthService.get_user_by_email(db, "nonexistent@example.com")
        
        assert user is None

    def test_get_user_by_email_case_insensitive(self, db, test_user):
        """Test that email lookup is case insensitive."""
        user = AuthService.get_user_by_email(db, test_user.email.upper())
        
        assert user is not None
        assert user.user_id == test_user.user_id


class TestCompletePasswordResetFlow:
    """Integration tests for complete password reset flow."""

    def test_complete_password_reset_flow(self, db, test_user):
        """Test complete password reset workflow."""
        original_password = "OriginalPassword123"
        new_password = "NewPassword456"
        test_user.hashed_password = AuthService.hash_password(original_password)
        db.commit()
        
        # Step 1: Request password reset
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        assert reset.otp_code is not None
        
        # Step 2: Verify OTP
        verified = AuthService.verify_otp(db, str(test_user.user_id), reset.otp_code)
        assert verified is not None
        
        # Step 3: Reset password
        success = AuthService.reset_password(
            db,
            str(test_user.user_id),
            new_password,
            str(reset.id)
        )
        assert success is True
        
        # Step 4: Verify new password works
        updated_user = db.query(User).filter(User.user_id == test_user.user_id).first()
        assert AuthService.verify_password(new_password, updated_user.hashed_password)
        assert not AuthService.verify_password(original_password, updated_user.hashed_password)

    def test_cannot_use_same_otp_twice(self, db, test_user):
        """Test that same OTP cannot be used twice."""
        reset = AuthService.create_password_reset_request(db, str(test_user.user_id))
        otp_code = reset.otp_code
        
        # First use
        verified1 = AuthService.verify_otp(db, str(test_user.user_id), otp_code)
        assert verified1 is not None
        
        # Try to use same OTP again
        verified2 = AuthService.verify_otp(db, str(test_user.user_id), otp_code)
        assert verified2 is None
