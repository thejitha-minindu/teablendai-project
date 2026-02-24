"""
Authentication Schemas - Request/Response models for auth endpoints
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    SELLER = "seller"
    BUYER = "buyer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    email: str
    role: UserRole
    exp: Optional[int] = None


class TokenResponse(BaseModel):
    """Response with access token"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: UserRole


class UserRegisterSchema(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    user_name: str = Field(..., min_length=3, max_length=64)
    first_name: str = Field(..., min_length=1, max_length=64)
    last_name: str = Field(..., min_length=1, max_length=64)
    phone_num: str = Field(..., min_length=10, max_length=32)
    password: str = Field(..., min_length=8, regex="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$")
    role: UserRole = Field(default=UserRole.BUYER)


class UserLoginSchema(BaseModel):
    """Schema for user login"""
    username: str = Field(..., description="Email or username")
    password: str


class UserResponse(BaseModel):
    """User response schema"""
    user_id: str
    email: str
    user_name: str
    first_name: str
    last_name: str
    default_role: UserRole
    phone_num: str
    is_active: bool
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class PasswordChangeSchema(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str = Field(..., min_length=8)
