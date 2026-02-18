from sqlalchemy.orm import Session
from src.domain.models.order import Order as OrderModel, WinsAuction as WinsAuctionModel, PaymentDetails as PaymentDetailsModel
from src.application.schemas.order import Order, WinsAuction, PaymentDetails
from src.domain.repositories.order_repository import OrderRepositoryInterface, WinsAuctionRepositoryInterface
import logging

logger = logging.getLogger(__name__)

class OrderRepository(OrderRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db
        logger.debug("OrderRepository initialized")

    def create_order(self, order: Order):
        # Create a new order in the database
        logger.info("Creating a new order")
        logger.debug(f"Order data: {order}")
        try:
            db_order = OrderModel(**order.dict(exclude={"payment_details"}))
            self.db.add(db_order)
            self.db.commit()
            self.db.refresh(db_order)
            logger.info(f"Order created: {db_order.order_id}")
            logger.debug(f"Order DB object: {db_order}")
            return db_order
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            self.db.rollback()
            raise

    def get_order_details(self, order_id: str):
        # Get order details by order_id
        logger.info(f"Fetching order details for: {order_id}")
        logger.debug(f"Order ID: {order_id}")
        try:
            order = self.db.query(OrderModel).filter(OrderModel.order_id == order_id).first()
            if order:
                logger.info(f"Order found: {order_id}")
                logger.debug(f"Order object: {order}")
            else:
                logger.warning(f"Order not found: {order_id}")
            return order
        except Exception as e:
            logger.error(f"Error fetching order details: {str(e)}")
            raise

    def list_orders(self, user_id: str = None, status: str = None):
        # List orders, optionally filtered by user_id and status
        logger.info("Listing orders")
        logger.debug(f"Filter user_id: {user_id}, status: {status}")
        try:
            query = self.db.query(OrderModel)
            if user_id:
                query = query.filter(OrderModel.user_id == user_id)
            if status:
                query = query.filter(OrderModel.status == status)
            orders = query.all()
            logger.info(f"Listed {len(orders)} orders")
            logger.debug(f"Orders: {orders}")
            return orders
        except Exception as e:
            logger.error(f"Error listing orders: {str(e)}")
            raise

    def list_orders_by_user(self, user_id: str):
        # List orders for a specific user
        logger.info(f"Listing orders for user: {user_id}")
        logger.debug(f"User ID: {user_id}")
        return self.list_orders(user_id=user_id)


class WinsAuctionRepository(WinsAuctionRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db
        logger.debug("WinsAuctionRepository initialized")

    def create_wins_auction(self, wins_auction: WinsAuction):
        # Create a new wins auction record
        logger.info("Creating a new wins auction")
        logger.debug(f"WinsAuction data: {wins_auction}")
        try:
            db_wins_auction = WinsAuctionModel(**wins_auction.dict())
            self.db.add(db_wins_auction)
            self.db.commit()
            self.db.refresh(db_wins_auction)
            logger.info(f"Wins auction created: {db_wins_auction.auction_id}")
            logger.debug(f"WinsAuction DB object: {db_wins_auction}")
            return db_wins_auction
        except Exception as e:
            logger.error(f"Error creating wins auction: {str(e)}")
            self.db.rollback()
            raise

    def get_wins_auction(self, auction_id: str, user_id: str):
        # Get a wins auction by auction_id and user_id
        logger.info(f"Fetching wins auction for auction_id: {auction_id}, user_id: {user_id}")
        logger.debug(f"Auction ID: {auction_id}, User ID: {user_id}")
        try:
            wins_auction = self.db.query(WinsAuctionModel).filter(
                WinsAuctionModel.auction_id == auction_id,
                WinsAuctionModel.user_id == user_id
            ).first()
            if wins_auction:
                logger.info(f"Wins auction found: {auction_id}, {user_id}")
                logger.debug(f"WinsAuction object: {wins_auction}")
            else:
                logger.warning(f"Wins auction not found: {auction_id}, {user_id}")
            return wins_auction
        except Exception as e:
            logger.error(f"Error fetching wins auction: {str(e)}")
            raise

    def list_wins_auctions(self, user_id: str = None, auction_id: str = None):
        # List wins auctions, optionally filtered by user_id and auction_id
        logger.info("Listing wins auctions")
        logger.debug(f"Filter user_id: {user_id}, auction_id: {auction_id}")
        try:
            query = self.db.query(WinsAuctionModel)
            if user_id:
                query = query.filter(WinsAuctionModel.user_id == user_id)
            if auction_id:
                query = query.filter(WinsAuctionModel.auction_id == auction_id)
            wins_auctions = query.all()
            logger.info(f"Listed {len(wins_auctions)} wins auctions")
            logger.debug(f"WinsAuctions: {wins_auctions}")
            return wins_auctions
        except Exception as e:
            logger.error(f"Error listing wins auctions: {str(e)}")
            raise
