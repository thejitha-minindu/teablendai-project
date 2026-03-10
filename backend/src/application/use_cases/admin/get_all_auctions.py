# src/application/use_cases/admin/get_all_auctions.py
from src.infrastructure.repositories.admin.auction_repository import AuctionRepository

class GetAllAuctionsUseCase:
    def __init__(self, repository: AuctionRepository):
        self.repository = repository

    def execute(self):
        return self.repository.get_all()