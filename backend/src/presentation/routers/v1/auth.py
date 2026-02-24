"""
Authentication Router - Auth endpoints (login, register, logout, profile)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from src.infrastructure.database.base import get_db
from src.infrastructure.repositories.auth import AuthRepository
from src.infrastructure.services.auth import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES
from src.application.schemas.auth import (
    UserRegisterSchema,
    UserLoginSchema,
    TokenResponse,
    UserResponse,
    TokenData,
    PasswordChangeSchema,
)
from src.application.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserRegisterSchema,
    db: Session = Depends(get_db),
):
    """
    Register a new user
    
    - **email**: Valid email address (must be unique)
    - **user_name**: 3-64 characters (must be unique)
    - **password**: Min 8 chars with uppercase, digit, special char
    - **role**: admin, seller, or buyer (default: buyer)
    """
    try:
        user = AuthRepository.create_user(db, request)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
async def login(
    credentials: UserLoginSchema,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login user with email or username
    
    Returns access token as HTTP-only cookie + token in response body
    """
    user = AuthRepository.verify_user_credentials(
        db, credentials.username, credentials.password
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Create access token
    access_token = AuthService.create_access_token(
        user_id=str(user.user_id),
        email=user.email,
        role=user.default_role,
    )

    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # Set to False in development if not using HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(
        access_token=access_token,
        user_id=str(user.user_id),
        email=user.email,
        role=user.default_role,
    )


@router.post("/logout")
async def logout(response: Response):
    """
    Logout user - Clear HTTP-only cookie
    """
    response.delete_cookie(
        key="access_token",
        secure=True,
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get current authenticated user's profile
    """
    user = AuthRepository.get_user_by_id(db, current_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserResponse.model_validate(user)


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeSchema,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change user password
    """
    success = AuthRepository.change_password(
        db,
        current_user.user_id,
        password_data.current_password,
        password_data.new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    return {"message": "Password changed successfully"}


@router.post("/refresh-token")
async def refresh_token(
    current_user: TokenData = Depends(get_current_user),
    response: Response = None,
):
    """
    Refresh access token (can be called before token expires)
    
    Returns new token as HTTP-only cookie
    """
    # Create new access token
    new_token = AuthService.create_access_token(
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
    )

    # Set new HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return TokenResponse(
        access_token=new_token,
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
    )


@router.get("/verify-token")
async def verify_token_endpoint(
    current_user: TokenData = Depends(get_current_user),
):
    """
    Verify if current token is valid
    """
    return {
        "valid": True,
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
    }
