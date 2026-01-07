from abc import ABC, abstractmethod
from src.application.schemas.bid import Bid
import logging

logger = logging.getLogger(__name__)

class BidRepositoryInterface(ABC):
    @abstractmethod
    def create_bid(self, bid: Bid):
        # Create a new bid in the repository
        logger.debug(f"Attempting to create bid: {bid}")
        pass

    @abstractmethod
    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        # List bids with optional filters
        logger.debug(f"Listing bids")
        pass

    @abstractmethod
    def get_bid_details(self, bid_id: str):
        # Retrieve details for a specific bid
        logger.debug(f"Fetching details for bid_id: {bid_id}")
        pass

    @abstractmethod
    def list_bids_by_auction(self, auction_id: str):
        # List all bids for a given auction
        logger.debug(f"Listing bids for auction_id: {auction_id}")
        pass

    @abstractmethod
    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        # List all bids by a user for a specific auction
        logger.debug(f"Listing bids for user_id: {user_id} in auction_id: {auction_id}")
        pass

    @abstractmethod
    def get_highest_bid_for_auction(self, auction_id: str):
        # Get the highest bid for a given auction
        logger.debug(f"Getting highest bid for auction_id: {auction_id}")
        pass