from typing import Optional, Literal
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, field_validator

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
    sold_price: Optional[float] = None
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
    # 2. Block negative prices
    base_price: float = Field(ge=0, description="Base price cannot be negative")
    start_time: datetime
    # 3. Block negative durations
    duration: float = Field(gt=0, description="Duration must be greater than 0")
    # 4. Block past dates
    @field_validator('start_time')
    def validate_start_time(cls, v: datetime):
        # We give a 5-minute grace period to account for network delays or slow typing
        now = datetime.now(timezone.utc) if v.tzinfo else datetime.now()
        
        # If the start time is strictly earlier than right now, reject it
        if v < now:
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
    base_price: float
    start_time: datetime
    duration: float
    status: str
    buyer: Optional[str] = None
    sold_price: Optional[float] = None
    created_at: datetime
