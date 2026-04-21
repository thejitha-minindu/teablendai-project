from sqlalchemy import Column, ForeignKey, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4
from src.infrastructure.database.base import Base

class Bid(Base):
    __tablename__ = "bids"

    bid_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    auction_id = Column(UNIQUEIDENTIFIER, ForeignKey("auctions.auction_id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=False, index=True)
    bid_amount = Column(Float)
    bid_time = Column(DateTime(timezone=True))

    auction = relationship("Auction", back_populates="bids")
    user = relationship("User", back_populates="bids")