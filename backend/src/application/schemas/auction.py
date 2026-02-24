from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel

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
