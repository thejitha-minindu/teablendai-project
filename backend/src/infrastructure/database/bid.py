from sqlalchemy import Column, String, Float, DateTime
from src.database import Base

class Bid(Base):
    __tablename__ = "bids"

    bid_id = Column(String(64), primary_key=True, index=True)
    auction_id = Column(String(64), index=True)
    bid_amount = Column(Float)
    bid_time = Column(DateTime)
    buyer_id = Column(String(64), index=True)