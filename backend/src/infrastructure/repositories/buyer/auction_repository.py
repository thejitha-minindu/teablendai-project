from sqlalchemy.orm import Session
from src.domain.models.auction import Auction as AuctionModel
from src.application.schemas.buyer.auction import Auction
from src.domain.models.user import User, WatchList
from src.domain.repositories.buyer.auction_repository import AuctionRepositoryInterface
from src.domain.models.auction_status import AuctionStatus

class AuctionRepository(AuctionRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    # Get auction by ID
    def get_auction_by_id(self, auction_id: str):
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id == auction_id).first()


    # List auctions with optional filters
    def list_auctions(self, user_id: str = None, as_buyer: bool = False, status: str = None):
        query = self.db.query(AuctionModel)
        if user_id:
            if as_buyer:
                query = query.filter(AuctionModel.buyer == user_id)
            else:
                query = query.filter(AuctionModel.seller_id == user_id)
        if status:
            query = query.filter(AuctionModel.status == status)
        
        return query.all()

    # List auction history for user
    def list_auctions_history(self, user_id: str, as_buyer: bool = False):
        return self.list_auctions(user_id=user_id, as_buyer=as_buyer, status=AuctionStatus.HISTORY.value)

    # List auctions for user as buyer with history status
    def list_auctions_order(self, user_id: str):
        return self.list_auctions(user_id=user_id, as_buyer=True, status=AuctionStatus.HISTORY.value)
 
    # List auctions in user's watchlist
    def list_auctions_watchlist(self, user_id: str):
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user or not user.watch_list:
            return []
        auction_ids = [entry.auction_id for entry in user.watch_list]
        if not auction_ids:
            return []
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id.in_(auction_ids)).all()

    #  Get preview auctions for home page
    def get_home_preview_auctions(self, user_id: str):
        query = self.db.query(AuctionModel).filter(AuctionModel.seller_id != user_id, AuctionModel.status == AuctionStatus.LIVE.value).order_by(AuctionModel.created_at.desc())
        return query.limit(5).all()
    
    # Add auction to watchlist
    def add_to_watchlist(self, user_id: str, auction_id: str):
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise ValueError("User not found")
        if any(entry.auction_id == auction_id for entry in user.watch_list):
            return  # Already in watchlist
        watchlist_entry = WatchList(user_id=user_id, auction_id=auction_id)
        self.db.add(watchlist_entry)
        self.db.commit()

    # Remove auction from watchlist
    def remove_from_watchlist(self, user_id: str, auction_id: str):
        watchlist_entry = self.db.query(WatchList).filter(
            WatchList.user_id == user_id,
            WatchList.auction_id == auction_id
        ).first()
        if watchlist_entry:
            self.db.delete(watchlist_entry)
            self.db.commit()