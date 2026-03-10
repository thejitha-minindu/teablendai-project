from sqlalchemy.orm import Session
from sqlalchemy import func
from src.infrastructure.database.models.auction_orm import AuctionORM


class AdminRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_total_auctions(self):
        return self.db.query(func.count(AuctionORM.auction_id)).scalar()