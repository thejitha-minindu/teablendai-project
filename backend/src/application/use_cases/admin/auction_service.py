from src.infrastructure.repositories.admin.auction_repository import AuctionRepository


class AuctionService:

    def __init__(self, db):
        self.repo = AuctionRepository(db)

    def get_all_auctions(self):
        return self.repo.get_all()