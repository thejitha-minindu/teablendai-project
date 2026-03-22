# src/application/use_cases/admin/get_all_auctions.py
from src.infrastructure.repositories.admin.auction_repository import AuctionRepository
from src.application.use_cases.auction_status_updater import sync_auction_statuses

class GetAllAuctionsUseCase:
    def __init__(self, repository: AuctionRepository):
        self.repository = repository

    def execute(self):
        sync_auction_statuses(self.repository.db)
        return self.repository.get_all()