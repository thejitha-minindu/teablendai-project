from sqlalchemy import Column, ForeignKey, String, Float, DateTime
from sqlalchemy.orm import relationship
from src.infrastructure.database.base import Base

class Auction(Base):
    __tablename__ = "auctions"

    auction_id = Column(String(64), primary_key=True, index=True)
    seller_id = Column(String(64), ForeignKey("users.user_id"), nullable=False)
    auction_name = Column(String(128), nullable=False)
    grade = Column(String(64), nullable=False)
    company_name = Column(String(128), nullable=False)
    estate_name = Column(String(128), nullable=False)
    quantity = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    duration = Column(Float, nullable=False)
    status = Column(String(64), nullable=False)
    buyer = Column(String(64))
    sold_price = Column(Float)
    countdown = Column(Float)
    image_url = Column(String(256))

    bids = relationship("Bid", back_populates="auction")
    order = relationship("Order", back_populates="auction", uselist=False)