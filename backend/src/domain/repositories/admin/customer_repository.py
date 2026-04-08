from abc import ABC, abstractmethod
from typing import List
from src.domain.models.customer import Customer


class CustomerRepository(ABC):

    @abstractmethod
    def add(self, customer: Customer):
        pass

    @abstractmethod
    def add_bulk(self, customers: List[Customer]):
        pass

    @abstractmethod
    def get_by_id(self, customer_id: int) -> Customer:
        pass

    @abstractmethod
    def get_all(self) -> List[Customer]:
        pass