from sqlalchemy import Column, Integer, String, Float, Date, DECIMAL
from src.infrastructure.database.base import Base

class TeaPurchaseORM(Base):
    __tablename__ = "TeaPurchase"
    PurchaseID = Column(Integer, primary_key=True, index=True)
    SourceType = Column(String(50))
    Standard = Column(String(50))
    PricePerKg = Column(DECIMAL)
    QuantityKg = Column(DECIMAL)
    PurchaseDate = Column(Date)

class TeaBlendSaleORM(Base):
    __tablename__ = "TeaBlendSale"
    SaleID = Column(Integer, primary_key=True, index=True)
    CustomerID = Column(Integer)
    BlendName = Column(String(100))
    PricePerKg = Column(DECIMAL)
    QuantityKg = Column(DECIMAL)
    SaleDate = Column(Date)

class BlendCompositionORM(Base):
    __tablename__ = "BlendComposition"
    BlendID = Column(Integer, primary_key=True, index=True)
    Standard = Column(String(50))
    Ratio = Column(DECIMAL)

class CustomerORM(Base):
    __tablename__ = "Customer"
    CustomerID = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100))
    Region = Column(String(100))

class BlendPurchaseMappingORM(Base):
    __tablename__ = "BlendPurchaseMapping"
    MappingID = Column(Integer, primary_key=True, index=True)
    SaleID = Column(Integer)
    PurchaseID = Column(Integer)
    Standard = Column(String(50))
    QuantityUsedKg = Column(DECIMAL)
