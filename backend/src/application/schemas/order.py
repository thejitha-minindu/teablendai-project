from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

# Payment details model
class PaymentDetails(BaseModel):
    payment_id: str
    payment_method: Literal["credit_card", "paypal", "bank_transfer"]
    payment_date: datetime
    order_id: str
    amount: float
    status: Literal["successful", "failed", "pending"]

    class Config:
        from_attributes = True

class WinsAuction(BaseModel):
    auction_id: str
    user_id: str
    order_id: str

    class Config:
        from_attributes = True

class Order(BaseModel):
    order_id: str
    user_id: str
    auction_id: str
    total_amount: float
    order_date: datetime
    status: Literal["pending", "completed", "canceled"]
    payment_details: Optional[PaymentDetails] = None

# Base order data model
class OrderData(BaseModel):
    order_id: str
    user_id: str
    auction_id: str
    total_amount: float
    order_date: datetime
    status: Literal["pending", "completed", "canceled"]
    payment_details: Optional[PaymentDetails] = None

    class Config:
        from_attributes = True

# For create order requests
class OrderCreateRequest(BaseModel):
    user_id: str
    auction_id: str
    total_amount: float
    payment_details: Optional[PaymentDetails] = None

    class Config:
        from_attributes = True

# For order update requests
class OrderUpdateRequest(BaseModel):
    status: Optional[Literal["pending", "completed", "canceled"]] = None
    payment_details: Optional[PaymentDetails] = None

    class Config:
        from_attributes = True

# For order responses
class OrderResponse(BaseModel):
    success: bool
    data: Optional[OrderData] = None
    message: Optional[str] = None

    class Config:
        from_attributes = True

# For list responses
class OrderListResponse(BaseModel):
    success: bool
    data: list[OrderData] = Field(default_factory=list)
    total: int = 0
    page: Optional[int] = None
    page_size: Optional[int] = None

    class Config:
        from_attributes = True

class PaymentDetails(BaseModel):
    payment_id: str
    payment_method: Literal["credit_card", "paypal", "bank_transfer"]
    payment_date: datetime
    order_id: str
    amount: float
    status: Literal["successful", "failed", "pending"] 