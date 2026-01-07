from sqlalchemy import Column, ForeignKey, String, Float, DateTime
from sqlalchemy.orm import relationship
from src.infrastructure.database.base import Base

class Bid(Base):
    __tablename__ = "bids"

    bid_id = Column(String(64), primary_key=True, index=True)
    auction_id = Column(String(64), ForeignKey("auctions.auction_id", ondelete="CASCADE"), primary_key=True, index=True)
    buyer_id = Column(String(64), ForeignKey("users.user_id"), primary_key=True, index=True)
    bid_amount = Column(Float)
    bid_time = Column(DateTime)

    auction = relationship("Auction", back_populates="bids")
    user = relationship("User", back_populates="bids")