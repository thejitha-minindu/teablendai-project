"""Auction domain events - represent domain facts about auctions."""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Any, Optional
from uuid import UUID
from src.domain.constants.auction_constants import AuctionEventType

class AuctionEvent(BaseModel):
    """Unified event schema for all auction-related domain events."""
    model_config = ConfigDict(from_attributes=True)
    
    event_id: str = Field(..., description="Unique event identifier")
    event_type: AuctionEventType = Field(..., description="Type of auction event")
    version: int = Field(default=1, description="Event schema version")
    auction_id: str = Field(..., description="Associated auction ID")
    occurred_at: datetime = Field(..., description="When the event occurred")
    data: dict[str, Any] = Field(default_factory=dict, description="Event-specific data")
    
    @staticmethod
    def bid_created(event_id: str, auction_id: str, bid_id: str, 
                   amount: float, buyer_id: str, bid_time: datetime, buyer_name: str = None) -> "AuctionEvent":
        """Factory method for BID_CREATED events."""
        return AuctionEvent(
            event_id=event_id,
            event_type=AuctionEventType.BID_CREATED,
            auction_id=str(auction_id),
            occurred_at=datetime.utcnow(),
            data={
                "bid_id": str(bid_id),
                "bid_amount": amount,
                "buyer_id": str(buyer_id),
                "buyer_name": buyer_name,
                "bid_time": bid_time.isoformat()
            }
        )
    
    @staticmethod
    def auction_won(event_id: str, auction_id: str, winner_id: str, 
                   final_price: float) -> "AuctionEvent":
        """Factory method for AUCTION_WON events."""
        return AuctionEvent(
            event_id=event_id,
            event_type=AuctionEventType.AUCTION_WON,
            auction_id=str(auction_id),
            occurred_at=datetime.utcnow(),
            data={
                "winner_id": str(winner_id),
                "final_price": final_price,
                "grace_period_seconds": 40
            }
        )
    
    @staticmethod
    def auction_ended(event_id: str, auction_id: str, winner_id: str,
                     final_price: float) -> "AuctionEvent":
        """Factory method for AUCTION_ENDED events."""
        return AuctionEvent(
            event_id=event_id,
            event_type=AuctionEventType.AUCTION_ENDED,
            auction_id=str(auction_id),
            occurred_at=datetime.utcnow(),
            data={
                "winner_id": str(winner_id),
                "final_price": final_price
            }
        )
