from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID

# Payment details model
class PaymentDetails(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_method: Literal["credit_card", "paypal", "bank_transfer"]
    payment_date: datetime
    payment_id: UUID
    order_id: UUID
    amount: float
    status: Literal["successful", "failed", "pending"]

# Wins auction model
class WinsAuction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    auction_id: UUID
    user_id: UUID
    order_id: UUID

# Base order data model
class OrderData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: UUID
    user_id: UUID
    auction_id: UUID
    total_amount: float
    order_date: datetime
    status: Literal["pending", "completed", "canceled"]
    payment_details: Optional[PaymentDetails] = None

# For create order requests
class OrderCreateRequest(BaseModel):
    user_id: UUID
    auction_id: UUID
    total_amount: float
    payment_details: Optional[PaymentDetails] = None

# For order update requests
class OrderUpdateRequest(BaseModel):
    status: Optional[Literal["pending", "completed", "canceled"]] = None
    payment_details: Optional[PaymentDetails] = None

# For order responses
class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    data: Optional[OrderData] = None
    message: Optional[str] = None

# For list responses
class OrderListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    data: list[OrderData] = Field(default_factory=list)
    total: int = 0
    page: Optional[int] = None
    page_size: Optional[int] = None

# Backward compatibility alias
Order = OrderData