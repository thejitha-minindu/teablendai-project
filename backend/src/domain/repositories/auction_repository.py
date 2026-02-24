from abc import ABC, abstractmethod
from src.application.schemas.auction import Auction

class AuctionRepositoryInterface(ABC):
    @abstractmethod
    def create_auction(self, auction: Auction):
        pass

    @abstractmethod
    def get_auction(self, auction_id: str):
        pass

    @abstractmethod
    def list_auctions(self):
        pass
