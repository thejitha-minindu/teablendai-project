from pydantic import BaseModel, Field, validator
from typing import List


class CustomerCreate(BaseModel):
    name: str = Field(..., description="Customer name")
    region: str = Field(..., description="Customer region")


class CustomerResponse(BaseModel):
    id: int
    name: str
    region: str


class CustomerBulkUpload(BaseModel):
    customers: List[CustomerCreate]