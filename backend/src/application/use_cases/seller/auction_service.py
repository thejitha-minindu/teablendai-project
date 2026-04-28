from uuid import UUID
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from src.application.schemas.seller.auction import Auction, AuctionCreate
from src.infrastructure.repositories.seller.auction_repository import AuctionRepository
from src.domain.models.auction_status import AuctionStatus
from src.application.use_cases.auction_status_updater import sync_auction_statuses
from typing import Optional

class AuctionService:
    _last_sync_time = None

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
        now = datetime.now()
        if AuctionService._last_sync_time is None or (now - AuctionService._last_sync_time).total_seconds() > 60:
            sync_auction_statuses(self.repo.db)
            AuctionService._last_sync_time = now

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
        return self.repo.get_by_status(AuctionStatus.SCHEDULE.value, seller_id)

    def get_live_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status(AuctionStatus.LIVE.value, seller_id)

    def get_history_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_history_auctions(seller_id)
        
    def delete_auction(self, auction_id: str):
        return self.repo.delete(auction_id)