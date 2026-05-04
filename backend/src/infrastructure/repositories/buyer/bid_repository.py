from sqlalchemy.orm import Session
from src.domain.models.bid import Bid as BidModel
from src.domain.models.user import User
from src.application.schemas.buyer.bid import Bid
from src.domain.repositories.buyer.bid_repository import BidRepositoryInterface
import logging

logger = logging.getLogger(__name__)

class BidRepository(BidRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db
        logger.info("BidRepository initialized")


    # Create a new bid in the database
    def create_bid(self, bid: Bid):
        try:
            logger.info("Creating a new bid")
            logger.debug(f"Bid data: {bid}")
            db_bid = BidModel(**bid.dict())
            self.db.add(db_bid)
            self.db.commit()
            self.db.refresh(db_bid)
            logger.info(f"Bid created with id: {db_bid.bid_id}")
            return db_bid
        except Exception:
            self.db.rollback()
            logger.exception("Error creating bid")
            raise
    

    # List bids with optional filters
    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        try:
            logger.info("Listing bids")
            logger.debug(f"Filters - user_id: {user_id}, auction_id: {auction_id}, min_amount: {min_amount}")
            query = self.db.query(BidModel)
            if user_id:
                query = query.filter(BidModel.buyer_id == user_id)
            if auction_id:
                query = query.filter(BidModel.auction_id == auction_id)
            if min_amount is not None:
                query = query.filter(BidModel.bid_amount >= min_amount)
            bids = query.all()
            logger.debug(f"Found {len(bids)} bids")
            return bids
        except Exception:
            logger.exception("Error listing bids")
            raise


    # Get details of a specific bid
    def get_bid_details(self, bid_id: str):
        try:
            logger.info(f"Getting details for bid_id: {bid_id}")
            bid = self.db.query(BidModel).filter(BidModel.bid_id == bid_id).first()
            logger.debug(f"Bid details: {bid}")
            return bid
        except Exception:
            logger.exception(f"Error getting bid details for bid_id: {bid_id}")
            raise

    # List all bids for a specific auction
    def list_bids_by_auction(self, auction_id: str):
        try:
            logger.info(f"Listing bids for auction_id: {auction_id}")
            return self.list_bids(auction_id=auction_id)
        except Exception:
            logger.exception(f"Error listing bids for auction_id: {auction_id}")
            raise


    # List all bids for a user in a specific auction
    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        try:
            logger.info(f"Listing bids for user_id: {user_id} in auction_id: {auction_id}")
            return self.list_bids(user_id=user_id, auction_id=auction_id)
        except Exception:
            logger.exception(f"Error listing bids for user_id: {user_id} in auction_id: {auction_id}")
            raise


    # Get the highest bid for a specific auction
    def get_highest_bid_for_auction(self, auction_id: str):
        try:
            logger.info(f"Getting highest bid for auction_id: {auction_id}")
            bid = self.db.query(BidModel).filter(BidModel.auction_id == auction_id).order_by(BidModel.bid_amount.desc()).first()
            logger.debug(f"Highest bid: {bid}")
            return bid
        except Exception:
            logger.exception(f"Error getting highest bid for auction_id: {auction_id}")
            raise


    # List bids for an auction with buyer names
    def list_bids_by_auction_with_user_info(self, auction_id: str):
        try:
            results = self.db.query(BidModel, User.first_name, User.last_name, User.user_name).outerjoin(
                User, BidModel.buyer_id == User.user_id
            ).filter(
                BidModel.auction_id == auction_id
            ).all()
            
            bids = []
            for bid_model, first_name, last_name, user_name in results:
                first_name = first_name or ""
                last_name = last_name or ""
                real_name = f"{first_name} {last_name}".strip()
                bid_model.buyer_name = real_name if real_name else user_name
                bids.append(bid_model)
            
            logger.debug(f"Found {len(bids)} bids with user info")
            return bids
        except Exception:
            logger.exception(f"Error listing bids with user info for auction_id: {auction_id}")
            raise
