from typing import Optional, Literal
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer

AuctionType = Literal["scheduled", "live", "history"]

class Auction(BaseModel):
    auction_id: str
    seller_id: str
    grade: str
    quantity: int
    base_price: float
    date: datetime
    duration: int
    status: AuctionType
    buyer: Optional[str] = None
    buyer_name: Optional[str] = None
    sold_price: Optional[float] = None
    highest_bid: Optional[float] = None
    highest_bidder: Optional[str] = None
    countdown: Optional[str] = None

# 1. Input Schema (Frontend -> Backend)
# This validates the JSON your React app sends when creating an auction.
class AuctionCreate(BaseModel):
    auction_name: Optional[str] = None
    seller_id: Optional[str] = None
    seller_brand: str 
    grade: str
    company_name: Optional[str] = None
    estate_name: Optional[str] = None
    quantity: float
    origin: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    base_price: float = Field(ge=0, description="Base price cannot be negative")
    start_time: datetime
    duration: float = Field(gt=0, description="Duration must be greater than 0")
    
    @field_validator('start_time')
    def validate_start_time(cls, v: datetime):
        # Always use UTC for comparison
        now_utc = datetime.now(timezone.utc)
        
        # Ensure the value is timezone-aware (convert to UTC if naive)
        if v.tzinfo is None:
            v_utc = v.replace(tzinfo=timezone.utc)
        else:
            v_utc = v.astimezone(timezone.utc)
        
        if v_utc < now_utc:
            raise ValueError("Scheduled start time cannot be in the past.")
        return v

# 2. Output Schema (Backend -> Frontend)
# This defines what the API sends back to the React app.
class AuctionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    auction_id: UUID
    custom_auction_id: Optional[str] = None
    auction_name: Optional[str] = None
    seller_id: UUID
    seller_brand: Optional[str] = None
    grade: str
    company_name: Optional[str] = None
    estate_name: Optional[str] = None
    quantity: float
    origin: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    base_price: float
    start_time: datetime
    duration: float
    status: str
    buyer: Optional[str] = None
    buyer_name: Optional[str] = None
    sold_price: Optional[float] = None
    created_at: datetime
    
    @field_serializer('start_time', 'created_at')
    def serialize_datetime(self, value: datetime, _info) -> str:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    
    @field_validator('auction_id', 'seller_id', 'buyer', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value