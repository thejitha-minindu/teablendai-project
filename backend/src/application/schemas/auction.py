from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict

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
    seller_brand: str 
    grade: str
    quantity: float
    origin: str
    description: Optional[str] = None
    base_price: float
    start_time: datetime
    duration: float

# 2. Output Schema (Backend -> Frontend)
# This defines what the API sends back to the React app.
class AuctionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    auction_id: str
    seller_id: str
    seller_brand: Optional[str] = None
    grade: str
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