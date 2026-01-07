from sqlalchemy.orm import Session
from src.application.schemas.auction import Auction
from src.infrastructure.repositories.auction_repository import AuctionRepository
import logging

logger = logging.getLogger(__name__)

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction: Auction):
        # Create a new auction
        logger.info(f"Service: Creating auction")
        return self.repo.create_auction(auction)

    def get_auction(self, auction_id: str):
        # Get auction by ID
        logger.info(f"Service: Getting auction {auction_id}")
        return self.repo.get_auction_by_id(auction_id)

    def list_auctions(self, user_id: str = None, as_buyer: bool = False, status: str = None):
        # List auctions with optional filters
        logger.info(f"Service: Listing auctions for user {user_id}")
        return self.repo.list_auctions(user_id=user_id, as_buyer=as_buyer, status=status)

    def list_auctions_history(self, user_id: str, as_buyer: bool = False):
        # List auction history for user
        logger.info(f"Service: Getting auction history for user {user_id}")
        return self.repo.list_auctions_history(user_id=user_id, as_buyer=as_buyer)

    def list_auctions_order(self, user_id: str):
        # List auctions for user as buyer with history status
        logger.info(f"Service: Getting auction orders for user {user_id}")
        return self.repo.list_auctions_order(user_id=user_id)

    def list_auctions_watchlist(self, user_id: str):
        # List auctions in user's watchlist
        logger.info(f"Service: Getting watchlist auctions for user {user_id}")
        return self.repo.list_auctions_watchlist(user_id=user_id)

    def get_home_preview_auctions(self, user_id: str):
        # Get preview auctions for home page
        logger.info(f"Service: Getting home preview auctions for user {user_id}")
        return self.repo.get_home_preview_auctions(user_id=user_id)