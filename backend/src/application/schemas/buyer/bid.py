from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# Base bid data model
class BidData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bid_id: UUID
    auction_id: UUID
    bid_amount: float
    bid_time: datetime
    buyer_id: UUID

# For create bid requests
class BidCreateRequest(BaseModel):
    auction_id: UUID
    bid_amount: float
    buyer_id: UUID

# For bid responses
class BidResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    data: Optional[BidData] = None
    message: Optional[str] = None

# For list responses
class BidListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    data: list[BidData] = Field(default_factory=list)
    total: int = 0

# Backward compatibility alias
Bid = BidData