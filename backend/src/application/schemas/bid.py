from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel

class Bid(BaseModel):
    bid_id: str
    auction_id: str
    bid_amount: float
    bid_time: datetime
    buyer_id: str

    class Config:
        from_attributes = True