from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime


class TeaBlendSaleCSVRow(BaseModel):
    customer_id: int = Field(..., gt=0)
    blend_name: str = Field(..., description="Name of the blend")
    quantity_kg: float = Field(..., gt=0)
    price_per_kg: float = Field(..., gt=0)
    sale_date: str = Field(..., description="Date in YYYY-MM-DD format")

    @validator("sale_date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class CSVUploadResponse(BaseModel):
    sale_id: int
    customer_id: int
    blend_name: str
    quantity_kg: float
    price_per_kg: float
    sale_date: datetime


class TeaBlendSaleCSVUpload(BaseModel):
    file_name: str
    uploaded_at: datetime
    status: str = Field(..., description="pending, processing, completed, failed")