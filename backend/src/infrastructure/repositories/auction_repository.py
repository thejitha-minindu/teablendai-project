from sqlalchemy.orm import Session
from typing import List
import uuid
from src.domain.models.auction import Auction as AuctionModel
from src.application.schemas.auction import Auction, AuctionCreate
from src.domain.repositories.auction_repository import AuctionRepositoryInterface

class AuctionRepository(AuctionRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    def create_auction(self, auction_data: AuctionCreate) -> Auction:
        new_id = str(uuid.uuid4())
        
        db_auction = AuctionModel(
            auction_id=new_id,
            seller_id="user_123_placeholder", 
            seller_brand=auction_data.seller_brand,
            grade=auction_data.grade,
            quantity=auction_data.quantity,
            origin=auction_data.origin,
            description=auction_data.description,
            base_price=auction_data.base_price,
            start_time=auction_data.start_time,
            duration=auction_data.duration,
            status="Scheduled"
        )
        
        self.db.add(db_auction)
        self.db.commit()
        self.db.refresh(db_auction)
        return db_auction
    
    def get_auction(self, auction_id: str):
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id == auction_id).first()

    def list_auctions(self):
        return self.db.query(AuctionModel).all()

    def get_by_status(self, status: str) -> List[Auction]:
        return self.db.query(AuctionModel).filter(AuctionModel.status == status).all()

    def get_by_id(self, auction_id: str) -> Auction:
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id == auction_id).first()

    def delete(self, auction_id: str) -> bool:
        auction = self.get_by_id(auction_id)
        if auction:
            self.db.delete(auction)
            self.db.commit()
            return True
        return False

    def update(self, auction_id: str, update_data: dict) -> AuctionModel:
        # Fetch the auction
        auction = self.get_by_id(auction_id)
        if not auction:
            return None
        
        # Update fields dynamically
        for key, value in update_data.items():
            if hasattr(auction, key) and value is not None:
                setattr(auction, key, value)
        
        self.db.commit()
        self.db.refresh(auction)
        return auction