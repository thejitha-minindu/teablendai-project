from datetime import datetime, timezone
import logging

from src.domain.services.buyer.connection_manager import IConnectionManager

logger = logging.getLogger(__name__)


class BidRealtimeService:
    def __init__(self, manager: IConnectionManager):
        self.manager = manager

    async def broadcast_bid_created(self, bid_data: dict) -> None:

        auction_id = str(bid_data["auction"].auction_id)
        bid = bid_data["bid"]
        
        message = {
            "event": "BID_PLACED",
            "auction_id": auction_id,
            "bid_amount": bid.bid_amount,
            "highest_bid": bid.bid_amount,
            "remaining_seconds": bid_data["remaining_seconds"],
            "extended": bid_data["extended"],
            "status": "Live",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"Broadcast BID_PLACED for auction {auction_id}: ${bid.bid_amount}")
    
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
            "status": "Closed",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"Broadcast AUCTION_ENDED for auction {auction_id}")
