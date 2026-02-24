from sqlalchemy.orm import Session
from src.application.schemas.bid import Bid
from src.infrastructure.repositories.bid_repository import BidRepository

class BidService:
    def __init__(self, db: Session):
        self.repo = BidRepository(db)

    def create_bid(self, bid: Bid):
        return self.repo.create_bid(bid)

    def get_bid(self, bid_id: str):
        return self.repo.get_bid(bid_id)

    def list_bids(self):
        return self.repo.list_bids()
