from sqlalchemy.orm import Session
from src.application.schemas.auction import Auction
from src.infrastructure.repositories.auction_repository import AuctionRepository

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction: Auction):
        return self.repo.create_auction(auction)

    def get_auction(self, auction_id: str):
        return self.repo.get_auction(auction_id)

    def list_auctions(self):
        return self.repo.list_auctions()