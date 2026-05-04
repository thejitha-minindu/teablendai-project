from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict


class FinancialDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bank_name: str
    account_num: str
    branch_name: str
    account_holder_name: str


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
    nic: Optional[str] = None
    profile_image_url: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = None
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


class BecomeSellerRequest(BaseModel):
    seller_name: str
    seller_registration_no: str
    seller_started_year: int
    seller_website: str
    seller_description: str
    seller_street_address: str
    seller_province: str
    seller_city: str
    seller_postal_code: str


class SellerProfileDetails(BaseModel):
    seller_name: Optional[str] = None
    seller_registration_no: Optional[str] = None
    seller_started_year: Optional[int] = None
    seller_website: Optional[str] = None
    seller_description: Optional[str] = None
    seller_street_address: Optional[str] = None
    seller_province: Optional[str] = None
    seller_city: Optional[str] = None
    seller_postal_code: Optional[str] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    phone_num: str
    user_name: str
    first_name: str
    last_name: str
    nic: Optional[str] = None
    default_role: Literal["buyer", "seller"]
    active_role: Literal["buyer", "seller"]
    available_roles: list[Literal["buyer", "seller"]] = ["buyer"]
    verification_status: str = "PENDING"
    seller_verification_status: Optional[str] = None
    seller_requested_at: Optional[datetime] = None
    seller_approved_at: Optional[datetime] = None
    seller_rejection_reason: Optional[str] = None
    can_become_seller: bool = False
    profile_image_url: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = None
    seller_profile: Optional[SellerProfileDetails] = None
    financial_details: Optional[FinancialDetails] = None
    watch_list: list[str] = []


class UserLookupResponse(BaseModel):
    user_id: str
    user_name: str
    email: str
    default_role: Literal["buyer", "seller"]


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
