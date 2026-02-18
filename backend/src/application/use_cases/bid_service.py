from sqlalchemy.orm import Session
from src.application.schemas.bid import Bid
from src.infrastructure.repositories.bid_repository import BidRepository
import logging

logger = logging.getLogger(__name__)

class BidService:
    def __init__(self, db: Session):
        self.repo = BidRepository(db)

    def create_bid(self, bid: Bid):
        # Create a new bid
        logger.info(f"Service: Creating bid")
        return self.repo.create_bid(bid)

    def get_bid(self, bid_id: str):
        # Get bid details by ID
        logger.info(f"Service: Getting bid {bid_id}")
        return self.repo.get_bid_details(bid_id)

    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        # List bids with optional filters
        logger.info(f"Service: Listing bids")
        return self.repo.list_bids(user_id=user_id, auction_id=auction_id, min_amount=min_amount)

    def list_bids_by_auction(self, auction_id: str):
        # List all bids for an auction
        logger.info(f"Service: Getting bids for auction {auction_id}")
        return self.repo.list_bids_by_auction(auction_id=auction_id)

    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        # List bids by user for a specific auction
        logger.info(f"Service: Getting bids for user {user_id} in auction {auction_id}")
        return self.repo.list_bids_by_user_auction(user_id=user_id, auction_id=auction_id)

    def get_highest_bid_for_auction(self, auction_id: str):
        # Get the highest bid for an auction
        logger.info(f"Service: Getting highest bid for auction {auction_id}")
        return self.repo.get_highest_bid_for_auction(auction_id=auction_id)
