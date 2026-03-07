from sqlalchemy import Column, String, Float, DateTime
from src.database import Base

class Auction(Base):
    __tablename__ = "auctions"

    auction_id = Column(String(64), primary_key=True, index=True)
    seller_id = Column(String(64), nullable=False)
    grade = Column(String(64), nullable=False)
    quantity = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    duration = Column(Float, nullable=False)
    status = Column(String(64), nullable=False)
    buyer = Column(String(64), nullable=True)
    sold_price = Column(Float, nullable=True)