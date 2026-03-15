from typing import Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, field_serializer, field_validator
from uuid import UUID

AuctionType = Literal["Scheduled", "Live", "History"]

# Base auction data model - full data representation
class AuctionData(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    auction_id: UUID
    seller_id: UUID
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    date: datetime = Field(validation_alias="start_time", serialization_alias="date")
    duration: float
    status: AuctionType
    buyer: Optional[str] = None
    sold_price: Optional[float] = None
    countdown: Optional[float] = None
    image_url: Optional[str] = None
    
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
