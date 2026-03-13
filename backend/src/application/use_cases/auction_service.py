from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.application.schemas.auction import Auction, AuctionCreate
from src.infrastructure.repositories.auction_repository import AuctionRepository
from typing import Optional

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction_data: AuctionCreate):
        # We can add extra business logic here later (e.g. validate seller limit)
        return self.repo.create_auction(auction_data)

    @staticmethod
    def _normalize_datetime_for_compare(dt_value: datetime) -> datetime:
        """Normalize DB datetime to naive local datetime for fair comparisons."""
        if dt_value.tzinfo is not None:
            return dt_value.astimezone().replace(tzinfo=None)
        return dt_value

    @staticmethod
    def _duration_to_minutes(duration_value: float) -> int:
        """Support legacy hours and new minutes storage for duration."""
        try:
            duration = float(duration_value)
        except (TypeError, ValueError):
            return 0

        if duration <= 0:
            return 0

        # Legacy records often use hours (e.g. 24), newer flow stores minutes (e.g. 900)
        if duration <= 24:
            return int(round(duration * 60))

        return int(round(duration))

    def _update_auction_statuses(self):
        """
        1. Checks 'Scheduled' -> 'Live' (Start Time passed)
        2. Checks 'Live' -> 'History' (Duration ended)
        """
        # Compare against local naive time because user-entered times are local/naive.
        now_local = datetime.now()

        # --- PART 1: Scheduled -> Live ---
        scheduled = self.repo.get_by_status("Scheduled")
        for auction in scheduled:
            db_time = self._normalize_datetime_for_compare(auction.start_time)

            # If start time is passed, make it LIVE
            if db_time <= now_local:
                auction.status = "Live"
                self.repo.db.add(auction)

        # --- PART 2: Live -> History (NEW LOGIC) ---
        live_auctions = self.repo.get_by_status("Live")
        for auction in live_auctions:
            start_time = self._normalize_datetime_for_compare(auction.start_time)
            duration_minutes = self._duration_to_minutes(auction.duration)
            end_time = start_time + timedelta(minutes=duration_minutes)

            # If current time is past end time, move to History
            if now_local >= end_time:
                auction.status = "History"
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
        self._update_auction_statuses()
        return self.repo.get_auction(auction_id)

    def list_auctions(self):
        self._update_auction_statuses()
        return self.repo.list_auctions()
    
    def get_scheduled_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses() # Keep your team's auto-update logic!
        return self.repo.get_by_status("Scheduled", seller_id)

    def get_live_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status("Live", seller_id)

    def get_history_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status("History", seller_id)
        
    def delete_auction(self, auction_id: str):
        return self.repo.delete(auction_id)