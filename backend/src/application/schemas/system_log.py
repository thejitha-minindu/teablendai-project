from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID


class SystemLogCreate(BaseModel):
    user_name: str
    user_id: Optional[UUID] = None
    activity_type: str
    status: Literal["success", "warning", "error"] = "success"
    ip_address: Optional[str] = None
    details: str


class SystemLogResponse(BaseModel):
    id: str
    userName: str
    userId: Optional[str] = None
    activityType: str
    timestamp: str
    status: str
    ipAddress: Optional[str] = None
    details: str

    class Config:
        from_attributes = True


class SystemLogFilters(BaseModel):
    status: Optional[str] = None
    activity_type: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    search: Optional[str] = None
    skip: int = 0
    limit: int = 50


class SystemLogListResponse(BaseModel):
    items: list[SystemLogResponse]
    total: int
    skip: int
    limit: int
