from pydantic import BaseModel, Field
from typing import List


class BlendPurchaseMappingRow(BaseModel):
    sale_id: int = Field(..., gt=0)
    purchase_id: int = Field(..., gt=0)
    standard: str = Field(..., description="Tea standard used")
    quantity_used_kg: float = Field(..., gt=0)


class BlendPurchaseMappingResponse(BaseModel):
    id: int
    sale_id: int
    purchase_id: int
    standard: str
    quantity_used_kg: float