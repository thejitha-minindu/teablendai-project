from sqlalchemy import Column, ForeignKey, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4
from src.infrastructure.database.base import Base
from src.domain.models.auction_status import AuctionStatus

class Auction(Base):
    __tablename__ = "auctions"

    auction_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    custom_auction_id = Column(String(256), unique=True, nullable=True, index=True)
    auction_name = Column(String(128), nullable=False)
    seller_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=False)
    seller_brand = Column(String(100), nullable=True)
    grade = Column(String(64), nullable=False)
    company_name = Column(String(128), nullable=False)
    estate_name = Column(String(128), nullable=False)
    quantity = Column(Float, nullable=False)
    origin = Column(String(100), nullable=False)    
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False)
    duration = Column(Float, nullable=False)
    status = Column(String(20), default=AuctionStatus.SCHEDULE.value)
    buyer = Column(UNIQUEIDENTIFIER, nullable=True)
    sold_price = Column(Float, nullable=True)
    image_url = Column(String(256))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bids = relationship("Bid", back_populates="auction")
    order = relationship("Order", back_populates="auction", uselist=False)
