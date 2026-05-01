"""
Authentication service with password hashing, OTP generation, and user operations.
"""
import random
import string
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from src.domain.models.user import User
from src.domain.models.password_reset import PasswordReset
import bcrypt
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        if not password:
            raise ValueError("Password cannot be empty")
        
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain text password against a bcrypt hash.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Bcrypt hash to verify against
            
        Returns:
            True if password matches, False otherwise
        """
        if not plain_password or not hashed_password:
            return False
        
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), 
                hashed_password.encode("utf-8")
            )
        except Exception:
            return False

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """
        Generate a random 6-digit OTP.
        
        Args:
            length: Length of OTP (default 6)
            
        Returns:
            Random OTP code
        """
        logger.info(f"Generated OTP")
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def create_password_reset_request(
        db: Session,
        user_id: str,
        otp_expiry_minutes: int = 5
    ) -> PasswordReset:
        """
        Create a new password reset OTP request for a user.
        
        Args:
            db: Database session
            user_id: User ID requesting password reset
            otp_expiry_minutes: Minutes until OTP expires (default 5)
            
        Returns:
            PasswordReset record
        """
        # Delete any existing OTP requests for this user
        db.query(PasswordReset).filter(
            PasswordReset.user_id == user_id,
            PasswordReset.is_used == False
        ).delete()
        db.commit()

        otp_code = AuthService.generate_otp()
        logger.info(f"Generated OTP for user {user_id}: {otp_code}")
        expires_at = datetime.utcnow() + timedelta(minutes=otp_expiry_minutes)

        password_reset = PasswordReset(
            user_id=user_id,
            otp_code=otp_code,
            expires_at=expires_at
        )
        db.add(password_reset)
        db.commit()
        db.refresh(password_reset)
        return password_reset

    @staticmethod
    def verify_otp(
        db: Session,
        user_id: str,
        otp_code: str
    ) -> Optional[PasswordReset]:
        """
        Verify an OTP code for a user.
        
        Args:
            db: Database session
            user_id: User ID
            otp_code: OTP code to verify
            
        Returns:
            PasswordReset record if valid, None otherwise
        """
        password_reset = db.query(PasswordReset).filter(
            PasswordReset.user_id == user_id,
            PasswordReset.is_used == False
        ).first()

        if not password_reset:
            return None

        # Check if OTP is expired
        if datetime.utcnow() > password_reset.expires_at:
            return None

        # Check if max attempts exceeded
        if password_reset.attempts >= password_reset.max_attempts:
            return None

        # Increment attempts
        password_reset.attempts += 1
        db.commit()

        # Verify OTP code
        if password_reset.otp_code != otp_code:
            return None

        return password_reset

    @staticmethod
    def reset_password(
        db: Session,
        user_id: str,
        new_password: str,
        password_reset_id: str
    ) -> bool:
        """
        Reset user password and mark OTP as used.
        
        Args:
            db: Database session
            user_id: User ID
            new_password: New password
            password_reset_id: Password reset record ID
            
        Returns:
            True if successful, False otherwise
        """
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False

        password_reset = db.query(PasswordReset).filter(
            PasswordReset.id == password_reset_id
        ).first()
        if not password_reset:
            return False

        # Hash and update password
        user.hashed_password = AuthService.hash_password(new_password)
        user.updated_at = datetime.utcnow()
        password_reset.is_used = True
        db.commit()
        return True

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User record if found, None otherwise
        """
        logger.info(f"AuthService.get_user_by_email called with email: '{email}'")
        normalized_email = email.lower()
        logger.info(f"Normalized email: '{normalized_email}'")
        
        user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        
        if user:
            logger.info(f"Found user: ID={user.user_id}, email='{user.email}', name='{user.first_name} {user.last_name}'")
        else:
            logger.warning(f"No user found with email: '{normalized_email}'")
            # Log all users in database for debugging
            all_users = db.query(User).all()
            logger.info(f"Total users in database: {len(all_users)}")
            for u in all_users[:10]:  # Log first 10 users
                logger.info(f"  User: ID={u.user_id}, email='{u.email}'")
        
        return user
