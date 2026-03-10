from abc import ABC, abstractmethod
from typing import List
from src.domain.models.blend_purchase_mapping import BlendPurchaseMapping


class BlendPurchaseMappingRepository(ABC):

    @abstractmethod
    def add(self, mapping: BlendPurchaseMapping):
        pass

    @abstractmethod
    def add_bulk(self, mappings: List[BlendPurchaseMapping]):
        pass

    @abstractmethod
    def get_by_sale_id(self, sale_id: int) -> List[BlendPurchaseMapping]:
        pass