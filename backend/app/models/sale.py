from sqlalchemy import Column, String, Float, Date
from app.database import Base

class TeaBlendSale(Base):
    __tablename__ = "TeaBlendSale"

    SaleID = Column(String, primary_key=True)
    CustomerID = Column(String)
    BlendName = Column(String)
    PricePerKg = Column(Float)
    QuantityKg = Column(Float)
    SaleDate = Column(Date)
