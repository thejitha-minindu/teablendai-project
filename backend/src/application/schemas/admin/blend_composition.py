from pydantic import BaseModel, Field
from typing import List


class BlendCompositionRow(BaseModel):
    blend_id: int = Field(..., gt=0)
    standard: str = Field(..., description="Tea standard (FBOP, BOP, etc.)")
    ratio: float = Field(..., gt=0, le=100)


class BlendCompositionResponse(BaseModel):
    id: int
    blend_id: int
    standard: str
    ratio: float