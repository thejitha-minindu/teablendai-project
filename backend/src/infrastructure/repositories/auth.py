"""
Auth Repository - Database operations for authentication
"""
from sqlalchemy.orm import Session
from src.domain.models.user import User
from src.application.schemas.auth import UserRegisterSchema
from src.infrastructure.services.auth import AuthService


class AuthRepository:
    """Repository for auth-related database operations"""

    @staticmethod
    def create_user(db: Session, user_data: UserRegisterSchema) -> User:
        """
        Create a new user in database
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created User object
            
        Raises:
            ValueError: If email or username already exists
        """
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.user_name == user_data.user_name)
        ).first()

        if existing_user:
            if existing_user.email == user_data.email:
                raise ValueError(f"Email {user_data.email} already registered")
            else:
                raise ValueError(f"Username {user_data.user_name} already taken")

        # Create new user
        db_user = User(
            email=user_data.email,
            user_name=user_data.user_name,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_num=user_data.phone_num,
            hashed_password=AuthService.hash_password(user_data.password),
            default_role=user_data.role.value,
            is_active=True,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User | None:
        """Get user by username"""
        return db.query(User).filter(User.user_name == username).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User | None:
        """Get user by user ID"""
        return db.query(User).filter(User.user_id == user_id).first()

    @staticmethod
    def verify_user_credentials(db: Session, username: str, password: str) -> User | None:
        """
        Verify user credentials (email or username + password)
        
        Args:
            db: Database session
            username: Email or username
            password: Plain text password
            
        Returns:
            User if credentials valid, None otherwise
        """
        # Try to find by email first, then username
        user = db.query(User).filter(
            (User.email == username) | (User.user_name == username)
        ).first()

        if user and AuthService.verify_password(password, user.hashed_password):
            return user

        return None

    @staticmethod
    def change_password(db: Session, user_id: str, old_password: str, new_password: str) -> bool:
        """
        Change user password
        
        Args:
            db: Database session
            user_id: User ID
            old_password: Current password (plain text)
            new_password: New password (plain text)
            
        Returns:
            True if successful, False otherwise
        """
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False

        if not AuthService.verify_password(old_password, user.hashed_password):
            return False

        user.hashed_password = AuthService.hash_password(new_password)
        db.commit()
        return True

    @staticmethod
    def deactivate_user(db: Session, user_id: str) -> bool:
        """Deactivate user account"""
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False

        user.is_active = False
        db.commit()
        return True

    @staticmethod
    def activate_user(db: Session, user_id: str) -> bool:
        """Activate user account"""
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            return False

        user.is_active = True
        db.commit()
        return True
