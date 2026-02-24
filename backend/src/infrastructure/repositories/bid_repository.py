from sqlalchemy.orm import Session
from src.infrastructure.database.bid import Bid as BidModel
from src.application.schemas.bid import Bid
from src.domain.repositories.bid_repository import BidRepositoryInterface

class BidRepository(BidRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    def create_bid(self, bid: Bid):
        db_bid = BidModel(**bid.dict())
        self.db.add(db_bid)
        self.db.commit()
        self.db.refresh(db_bid)
        return db_bid

    def get_bid(self, bid_id: str):
        return self.db.query(BidModel).filter(BidModel.bid_id == bid_id).first()

    def list_bids(self):
        return self.db.query(BidModel).all()
