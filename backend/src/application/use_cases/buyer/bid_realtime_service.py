from datetime import datetime, timezone
import logging
from uuid import uuid4

from src.domain.services.buyer.connection_manager import IConnectionManager
from src.domain.models.auction_status import AuctionStatus

logger = logging.getLogger(__name__)


class BidRealtimeService:
    def __init__(self, manager: IConnectionManager):
        self.manager = manager

    async def broadcast_bid_created(self, bid_data: dict) -> None:

        auction_id = str(bid_data["auction"].auction_id)
        bid = bid_data["bid"]
        
        # Send in the format frontend expects
        message = {
            "event_id": str(uuid4()),
            "event_type": "BID_CREATED",
            "version": 1,
            "auction_id": auction_id,
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "data": {
                "auction_id": auction_id,
                "bid_id": str(bid.bid_id),
                "bid_amount": bid.bid_amount,
                "bid_time": bid.bid_time.isoformat() if bid.bid_time else datetime.now(timezone.utc).isoformat(),
                "buyer_id": str(bid.buyer_id)
            }
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"Broadcast BID_CREATED for auction {auction_id}: {bid.bid_amount}")
    
    async def broadcast_auction_won(self, auction_data: dict) -> None:

        auction = auction_data["auction"]
        auction_id = str(auction.auction_id)
        
        message = {
            "event": "AUCTION_WON",
            "auction_id": auction_id,
            "winner_id": str(auction.buyer),
            "final_price": auction.sold_price,
            "grace_period_seconds": 30,
            "status": "Won",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"Broadcast AUCTION_WON for auction {auction_id}")
    
    async def broadcast_auction_ended(self, auction_data: dict) -> None:

        auction = auction_data["auction"]
        auction_id = str(auction.auction_id)
        
        message = {
            "event": "AUCTION_ENDED",
            "auction_id": auction_id,
            "winner_id": str(auction.buyer),
            "final_price": auction.sold_price,
            "status": AuctionStatus.HISTORY.value,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"Broadcast AUCTION_ENDED for auction {auction_id}")
