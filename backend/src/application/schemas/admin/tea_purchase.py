from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

class TeaPurchaseCSVRow(BaseModel):
    tea_name: str = Field(..., description="Name of the tea")
    supplier_name: str = Field(..., description="Supplier name")
    quantity: float = Field(..., gt=0, description="Quantity purchased")
    unit: str = Field(..., description="Unit of measurement (kg, lbs, etc.)")
    price_per_unit: float = Field(..., gt=0, description="Price per unit")
    purchase_date: str = Field(..., description="Date in YYYY-MM-DD format")
    notes: Optional[str] = Field(None, description="Additional notes")

    @validator("purchase_date")
    def validate_date(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class CSVUploadResponse(BaseModel):
    total_rows: int
    successful_rows: int
    failed_rows: int
    errors: List[dict] = Field(default_factory=list)
    message: str


class TeaPurchaseCSVUpload(BaseModel):
    file_name: str
    uploaded_at: datetime
    status: str = Field(..., description="pending, processing, completed, failed")