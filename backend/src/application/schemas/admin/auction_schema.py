from pydantic import BaseModel, field_validator, field_serializer
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

class AuctionResponse(BaseModel):
    auction_id: UUID
    custom_auction_id: Optional[str] = None
    auction_name: str
    estate_name: str
    grade: str
    quantity: float
    base_price: float
    start_time: datetime
    status: str
    buyer: Optional[str] = None
    sold_price: Optional[float] = None

    class Config:
        from_attributes = True
    
    @field_serializer('start_time')
    def serialize_start_time(self, value: datetime, _info) -> str:
        """Serialize datetime to ISO format string with timezone"""
        if value is None:
            return None
        # Ensure timezone awareness - if naive, assume UTC
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    
    @field_validator('auction_id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value