from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

AuctionType = Literal["scheduled", "live", "history"]

# Base auction data model - full data representation
class AuctionData(BaseModel):
    auction_id: str
    seller_id: str
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    date: datetime
    duration: float
    status: AuctionType
    buyer: Optional[str] = None
    sold_price: Optional[float] = None
    countdown: Optional[float] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# home page preview cards
class AuctionCardHomePreview(BaseModel):
    auction_id: str
    grade: str
    quantity: float
    base_price: float
    date: datetime
    status: AuctionType
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# auction cards
class AuctionCard(BaseModel):
    auction_id: str
    auction_name: str
    company_name: str
    estate_name: str
    grade: str
    quantity: float
    base_price: float
    date: datetime

    class Config:
        from_attributes = True

# history cards
class AuctionHistoryCard(BaseModel):
    auction_id: str
    auction_name: str
    company_name: str
    estate_name: str
    grade: str
    quantity: float
    date: datetime
    buyer: Optional[str] = None
    sold_price: Optional[float] = None

    class Config:
        from_attributes = True

# order cards
class AuctionOrderCard(BaseModel):
    auction_id: str
    auction_name: str
    company_name: str
    estate_name: str
    grade: str
    quantity: float
    sold_price: Optional[float] = None
    date: datetime

    class Config:
        from_attributes = True

# create/update requests
class AuctionCreateRequest(BaseModel):
    seller_id: str
    auction_name: str
    grade: str
    company_name: str
    estate_name: str
    quantity: float
    base_price: float
    date: datetime
    duration: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

# API responses
class AuctionResponse(BaseModel):
    success: bool
    data: Optional[AuctionData] = None
    message: Optional[str] = None

    class Config:
        from_attributes = True

# list responses
class AuctionListResponse(BaseModel):
    success: bool
    data: list[AuctionData] = Field(default_factory=list)
    total: int = 0
    page: Optional[int] = None
    page_size: Optional[int] = None

    class Config:
        from_attributes = True

# Backward compatibility alias
Auction = AuctionData
