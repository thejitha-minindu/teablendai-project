from abc import ABC, abstractmethod
from typing import List
from src.domain.models.tea_purchase import TeaPurchase

class TeaPurchaseRepository(ABC):

    @abstractmethod
    def add_bulk(self, purchases: List[TeaPurchase]):
        pass