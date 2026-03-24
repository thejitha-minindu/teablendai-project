from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from src.application.schemas.buyer.bid import BidData
from src.infrastructure.repositories.bid_repository import BidRepository
from src.infrastructure.repositories.seller.auction_repository import AuctionRepository
from src.domain.models.auction_status import AuctionStatus
import logging

logger = logging.getLogger(__name__)

EXTENSION_THRESHOLD = 10
EXTENSION_TIME = 10

class BidService:
    def __init__(self, db: Session):
        self.db = db
        self.bid_repo = BidRepository(db)
        self.auction_repo = AuctionRepository(db)
    
    def place_bid(self, auction_id: str, buyer_id: str, bid_amount: float) -> dict:
        current_time = datetime.utcnow()
        
        # Get auction
        auction = self.auction_repo.get_by_id(auction_id)
        if not auction:
            raise ValueError(f"Auction {auction_id} not found")
        
        # Validation
        if auction.status == AuctionStatus.HISTORY.value:
            raise ValueError("Auction has ended (History)")
        
        if auction.buyer:  # If buyer is set, auction is won
            raise ValueError("Auction is won, no more bids accepted")
        
        # Calculate end_time dynamically from start_time + duration (duration is in hours)
        auction_end_time = auction.start_time + timedelta(hours=auction.duration)
        
        if auction.status == AuctionStatus.SCHEDULE.value and current_time >= auction.start_time:
            auction.status = AuctionStatus.LIVE.value
            self.db.commit()
            logger.info(f"Auction LIVE: {auction_id}")
            logger.info(f"Computed End time: {auction_end_time}")
        
        if auction.status == AuctionStatus.SCHEDULE.value:
            raise ValueError("Auction has not started yet")
        
        # Debug logging
        logger.info(f"Bid validation - Auction: {auction_id}")
        logger.info(f"  Start time: {auction.start_time}")
        logger.info(f"  Duration: {auction.duration}s")
        logger.info(f"  Computed end time: {auction_end_time}")
        logger.info(f"  Current time: {current_time}")
        logger.info(f"  Time remaining: {(auction_end_time - current_time).total_seconds()}s")
        
        if current_time > auction_end_time:
            raise ValueError(f"Auction end_time has passed - no more bids accepted. End: {auction_end_time}, Current: {current_time}")
        
        extension_happened = False
        time_remaining = (auction_end_time - current_time).total_seconds()
        
        if time_remaining <= EXTENSION_THRESHOLD:
            # Note: Extension doesn't persist since we calculate end_time dynamically
            # In a real system, you'd store desired_end_time or rounds_count
            logger.info(f"Auction would extend - {time_remaining}s left (threshold: {EXTENSION_THRESHOLD}s)")
            extension_happened = True
        
        bid_obj = BidData(
            bid_id=str(uuid4()),  # Generate UUID for new bid
            auction_id=auction_id,
            buyer_id=buyer_id,
            bid_amount=bid_amount,
            bid_time=current_time
        )
        
        new_bid = self.bid_repo.create_bid(bid_obj)
        self.db.commit()
        logger.info(f"Bid accepted: {bid_amount}")
        logger.info(f"Remaining: {(auction_end_time - current_time).total_seconds():.1f}s")
        
        return {
            "bid": new_bid,
            "auction": auction,
            "remaining_seconds": (auction_end_time - current_time).total_seconds(),
            "extended": extension_happened
        }
    
    def get_auction_state(self, auction_id: str) -> dict:
        """Get current auction state for timer sync via WebSocket"""
        auction = self.auction_repo.get_by_id(auction_id)
        if not auction:
            raise ValueError(f"Auction {auction_id} not found")
        
        current_time = datetime.utcnow()
        remaining_seconds = 0
        
        if auction.status == AuctionStatus.LIVE.value:
            # Calculate end_time dynamically (duration is in hours)
            auction_end_time = auction.start_time + timedelta(hours=auction.duration)
            remaining = (auction_end_time - current_time).total_seconds()
            remaining_seconds = max(0, remaining)
        
        # Get highest bid
        highest_bid = self.bid_repo.get_highest_bid_for_auction(auction_id)
        
        # Get bid count from bids relationship
        bid_count = len(auction.bids) if auction.bids else 0
        
        # Get last bid time from highest bid
        last_bid_time = highest_bid.bid_time if highest_bid else None
        
        # Determine if won (buyer is set + 10s passed since last bid)
        is_won = False
        grace_period_remaining = 0
        if auction.buyer and last_bid_time:
            time_since_last_bid = (current_time - last_bid_time).total_seconds()
            if time_since_last_bid >= EXTENSION_THRESHOLD:
                is_won = True
                grace_end = last_bid_time + timedelta(seconds=40)
                grace_period_remaining = max(0, (grace_end - current_time).total_seconds())
        
        return {
            "auction_id": str(auction.auction_id),
            "status": "Won" if is_won else auction.status,
            "remaining_seconds": grace_period_remaining if is_won else remaining_seconds,
            "bid_count": bid_count,
            "highest_bid": highest_bid.bid_amount if highest_bid else auction.base_price,
            "highest_bidder": str(highest_bid.buyer_id) if highest_bid else None,
            "last_bid_time": last_bid_time.isoformat() if last_bid_time else None,
            "final_price": auction.sold_price,
            "winner": str(auction.buyer) if auction.buyer else None
        }
    
    def create_bid(self, bid: BidData):
        logger.info(f"Service: Creating bid (direct)")
        return self.bid_repo.create_bid(bid)

    def get_bid(self, bid_id: str):
        logger.info(f"Service: Getting bid {bid_id}")
        return self.bid_repo.get_bid_details(bid_id)

    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        logger.info(f"Service: Listing bids")
        return self.bid_repo.list_bids(user_id=user_id, auction_id=auction_id, min_amount=min_amount)

    def list_bids_by_auction(self, auction_id: str):
        logger.info(f"Service: Getting bids for auction {auction_id}")
        return self.bid_repo.list_bids_by_auction(auction_id=auction_id)

    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        logger.info(f"Service: Getting bids for user {user_id} in auction {auction_id}")
        return self.bid_repo.list_bids_by_user_auction(user_id=user_id, auction_id=auction_id)

    def get_highest_bid_for_auction(self, auction_id: str):
        logger.info(f"Service: Getting highest bid for auction {auction_id}")
        return self.bid_repo.get_highest_bid_for_auction(auction_id=auction_id)
