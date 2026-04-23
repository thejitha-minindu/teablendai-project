from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4
from datetime import datetime
from src.infrastructure.database.base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=True)
    phone_num = Column(String(32), nullable=False)
    user_name = Column(String(64), unique=True, nullable=False)
    first_name = Column(String(64), nullable=False)
    last_name = Column(String(64), nullable=False)
    default_role = Column(String(16), nullable=False)
    profile_image_url = Column(String(256))
    status = Column(String(16), default="PENDING", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    financial_details = relationship("FinancialDetails", back_populates="user", uselist=False)
    watch_list = relationship("WatchList", back_populates="user")
    auctions = relationship("Auction", backref="seller", foreign_keys="Auction.seller_id")
    bids = relationship("Bid", back_populates="user")
    verification_status = Column(String, default="PENDING")
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")

class FinancialDetails(Base):
    __tablename__ = "financial_details"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=False, unique=True)
    bank_name = Column(String(128), nullable=False)
    account_num = Column(String(64), nullable=False)
    branch_name = Column(String(128), nullable=False)
    account_holder_name = Column(String(128), nullable=False)

    user = relationship("User", back_populates="financial_details")

class WatchList(Base):
    __tablename__ = "watch_lists"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=False)
    auction_id = Column(UNIQUEIDENTIFIER, ForeignKey("auctions.auction_id"), nullable=False)

    user = relationship("User", back_populates="watch_list")
    auction = relationship("Auction")
