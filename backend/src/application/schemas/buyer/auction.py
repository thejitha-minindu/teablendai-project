from typing import Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, field_serializer, field_validator
from uuid import UUID

AuctionType = Literal["Scheduled", "Live", "History"]

# Base auction data model - full data representation
class AuctionData(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    auction_id: UUID
    custom_auction_id: Optional[str] = None
    seller_id: UUID
    seller_brand: Optional[str] = None
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    origin: Optional[str] = None
    description: Optional[str] = None
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    start_time: Optional[datetime] = Field(default=None, alias="start_time")
    duration: int
    status: AuctionType
    buyer: Optional[str] = None
    buyer_name: Optional[str] = None
    sold_price: Optional[float] = None
    countdown: Optional[float] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    image_url: Optional[str] = None
    
    @field_serializer('date')
    def serialize_date(self, value: datetime, _info) -> str:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    
    @field_serializer('start_time', 'created_at')
    def serialize_datetime(self, value: datetime, _info) -> str:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    
    @field_validator('buyer', mode='before')
    @classmethod
    def convert_buyer_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

# home page preview cards
class AuctionCardHomePreview(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    auction_id: UUID
    grade: str
    quantity: float
    base_price: float
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    status: AuctionType
    image_url: Optional[str] = None

# auction cards
class AuctionCard(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    auction_id: UUID
    auction_name: str
    company_name: str
    estate_name: str
    grade: str
    quantity: float
    base_price: float
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")

# history cards
class AuctionHistoryCard(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    auction_id: UUID
    auction_name: str
    company_name: str
    estate_name: str
    grade: str
    quantity: float
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    buyer: Optional[str] = None
    buyer_name: Optional[str] = None
    sold_price: Optional[float] = None
    
    @field_validator('buyer', mode='before')
    @classmethod
    def convert_buyer_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value

# order cards
class AuctionOrderCard(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    auction_id: UUID
    auction_name: str
    company_name: str
    estate_name: str
    grade: str
    quantity: float
    sold_price: Optional[float] = None
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    buyer_name: Optional[str] = None
    order_id: Optional[str] = None
    
    @field_serializer('date')
    def serialize_date(self, value: datetime, _info) -> str:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()

# create/update requests
class AuctionCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    seller_id: UUID
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    duration: int
    image_url: Optional[str] = None

# API responses
class AuctionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    success: bool
    data: Optional[AuctionData] = None
    message: Optional[str] = None

# list responses
class AuctionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    success: bool
    data: list[AuctionData] = Field(default_factory=list)
    total: int = 0
    page: Optional[int] = None
    page_size: Optional[int] = None

# Backward compatibility alias
Auction = AuctionData
AuctionCreate = AuctionCreateRequest
