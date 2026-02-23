from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class TeaPurchase(Base):
    __tablename__ = "TeaPurchase"

    PurchaseID = Column(String, primary_key=True)
    SourceType = Column(String)
    Standard = Column(String)
    PricePerKg = Column(Float)
    QuantityKg = Column(Float)
    PurchaseDate = Column(Date)
