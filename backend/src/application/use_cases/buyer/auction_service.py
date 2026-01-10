from sqlalchemy.orm import Session
from src.application.schemas.auction import Auction
from src.infrastructure.repositories.buyer.auction_repository import AuctionRepository
import logging

logger = logging.getLogger(__name__)

class AuctionService:
    
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    # Create a new auction
    def create_auction(self, auction: Auction):
        logger.info(f"Service: Creating auction")
        return self.repo.create_auction(auction)

    # Get auction by ID
    def get_auction(self, auction_id: str):
        logger.info(f"Service: Getting auction {auction_id}")
        return self.repo.get_auction_by_id(auction_id)

    # List auctions with optional filters
    def list_auctions(self, user_id: str = None, as_buyer: bool = False, status: str = None):
        logger.info(f"Service: Listing auctions for user {user_id}")
        return self.repo.list_auctions(user_id=user_id, as_buyer=as_buyer, status=status)

    # List auction history for user
    def list_auctions_history(self, user_id: str, as_buyer: bool = False):
        logger.info(f"Service: Getting auction history for user {user_id}")
        return self.repo.list_auctions_history(user_id=user_id, as_buyer=as_buyer)

    # List auctions for user as buyer with history status
    def list_auctions_order(self, user_id: str):
        logger.info(f"Service: Getting auction orders for user {user_id}")
        return self.repo.list_auctions_order(user_id=user_id)

    # List auctions in user's watchlist
    def list_auctions_watchlist(self, user_id: str):
        logger.info(f"Service: Getting watchlist auctions for user {user_id}")
        return self.repo.list_auctions_watchlist(user_id=user_id)

    # Get preview auctions for home page
    def get_home_preview_auctions(self, user_id: str):
        logger.info(f"Service: Getting home preview auctions for user {user_id}")
        return self.repo.get_home_preview_auctions(user_id=user_id)

