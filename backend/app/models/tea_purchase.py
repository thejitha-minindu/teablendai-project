from sqlalchemy import Column, Integer, String, DECIMAL, Date
from app.database import Base

class TeaPurchase(Base):
    __tablename__ = "TeaPurchase"

    PurchaseID = Column(String, primary_key=True)
    SourceType = Column(String)
    Standard = Column(String)
    PricePerKg = Column(DECIMAL)
    QuantityKg = Column(DECIMAL)
    PurchaseDate = Column(Date)