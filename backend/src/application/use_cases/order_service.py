from sqlalchemy.orm import Session
from src.application.schemas.order import Order, WinsAuction, PaymentDetails
from src.infrastructure.repositories.order_repository import OrderRepository, WinsAuctionRepository
import logging

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self, db: Session):
        self.order_repo = OrderRepository(db)

    def create_order(self, order: Order):
        # Create a new order
        logger.info(f"Service: Creating order")
        return self.order_repo.create_order(order)

    def get_order(self, order_id: str):
        # Get order details by ID
        logger.info(f"Service: Getting order {order_id}")
        return self.order_repo.get_order_details(order_id)

    def list_orders(self, user_id: str = None, status: str = None):
        # List orders with optional filters
        logger.info(f"Service: Listing orders for user {user_id}")
        return self.order_repo.list_orders(user_id=user_id, status=status)

    def list_orders_by_user(self, user_id: str):
        # List all orders for a specific user
        logger.info(f"Service: Getting orders for user {user_id}")
        return self.order_repo.list_orders_by_user(user_id=user_id)


class WinsAuctionService:
    def __init__(self, db: Session):
        self.wins_repo = WinsAuctionRepository(db)

    def create_wins_auction(self, wins_auction: WinsAuction):
        # Create a new wins auction record
        logger.info(f"Service: Creating wins auction")
        return self.wins_repo.create_wins_auction(wins_auction)

    def get_wins_auction(self, auction_id: str, user_id: str):
        # Get a specific wins auction record
        logger.info(f"Service: Getting wins auction {auction_id} for user {user_id}")
        return self.wins_repo.get_wins_auction(auction_id=auction_id, user_id=user_id)

    def list_wins_auctions(self, user_id: str = None, auction_id: str = None):
        # List wins auctions with optional filters
        logger.info(f"Service: Listing wins auctions for user {user_id}")
        return self.wins_repo.list_wins_auctions(user_id=user_id, auction_id=auction_id)

    def list_wins_auctions_by_user(self, user_id: str):
        # List all wins auctions for a specific user
        logger.info(f"Service: Getting all wins auctions for user {user_id}")
        return self.wins_repo.list_wins_auctions(user_id=user_id)

    def list_wins_auctions_by_auction(self, auction_id: str):
        # List all wins records for a specific auction
        logger.info(f"Service: Getting all wins records for auction {auction_id}")
        return self.wins_repo.list_wins_auctions(auction_id=auction_id)
