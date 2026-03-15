from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
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