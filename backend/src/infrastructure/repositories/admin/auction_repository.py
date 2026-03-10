from sqlalchemy.orm import Session
from src.domain.repositories.admin.auction_repository_interface import AuctionRepositoryInterface
from src.infrastructure.database.models.auction_orm import AuctionORM


class AuctionRepository(AuctionRepositoryInterface):

    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        auctions = self.db.query(AuctionORM).all()
        return auctions