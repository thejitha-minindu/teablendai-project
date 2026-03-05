"""
Authentication Service - Password hashing and JWT token generation
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

from src.application.schemas import TokenData, UserRole

load_dotenv()

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-min-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Ensure SECRET_KEY is at least 32 characters
if len(SECRET_KEY) < 32:
    raise ValueError("SECRET_KEY must be at least 32 characters long")

# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


class AuthService:
    """Service for authentication operations"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(
        user_id: str,
        email: str,
        role: UserRole | str,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """
        Create JWT access token
        
        Args:
            user_id: User ID
            email: User email
            role: User role
            expires_delta: Custom expiration time
            
        Returns:
            JWT token string
        """
        if expires_delta is None:
            expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        expire = datetime.now(timezone.utc) + expires_delta
        normalized_role = role if isinstance(role, UserRole) else UserRole(role)

        to_encode = {
            "sub": str(user_id),
            "email": email,
            "role": normalized_role.value,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }

        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[TokenData]:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            TokenData if valid, None if invalid
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            role: str = payload.get("role")
            exp: int = payload.get("exp")

            if user_id is None or email is None or role is None:
                return None

            return TokenData(
                user_id=user_id,
                email=email,
                role=UserRole(role),
                exp=exp,
            )
        except JWTError:
            return None

    @staticmethod
    def get_token_from_string(token_string: str) -> Optional[str]:
        """Extract token from 'Bearer <token>' format"""
        if token_string.startswith("Bearer "):
            return token_string[7:]
        return token_string
