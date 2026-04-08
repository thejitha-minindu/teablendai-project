from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel

class Bid(BaseModel):
    bid_id: Optional[str] = None
    auction_id: str
    bid_amount: float
    bid_time: Optional[datetime] = None
    buyer_id: Optional[str] = None

    class Config:
        from_attributes = True