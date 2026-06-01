from abc import ABC, abstractmethod
from src.application.schemas.buyer.auction import Auction
import logging

# Set up logging
logger = logging.getLogger(__name__)

class AuctionRepositoryInterface(ABC):
    @abstractmethod
    def get_auction_by_id(self, auction_id: str, lock_for_update: bool = False):
        # Retrieve auction by ID with optional row locking
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

    @abstractmethod
    def add_to_watchlist(self, user_id: str, auction_id: str):
        # Add auction to user's watchlist
        logger.debug("Called add_to_watchlist with user_id: %s, auction_id: %s", user_id, auction_id)
        pass

    @abstractmethod
    def remove_from_watchlist(self, user_id: str, auction_id: str):
        # Remove auction from user's watchlist
        logger.debug("Called remove_from_watchlist with user_id: %s, auction_id: %s", user_id, auction_id)
        pass