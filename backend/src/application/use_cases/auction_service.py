from sqlalchemy.orm import Session
from datetime import datetime
from src.application.schemas.auction import Auction, AuctionCreate
from src.infrastructure.repositories.auction_repository import AuctionRepository

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction_data: AuctionCreate):
        # We can add extra business logic here later (e.g. validate seller limit)
        return self.repo.create_auction(auction_data)

    def _update_auction_statuses(self):
        """
        Checks all 'Scheduled' auctions. 
        If start_time has passed, change status to 'Live'.
        """
        scheduled = self.repo.get_by_status("Scheduled")
        
        # Get Current UTC Time (Naive) to match Database storage
        now_utc = datetime.utcnow() 

        for auction in scheduled:
            # Strip timezone info from DB time to ensure fair comparison
            db_time = auction.start_time
            if db_time.tzinfo is not None:
                db_time = db_time.replace(tzinfo=None)

            # Compare: If DB time is in the past, go Live
            if db_time <= now_utc:
                auction.status = "Live"
                self.repo.db.add(auction)
        
        self.repo.db.commit()

    def update_auction(self, auction_id: str, update_data: AuctionCreate):
        # Convert Pydantic model to dict, excluding None values
        data_dict = update_data.model_dump(exclude_unset=True)
        return self.repo.update(auction_id, data_dict)

    def get_auction(self, auction_id: str):
        return self.repo.get_auction(auction_id)

    def list_auctions(self):
        self._update_auction_statuses()
        return self.repo.list_auctions()
    
    def get_scheduled_auctions(self):
        self._update_auction_statuses()
        return self.repo.get_by_status("Scheduled")

    def get_live_auctions(self):
        self._update_auction_statuses()
        return self.repo.get_by_status("Live")

    def get_history_auctions(self):
        return self.repo.get_by_status("History")
        
    def delete_auction(self, auction_id: str):
        return self.repo.delete(auction_id)