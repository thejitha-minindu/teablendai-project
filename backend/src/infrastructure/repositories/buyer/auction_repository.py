from sqlalchemy.orm import Session
from src.domain.models.auction import Auction as AuctionModel
from src.application.schemas.buyer.auction import Auction
from src.domain.models.user import User
from src.domain.repositories.buyer.auction_repository import AuctionRepositoryInterface

class AuctionRepository(AuctionRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    def create_auction(self, auction: Auction):
        db_auction = AuctionModel(**auction.dict(exclude={"countdown"}))
        self.db.add(db_auction)
        self.db.commit()
        self.db.refresh(db_auction)
        return db_auction

    def get_auction_by_id(self, auction_id: str):
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id == auction_id).first()


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

    def list_auctions_history(self, user_id: str, as_buyer: bool = False):
        return self.list_auctions(user_id=user_id, as_buyer=as_buyer, status="history")

    def list_auctions_order(self, user_id: str):
        return self.list_auctions(user_id=user_id, as_buyer=True, status="history")
 
    def list_auctions_watchlist(self, user_id: str):
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user or not user.watch_list:
            return []
        auction_ids = [entry.auction_id for entry in user.watch_list]
        if not auction_ids:
            return []
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id.in_(auction_ids)).all()

    def get_home_preview_auctions(self, user_id: str):
        query = self.db.query(AuctionModel).filter(AuctionModel.seller_id == user_id, AuctionModel.status == "live").order_by(AuctionModel.date.desc())
        return query.limit(5).all()