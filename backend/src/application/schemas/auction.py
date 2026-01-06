from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel

AuctionType = Literal["scheduled", "live", "history"]

class Auction(BaseModel):
    auction_id: str
    seller_id: str
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    date: datetime
    duration: float
    status: str
    buyer: Optional[str] = None
    sold_price: Optional[float] = None
    countdown: Optional[float] = None
