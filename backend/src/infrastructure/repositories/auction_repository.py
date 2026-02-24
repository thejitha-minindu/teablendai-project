from sqlalchemy.orm import Session
from src.infrastructure.database.auction import Auction as BidModel
from src.application.schemas.auction import Auction
from src.domain.repositories.auction_repository import AuctionRepositoryInterface

class AuctionRepository(AuctionRepositoryInterface):
    def __init__(self, db: Session):
        self.db = db

    def create_auction(self, auction_data: AuctionCreate) -> Auction:
        new_id = str(uuid.uuid4())
        
        db_auction = AuctionModel(
            auction_id=new_id,
            seller_id="12345678-1234-5678-1234-567812345678", # Placeholder, replace with actual seller_id from auth context
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
        return self.db.query(BidModel).filter(BidModel.auction_id == auction_id).first()

    def list_auctions(self):
        return self.db.query(BidModel).all()
