from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class BidPlacedEvent(BaseModel):
    """Event emitted when a buyer places a bid on a live tea auction lot."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = "BID_PLACED"
    auction_id: str
    buyer_id: str
    bid_amount_lkr: float
    base_price_lkr: float = 0.0
    tea_grade: str = "BOP"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AuctionStatusChangedEvent(BaseModel):
    """Event emitted when auction status changes (Scheduled -> Live -> History)."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = "AUCTION_STATUS_CHANGED"
    auction_id: str
    new_status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
