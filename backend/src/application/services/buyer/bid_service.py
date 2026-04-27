"""Bid service - facade for all bid operations."""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from src.application.schemas.bid import Bid as BidSchema
from src.infrastructure.repositories.bid_repository import BidRepository
from src.infrastructure.repositories.buyer.auction_repository import AuctionRepository
from src.application.use_cases.buyer.bid_placement_use_case import BidPlacementUseCase
from src.domain.services.buyer.auction_timing_service import AuctionTimingService
from src.domain.models.auction_status import AuctionStatus
from src.domain.models.user import User
from src.domain.constants.auction_constants import AuctionTimingConstants
import logging

logger = logging.getLogger(__name__)

class BidService:
    """Facade service for bid operations - delegates to specific use cases"""
    
    def __init__(self, db: Session):
        self.db = db
        self.bid_repo = BidRepository(db)
        self.auction_repo = AuctionRepository(db)
    
    def place_bid(self, auction_id: str, buyer_id: str, bid_amount: float, buyer_name: str = None) -> BidSchema:
        """
        Place a bid using the dedicated use case.
        Event saved to outbox by use case (no need to return).
        Returns: bid data
        """
        use_case = BidPlacementUseCase(self.db)
        bid = use_case.execute(auction_id, buyer_id, bid_amount, buyer_name)
        return bid
    
    # def get_auction_state(self, auction_id: str) -> dict:
    #     """Get current auction state for timer sync"""
    #     auction = self.auction_repo.get_auction_by_id(auction_id)
    #     if not auction:
    #         raise ValueError(f"Auction {auction_id} not found")
        
    #     current_time = datetime.now(timezone.utc)
    #     remaining_seconds = 0
        
    #     if auction.status == AuctionStatus.LIVE.value:
    #         remaining = AuctionTimingService.get_remaining_time(auction, current_time)
    #         remaining_seconds = remaining.total_seconds()
        
    #     highest_bid = self.bid_repo.get_highest_bid_for_auction(auction_id)
    #     bid_count = len(auction.bids) if auction.bids else 0
    #     last_bid_time = highest_bid.bid_time if highest_bid else None
        
    #     is_won = False
    #     grace_period_remaining = 0
    #     if auction.buyer and last_bid_time:
    #         time_since_last_bid = (current_time - last_bid_time).total_seconds()
    #         if time_since_last_bid >= AuctionTimingConstants.WAIT_BEFORE_WIN.total_seconds():
    #             is_won = True
    #             grace_end = last_bid_time + AuctionTimingConstants.GRACE_PERIOD
    #             grace_period_remaining = max(0, (grace_end - current_time).total_seconds())
        
    #     return {
    #         "auction_id": str(auction.auction_id),
    #         "status": "Won" if is_won else auction.status,
    #         "remaining_seconds": grace_period_remaining if is_won else remaining_seconds,
    #         "bid_count": bid_count,
    #         "highest_bid": highest_bid.bid_amount if highest_bid else auction.base_price,
    #         "highest_bidder": str(highest_bid.buyer_id) if highest_bid else None,
    #         "last_bid_time": last_bid_time.isoformat() if last_bid_time else None,
    #         "final_price": auction.sold_price,
    #         "winner": str(auction.buyer) if auction.buyer else None
    #     }
    
    def get_bid(self, bid_id: str):
        """Get bid details"""
        return self.bid_repo.get_bid_details(bid_id)
    
    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        """List bids with optional filters"""
        return self.bid_repo.list_bids(user_id=user_id, auction_id=auction_id, min_amount=min_amount)
    
    def list_bids_by_auction(self, auction_id: str):
        """Get bids for an auction"""
        return self.bid_repo.list_bids_by_auction(auction_id=auction_id)
    
    def list_bids_by_auction_with_names(self, auction_id: str):
        """Get bids for an auction and enrich with buyer names"""
        bids = self.bid_repo.list_bids_by_auction(auction_id=auction_id)
        
        # Enrich bids with buyer names
        for bid in bids:
            user = self.db.query(User).filter(User.user_id == bid.buyer_id).first()
            if user:
                first_name = user.first_name or ""
                last_name = user.last_name or ""
                real_name = f"{first_name} {last_name}".strip()
                bid.buyer_name = real_name if real_name else user.user_name
        
        return bids
    
    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        """List bids by user for a specific auction"""
        return self.bid_repo.list_bids(user_id=user_id, auction_id=auction_id)
    
    def get_highest_bid_for_auction(self, auction_id: str):
        """Get the highest bid for an auction"""
        return self.bid_repo.get_highest_bid_for_auction(auction_id=auction_id)
