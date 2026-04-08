from src.infrastructure.database.connection import Base
from sqlalchemy import Column, String, Integer, Float, DateTime

class AuctionORM(Base):
    __tablename__ = 'auctions'
    __table_args__ = {'extend_existing': True}  # prevents "table already defined" errors

    auction_id = Column(String, primary_key=True)
    custom_auction_id = Column(String, nullable=True)
    seller_id = Column(String, nullable=False)
    auction_name = Column(String, nullable=False)
    estate_name = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    base_price = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False)
    status = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)