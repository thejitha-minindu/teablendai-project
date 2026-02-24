from abc import ABC, abstractmethod
from src.application.schemas.bid import Bid

class BidRepositoryInterface(ABC):
    @abstractmethod
    def create_bid(self, bid: Bid):
        pass

    @abstractmethod
    def get_bid(self, bid_id: str):
        pass

    @abstractmethod
    def list_bids(self):
        pass
