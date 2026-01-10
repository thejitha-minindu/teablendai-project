from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

# Base bid data model
class BidData(BaseModel):
    bid_id: str
    auction_id: str
    bid_amount: float
    bid_time: datetime
    buyer_id: str

    class Config:
        from_attributes = True

# For create bid requests
class BidCreateRequest(BaseModel):
    auction_id: str
    bid_amount: float
    buyer_id: str

    class Config:
        from_attributes = True

# For bid responses
class BidResponse(BaseModel):
    success: bool
    data: Optional[BidData] = None
    message: Optional[str] = None

    class Config:
        from_attributes = True

# For list responses
class BidListResponse(BaseModel):
    success: bool
    data: list[BidData] = Field(default_factory=list)
    total: int = 0

    class Config:
        from_attributes = True

# Backward compatibility alias
Bid = BidData