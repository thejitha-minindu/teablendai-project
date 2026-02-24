"""
Authentication Dependencies - For use with FastAPI dependency injection
"""
from fastapi import Depends, HTTPException, status, Cookie, Request
from typing import Optional
from sqlalchemy.orm import Session
from src.infrastructure.database.base import get_db
from src.infrastructure.services.auth import AuthService
from src.application.schemas.auth import TokenData, UserRole
from src.domain.models.user import User


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> TokenData:
    """
    Get current user from JWT token in cookie or Authorization header
    
    Priority:
    1. Authorization header (Bearer token)
    2. access_token cookie
    """
    token = None

    # Try to get from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header:
        token = AuthService.get_token_from_string(auth_header)

    # Try to get from cookie if not in header
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = AuthService.verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user exists and is active
    user = db.query(User).filter(User.user_id == token_data.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return token_data


async def get_current_admin(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    Verify current user is an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_current_seller(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    Verify current user is a seller or admin
    """
    if current_user.role not in [UserRole.SELLER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required",
        )
    return current_user


async def get_current_buyer(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    Verify current user is a buyer or admin
    """
    if current_user.role not in [UserRole.BUYER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyer access required",
        )
    return current_user


async def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[TokenData]:
    """
    Get current user if authenticated, return None if not
    """
    token = None

    # Try to get from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header:
        token = AuthService.get_token_from_string(auth_header)

    # Try to get from cookie if not in header
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        return None

    token_data = AuthService.verify_token(token)
    if token_data is None:
        return None

    # Verify user exists and is active
    user = db.query(User).filter(User.user_id == token_data.user_id).first()
    if not user or not user.is_active:
        return None

    return token_data
