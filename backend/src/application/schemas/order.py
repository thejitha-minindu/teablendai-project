from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel

class WinsAuction(BaseModel):
    auction_id: str
    user_id: str
    order_id: str

class Order(BaseModel):
    order_id: str
    user_id: str
    auction_id: str
    total_amount: float
    order_date: datetime
    status: Literal["pending", "completed", "canceled"]
    payment_details: Optional[PaymentDetails] = None

class PaymentDetails(BaseModel):
    payment_id: str
    payment_method: Literal["credit_card", "paypal", "bank_transfer"]
    payment_date: datetime
    order_id: str
    amount: float
    status: Literal["successful", "failed", "pending"] 