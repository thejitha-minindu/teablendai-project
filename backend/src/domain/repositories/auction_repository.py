from abc import ABC, abstractmethod
from src.application.schemas.auction import Auction
import logging

# Set up logging
logger = logging.getLogger(__name__)

class AuctionRepositoryInterface(ABC):
    @abstractmethod
    def create_auction(self, auction: Auction):
        # Create a new auction
        logger.debug("Called create_auction with auction: %s", auction)
        pass

    @abstractmethod
    def get_auction_by_id(self, auction_id: str):
        # Retrieve auction by ID
        logger.debug("Called get_auction_by_id with auction_id: %s", auction_id)
        pass

    @abstractmethod
    def list_auctions(self, user_id: str = None, as_buyer: bool = False, status: str = None):
        # List auctions with optional filters
        logger.debug("Called list_auctions")
        pass

    @abstractmethod
    def list_auctions_history(self, user_id: str, as_buyer: bool = False):
        # List auction history for user
        logger.debug("Called list_auctions_history")
        pass

    @abstractmethod
    def list_auctions_order(self, user_id: str):
        # List auctions by order for user
        logger.debug("Called list_auctions_order")
        pass

    @abstractmethod
    def list_auctions_watchlist(self, user_id: str):
        # List auctions in watchlist for user
        logger.debug("Called list_auctions_watchlist")
        pass

    @abstractmethod
    def get_home_preview_auctions(self, user_id: str):
        # Get home preview auctions for user
        logger.debug("Called get_home_preview_auctions with user_id: %s", user_id)
        pass
