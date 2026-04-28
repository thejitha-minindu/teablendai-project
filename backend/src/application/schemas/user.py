from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class FinancialDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bank_name: str
    account_num: str
    branch_name: str
    account_holder_name: str

class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    phone_num: str
    user_name: str
    first_name: str
    last_name: str
    default_role: Literal['buyer', 'seller']
    status: Literal['PENDING', 'APPROVED', 'REJECTED'] = 'PENDING'
    profile_image_url: Optional[str] = None
    seller_name: Optional[str] = None
    seller_registration_no: Optional[str] = None
    seller_started_year: Optional[int] = None
    seller_website: Optional[str] = None
    seller_description: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_province: Optional[str] = None
    seller_city: Optional[str] = None
    seller_postal_code: Optional[str] = None
    seller_verification_status: Optional[str] = None
    created_at: Optional[datetime] = None
    financial_details: Optional[FinancialDetails] = None
    watch_list: list[str] = []

class FinancialDetailsUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_num: Optional[str] = None
    branch_name: Optional[str] = None
    account_holder_name: Optional[str] = None

class UserProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone_num: Optional[str] = None
    user_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    shipping_address: Optional[str] = None
    seller_name: Optional[str] = None
    seller_registration_no: Optional[str] = None
    seller_started_year: Optional[int] = None
    seller_website: Optional[str] = None
    seller_description: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_province: Optional[str] = None
    seller_city: Optional[str] = None
    seller_postal_code: Optional[str] = None
    financial_details: Optional[FinancialDetailsUpdate] = None

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    phone_num: str
    user_name: str
    first_name: str
    last_name: str
    default_role: Literal['buyer', 'seller']
    status: Literal['PENDING', 'APPROVED', 'REJECTED'] = 'PENDING'
    profile_image_url: Optional[str] = None
    shipping_address: Optional[str] = None
    seller_name: Optional[str] = None
    seller_registration_no: Optional[str] = None
    seller_started_year: Optional[int] = None
    seller_website: Optional[str] = None
    seller_description: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_province: Optional[str] = None
    seller_city: Optional[str] = None
    seller_postal_code: Optional[str] = None
    seller_verification_status: Optional[str] = None
    created_at: Optional[datetime] = None
    financial_details: Optional[FinancialDetails] = None
    watch_list: list[str] = []

class Admin(BaseModel):
    admin_id: str
    user_name: str
    email: str
    phone_num: str
    first_name: str
    last_name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    phone_num: str
    user_name: str
    first_name: str
    last_name: str
    shipping_address: Optional[str] = None
    seller_name: Optional[str] = None
    seller_registration_no: Optional[str] = None
    seller_started_year: Optional[int] = None
    seller_website: Optional[str] = None
    seller_description: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_province: Optional[str] = None
    seller_city: Optional[str] = None
    seller_postal_code: Optional[str] = None
    default_role: Literal['buyer', 'seller'] = 'buyer'

class UserApprovalAction(BaseModel):
    status: Literal['APPROVED', 'REJECTED']

class GoogleToken(BaseModel):
    token: str


class RoleSwitchRequest(BaseModel):
    role: Literal['buyer', 'seller']
