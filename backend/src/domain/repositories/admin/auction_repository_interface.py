from abc import ABC, abstractmethod

class AuctionRepositoryInterface(ABC):

    @abstractmethod
    def get_all(self):
        pass