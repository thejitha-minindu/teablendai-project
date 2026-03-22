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
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    start_time: Optional[datetime] = Field(default=None, alias="start_time")  # For LIVE auctions
    duration: float  # Will be converted to seconds via field_serializer
    status: AuctionType
    buyer: Optional[str] = None
    buyer_name: Optional[str] = None
    sold_price: Optional[float] = None
    countdown: Optional[float] = None
    image_url: Optional[str] = None
    
    @field_serializer('duration')
    def serialize_duration(self, value: float, _info) -> float:
        """Convert duration from hours (database) to seconds (frontend)"""
        return value * 3600 if value is not None else 0
    
    @field_serializer('date')
    def serialize_date(self, value: datetime, _info) -> str:
        """Serialize datetime to ISO format string with timezone"""
        if value is None:
            return None
        # Ensure timezone awareness - if naive, assume UTC
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    
    @field_serializer('start_time')
    def serialize_start_time(self, value: datetime, _info) -> str:
        """Serialize datetime to ISO format string with timezone"""
        if value is None:
            return None
        # Ensure timezone awareness - if naive, assume UTC
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
    duration: float
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
