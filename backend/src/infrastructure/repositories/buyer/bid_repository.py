from sqlalchemy.orm import Session
from src.domain.models.bid import Bid as BidModel
from src.application.schemas.buyer.bid import Bid
from src.domain.repositories.buyer.bid_repository import BidRepositoryInterface
import logging

logger = logging.getLogger(__name__)

class BidRepository(BidRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db
        logger.info("BidRepository initialized")

    def create_bid(self, bid: Bid):
        # Create a new bid in the database
        logger.info("Creating a new bid")
        logger.debug(f"Bid data: {bid}")
        db_bid = BidModel(**bid.dict())
        self.db.add(db_bid)
        self.db.commit()
        self.db.refresh(db_bid)
        logger.info(f"Bid created with id: {db_bid.bid_id}")
        return db_bid
    
    def list_bids(self, user_id: str = None, auction_id: str = None, min_amount: float = None):
        # List bids with optional filters
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

    def get_bid_details(self, bid_id: str):
        # Get details of a specific bid
        logger.info(f"Getting details for bid_id: {bid_id}")
        bid = self.db.query(BidModel).filter(BidModel.bid_id == bid_id).first()
        logger.debug(f"Bid details: {bid}")
        return bid

    def list_bids_by_auction(self, auction_id: str):
        # List all bids for a specific auction
        logger.info(f"Listing bids for auction_id: {auction_id}")
        return self.list_bids(auction_id=auction_id)

    def list_bids_by_user_auction(self, user_id: str, auction_id: str):
        # List all bids for a user in a specific auction
        logger.info(f"Listing bids for user_id: {user_id} in auction_id: {auction_id}")
        return self.list_bids(user_id=user_id, auction_id=auction_id)

    def get_highest_bid_for_auction(self, auction_id: str):
        # Get the highest bid for a specific auction
        logger.info(f"Getting highest bid for auction_id: {auction_id}")
        bid = self.db.query(BidModel).filter(BidModel.auction_id == auction_id).order_by(BidModel.bid_amount.desc()).first()
        logger.debug(f"Highest bid: {bid}")
        return bid
