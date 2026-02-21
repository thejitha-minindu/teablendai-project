from pydantic import BaseModel
from typing import Literal
from datetime import datetime
from uuid import UUID

class BidData(BaseModel):
    bid_id: UUID
    auction_id: UUID
    bid_amount: float
    bid_time: datetime
    buyer_id: UUID

class LiveWsEvent(BaseModel):
    event_id: UUID
    event_type: Literal["BID_CREATED", "BID_UPDATED", "BID_RETRACTED", "AUCTION_CLOSED"]
    version: int = 1
    auction_id: UUID
    occurred_at: datetime
    data: BidData