"""
Authentication schemas
"""
from enum import Enum
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    SELLER = "seller"
    BUYER = "buyer"


class UserRegisterSchema(BaseModel):
    email: EmailStr
    user_name: str = Field(min_length=3, max_length=64)
    full_name: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)
    role: UserRole = UserRole.BUYER


class UserLoginSchema(BaseModel):
    username: str
    password: str


class TokenData(BaseModel):
    user_id: str
    email: EmailStr
    role: UserRole
    exp: int | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: EmailStr
    role: UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: EmailStr
    user_name: str
    first_name: str
    last_name: str
    phone_num: str
    default_role: str
    is_active: bool = True
    profile_image_url: str | None = None


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
