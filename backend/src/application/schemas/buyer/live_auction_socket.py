from pydantic import BaseModel, field_validator
from typing import Literal
from datetime import datetime
from uuid import UUID

class BidData(BaseModel):
    bid_id: str
    auction_id: str
    bid_amount: float
    bid_time: datetime
    buyer_id: str
    
    @field_validator('bid_id', 'auction_id', 'buyer_id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

class LiveWsEvent(BaseModel):
    event_id: str
    event_type: Literal["BID_CREATED", "BID_UPDATED", "BID_RETRACTED", "AUCTION_CLOSED"]
    version: int = 1
    auction_id: str
    occurred_at: datetime
    data: BidData
    
    @field_validator('event_id', 'auction_id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value