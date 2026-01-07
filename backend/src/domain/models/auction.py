from sqlalchemy import Column, String, Float, DateTime, Integer, Text
from sqlalchemy.sql import func
from src.infrastructure.database.base import Base

class Auction(Base):
    __tablename__ = "auctions"

    auction_id = Column(String(64), primary_key=True, index=True)
    seller_id = Column(String(64), nullable=False)
    seller_brand = Column(String(100), nullable=True)
    grade = Column(String(64), nullable=False)
    quantity = Column(Float, nullable=False)
    origin = Column(String(100), nullable=False)    
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False)
    duration = Column(Float, nullable=False)
    status = Column(String(20), default="Scheduled")
    buyer = Column(String(64))
    sold_price = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
