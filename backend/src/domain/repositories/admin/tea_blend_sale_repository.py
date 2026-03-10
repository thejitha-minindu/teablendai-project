from abc import ABC, abstractmethod
from typing import List
from src.domain.models.tea_blend_sale import TeaBlendSale


class TeaBlendSaleRepository(ABC):

    @abstractmethod
    def add(self, sale: TeaBlendSale):
        pass

    @abstractmethod
    def add_bulk(self, sales: List[TeaBlendSale]):
        pass

    @abstractmethod
    def get_by_id(self, sale_id: int) -> TeaBlendSale:
        pass