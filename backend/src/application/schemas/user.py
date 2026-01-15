from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

class FinancialDetails(BaseModel):
    bank_name: str
    account_num: str
    branch_name: str
    account_holder_name: str

class User(BaseModel):
    user_id: UUID
    email: str
    phone_num: str
    user_name: str
    first_name: str
    last_name: str
    default_role: Literal['buyer', 'seller']
    profile_image_url: Optional[str] = None
    financial_details: FinancialDetails
    watch_list: list[str]

class Admin(BaseModel):
    admin_id: UUID
    user_name: str
    email: str
    phone_num: str
    first_name: str
    last_name: str