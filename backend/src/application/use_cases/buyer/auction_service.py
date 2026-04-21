from uuid import UUID
from sqlalchemy.orm import Session
from src.application.schemas.seller.auction import Auction
from datetime import datetime, timedelta, timezone
from src.application.schemas.buyer.auction import Auction, AuctionCreate
from src.infrastructure.repositories.buyer.auction_repository import AuctionRepository
from src.domain.models.auction_status import AuctionStatus
from src.application.use_cases.auction_status_updater import sync_auction_statuses
from typing import Optional

class AuctionService:
    def __init__(self, db: Session):
        self.repo = AuctionRepository(db)

    def create_auction(self, auction_data: AuctionCreate):
        # We can add extra business logic here later (e.g. validate seller limit)
        return self.repo.create_auction(auction_data)

    def _update_auction_statuses(self):
        sync_auction_statuses(self.repo.db)

    def update_auction(self, auction_id: str, update_data: AuctionCreate):
        # Convert Pydantic model to dict, excluding None values
        data_dict = update_data.model_dump(exclude_unset=True)
        return self.repo.update(auction_id, data_dict)

    def get_auction(self, auction_id: str):
        self._update_auction_statuses()
        return self.repo.get_auction_by_id(auction_id)

    def list_auctions(self, user_id: str = None, as_buyer: bool = False, status: str = None):
        self._update_auction_statuses()
        return self.repo.list_auctions(user_id=user_id, as_buyer=as_buyer, status=status)
    
    def get_scheduled_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses() # Keep your team's auto-update logic!
        return self.repo.get_by_status(AuctionStatus.SCHEDULE.value, seller_id)

    def get_live_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status(AuctionStatus.LIVE.value, seller_id)

    def get_history_auctions(self, seller_id: Optional[UUID] = None):
        self._update_auction_statuses()
        return self.repo.get_by_status(AuctionStatus.HISTORY.value, seller_id)

    def list_auctions_history(self, user_id: str, as_buyer: bool = False):
        self._update_auction_statuses()
        return self.repo.list_auctions_history(user_id=user_id, as_buyer=as_buyer)

    def list_auctions_order(self, user_id: str):
        self._update_auction_statuses()
        return self.repo.list_auctions_order(user_id=user_id)

    def list_auctions_watchlist(self, user_id: str):
        self._update_auction_statuses()
        return self.repo.list_auctions_watchlist(user_id=user_id)

    def get_home_preview_auctions(self, user_id: str):
        self._update_auction_statuses()
        return self.repo.get_home_preview_auctions(user_id=user_id)
        
    def delete_auction(self, auction_id: str):
        return self.repo.delete(auction_id)

    def add_to_watchlist(self, user_id: str, auction_id: str):
        return self.repo.add_to_watchlist(user_id, auction_id)

    def remove_from_watchlist(self, user_id: str, auction_id: str):
        return self.repo.remove_from_watchlist(user_id, auction_id)