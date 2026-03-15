from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.application.schemas.auction import Auction, AuctionCreate
from src.infrastructure.repositories.auction_repository import AuctionRepository
from src.domain.models.auction_status import AuctionStatus
from typing import Optional

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction_data: AuctionCreate):
        # We can add extra business logic here later (e.g. validate seller limit)
        return self.repo.create_auction(auction_data)

    def _update_auction_statuses(self):
        """
        1. Checks 'Scheduled' -> 'Live' (Start Time passed)
        2. Checks 'Live' -> 'History' (Duration ended)
        """
        # Get Current UTC Time (Naive) to match Database storage
        now_utc = datetime.utcnow() 

        # --- PART 1: Scheduled -> Live ---
        scheduled = self.repo.get_by_status(AuctionStatus.SCHEDULE.value)
        for auction in scheduled:
            # Strip timezone info from DB time to ensure fair comparison
            db_time = auction.start_time
            if db_time.tzinfo is not None:
                db_time = db_time.replace(tzinfo=None)

            # If start time is passed, make it LIVE
            if db_time <= now_utc:
                auction.status = AuctionStatus.LIVE.value
                self.repo.db.add(auction)

        # --- PART 2: Live -> History (NEW LOGIC) ---
        live_auctions = self.repo.get_by_status(AuctionStatus.LIVE.value)
        for auction in live_auctions:
            # Strip timezone info
            start_time = auction.start_time
            if start_time.tzinfo is not None:
                start_time = start_time.replace(tzinfo=None)
            
            # Calculate End Time
            # duration is usually stored as hours (float or int)
            end_time = start_time + timedelta(hours=auction.duration)

            # If current time is past end time, move to History
            if now_utc >= end_time:
                auction.status = AuctionStatus.HISTORY.value
                # Optionally set a default result if no buyer exists
                if not auction.buyer:
                    auction.sold_price = 0 # Or mark as Unsold logic if you have it
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
    
    def get_scheduled_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses() # Keep your team's auto-update logic!
        return self.repo.get_by_status(AuctionStatus.SCHEDULE.value, seller_id)

    def get_live_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status(AuctionStatus.LIVE.value, seller_id)

    def get_history_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status(AuctionStatus.HISTORY.value, seller_id)
        
    def delete_auction(self, auction_id: str):
        return self.repo.delete(auction_id)