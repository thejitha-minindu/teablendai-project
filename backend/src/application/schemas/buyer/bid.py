from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

# Base bid data model
class BidData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bid_id: str
    auction_id: str
    bid_amount: float
    bid_time: datetime
    buyer_id: str
    buyer_name: Optional[str] = None
    
    @field_validator('bid_id', 'auction_id', 'buyer_id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

# For create bid requests
class BidCreateRequest(BaseModel):
    auction_id: str
    bid_amount: float
    
    @field_validator('auction_id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

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