from sqlalchemy.orm import Session
from src.application.schemas.bid import Bid
from src.infrastructure.repositories.bid_repository import BidRepository
import logging

logger = logging.getLogger(__name__)

class BidService:
    def __init__(self, db: Session):
        self.repo = BidRepository(db)

    # Create a new bid
    def create_bid(self, bid: Bid):
        logger.info(f"Service: Creating bid")
        return self.repo.create_bid(bid)

    # Get bid details by ID
    def get_bid(self, bid_id: str):
        logger.info(f"Service: Getting bid {bid_id}")
        return self.repo.get_bid_details(bid_id)

    # List bids with optional filters
    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        logger.info(f"Service: Listing bids")
        return self.repo.list_bids(user_id=user_id, auction_id=auction_id, min_amount=min_amount)

    # List all bids for an auction
    def list_bids_by_auction(self, auction_id: str):
        logger.info(f"Service: Getting bids for auction {auction_id}")
        return self.repo.list_bids_by_auction(auction_id=auction_id)

    # List bids by user for a specific auction
    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        logger.info(f"Service: Getting bids for user {user_id} in auction {auction_id}")
        return self.repo.list_bids_by_user_auction(user_id=user_id, auction_id=auction_id)

    # Get the highest bid for an auction
    def get_highest_bid_for_auction(self, auction_id: str):
        logger.info(f"Service: Getting highest bid for auction {auction_id}")
        return self.repo.get_highest_bid_for_auction(auction_id=auction_id)
