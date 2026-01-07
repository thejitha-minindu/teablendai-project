from abc import ABC, abstractmethod
from typing import List
from src.application.schemas.auction import Auction, AuctionCreate
from src.domain.models.auction import Auction

class AuctionRepositoryInterface(ABC):
    @abstractmethod
    def create_auction(self, auction_data: AuctionCreate) -> Auction:
        pass

    @abstractmethod
    def get_auction(self, auction_id: str):
        pass

    @abstractmethod
    def list_auctions(self):
        pass

    @abstractmethod
    def get_by_status(self, status: str) -> List[Auction]:
        pass

    @abstractmethod
    def get_by_id(self, auction_id: str) -> Auction:
        pass

    @abstractmethod
    def delete(self, auction_id: str) -> bool:
        pass
