from sqlalchemy.orm import Session
from src.infrastructure.database.auction import Auction as BidModel
from src.application.schemas.auction import Auction
from src.domain.repositories.auction_repository import AuctionRepositoryInterface

class AuctionRepository(AuctionRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    def create_auction(self, auction: Auction):
        db_auction = BidModel(**auction.dict(exclude={"countdown"}))
        self.db.add(db_auction)
        self.db.commit()
        self.db.refresh(db_auction)
        return db_auction
    
    def get_auction(self, auction_id: str):
        return self.db.query(BidModel).filter(BidModel.auction_id == auction_id).first()

    def list_auctions(self):
        return self.db.query(BidModel).all()
