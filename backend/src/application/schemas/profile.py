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
    profile_image_url: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = None
    financial_details: Optional[FinancialDetailsUpdate] = None


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    phone_num: str
    user_name: str
    first_name: str
    last_name: str
    default_role: Literal["buyer", "seller"]
    profile_image_url: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = None
    financial_details: Optional[FinancialDetails] = None
    watch_list: list[str] = []


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
