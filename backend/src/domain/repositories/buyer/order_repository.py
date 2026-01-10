from abc import ABC, abstractmethod
from src.application.schemas.buyer.order import Order
import logging

# Set up basic logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrderRepositoryInterface(ABC):
    @abstractmethod
    def create_order(self, order: Order):
        # Create a new order
        logger.info("Creating a new order")
        logger.debug(f"Order data: {order}")
        pass

    @abstractmethod
    def get_order_details(self, order_id: str):
        # Get details of a specific order
        logger.info(f"Fetching order details for order_id: {order_id}")
        logger.debug(f"Order ID: {order_id}")
        pass

    @abstractmethod
    def list_orders(self, user_id: str = None, status: str = None):
        # List orders with optional filters
        logger.info("Listing orders")
        pass

    @abstractmethod
    def list_orders_by_user(self, user_id: str):
        # List all orders for a specific user
        logger.info(f"Listing orders for user_id: {user_id}")
        logger.debug(f"User ID: {user_id}")
        pass

class WinsAuctionRepositoryInterface(ABC):
    @abstractmethod
    def create_wins_auction(self, wins_auction: Order):
        # Create a new wins auction record
        logger.info("Creating a new wins auction")
        logger.debug(f"Wins auction data: {wins_auction}")
        pass

    @abstractmethod
    def get_wins_auction(self, auction_id: str, user_id: str):
        # Get a specific wins auction record
        logger.info(f"Fetching wins auction for auction_id: {auction_id}, user_id: {user_id}")
        logger.debug(f"Auction ID: {auction_id}, User ID: {user_id}")
        pass

    @abstractmethod
    def list_wins_auctions(self, user_id: str = None, auction_id: str = None):
        # List wins auctions with optional filters
        logger.info("Listing wins auctions")
        pass

# PaymentDetails repository interface will be added here