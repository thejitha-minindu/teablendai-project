from sqlalchemy.orm import Session
from src.application.schemas.auction import Auction, AuctionCreate
from src.infrastructure.repositories.auction_repository import AuctionRepository

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction_data: AuctionCreate):
        # We can add extra business logic here later (e.g. validate seller limit)
        return self.repo.create_auction(auction_data)

    def update_auction(self, auction_id: str, update_data: AuctionCreate):
        # Convert Pydantic model to dict, excluding None values
        data_dict = update_data.model_dump(exclude_unset=True)
        return self.repo.update(auction_id, data_dict)

    def get_auction(self, auction_id: str):
        return self.repo.get_auction(auction_id)

    def list_auctions(self):
        return self.repo.list_auctions()
    
    def get_scheduled_auctions(self):
        return self.repo.get_by_status("Scheduled")

    def get_live_auctions(self):
        return self.repo.get_by_status("Live")

    def get_history_auctions(self):
        return self.repo.get_by_status("History")
        
    def delete_auction(self, auction_id: str):
        return self.repo.delete(auction_id)