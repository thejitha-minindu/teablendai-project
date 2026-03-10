from abc import ABC, abstractmethod
from typing import List
from src.domain.models.blend_composition import BlendComposition


class BlendCompositionRepository(ABC):

    @abstractmethod
    def add(self, composition: BlendComposition):
        pass

    @abstractmethod
    def add_bulk(self, compositions: List[BlendComposition]):
        pass

    @abstractmethod
    def get_by_blend_id(self, blend_id: int) -> List[BlendComposition]:
        pass