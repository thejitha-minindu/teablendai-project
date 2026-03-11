from datetime import datetime, timezone
from uuid import uuid4
import logging

from src.application.schemas.buyer.live_auction_socket import BidData, LiveWsEvent
from src.domain.services.buyer.connection_manager import IConnectionManager

logger = logging.getLogger(__name__)


class BidRealtimeService:
    def __init__(self, manager: IConnectionManager):
        self.manager = manager

    async def broadcast_bid_created(self, bid_data: dict) -> None:
        """
        Broadcast bid with timer information
        
        bid_data should contain:
        - bid: Bid object
        - auction: Auction object
        - remaining_seconds: float
        - extended: bool
        - bid_count: int
        """
        auction_id = str(bid_data["auction"].auction_id)
        bid = bid_data["bid"]
        
        # New event format with timer info
        message = {
            "event": "BID_PLACED",
            "auction_id": auction_id,
            "bid_id": str(bid.bid_id),
            "bidder_id": str(bid.buyer_id),
            "bid_amount": bid.bid_amount,
            "bid_time": bid.bid_time.isoformat() if bid.bid_time else None,
            "highest_bid": bid.bid_amount,
            "remaining_seconds": bid_data["remaining_seconds"],
            "extended": bid_data["extended"],
            "bid_count": bid_data["bid_count"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"📢 Broadcast BID_PLACED for auction {auction_id}: ${bid.bid_amount}")
    
    async def broadcast_auction_won(self, auction_data: dict) -> None:
        """
        Broadcast when winner is declared (grace period starts)
        
        auction_data should contain:
        - auction: Auction object
        - winner_id: str
        - final_price: float
        - grace_period_seconds: int
        """
        auction = auction_data["auction"]
        auction_id = str(auction.auction_id)
        
        message = {
            "event": "AUCTION_WON",
            "auction_id": auction_id,
            "winner_id": auction_data["winner_id"],
            "final_price": auction_data["final_price"],
            "grace_period_seconds": auction_data["grace_period_seconds"],
            "status": "Won",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"🏆 Broadcast AUCTION_WON for auction {auction_id}: Winner {auction_data['winner_id']}")
    
    async def broadcast_auction_ended(self, auction_data: dict) -> None:
        """
        Broadcast when auction fully ends (grace period expired)
        
        auction_data should contain:
        - auction: Auction object
        - winner_id: str
        - final_price: float
        """
        auction = auction_data["auction"]
        auction_id = str(auction.auction_id)
        
        message = {
            "event": "AUCTION_ENDED",
            "auction_id": auction_id,
            "winner_id": auction_data["winner_id"],
            "final_price": auction_data["final_price"],
            "status": "Closed",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.manager.broadcast(
            room_id=auction_id,
            message=message,
        )
        
        logger.info(f"✅ Broadcast AUCTION_ENDED for auction {auction_id}")
