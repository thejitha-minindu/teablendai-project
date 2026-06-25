from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.infrastructure.database.base import Base
import enum

# --- Extended Order Status for full lifecycle ---
class OrderStatus(enum.Enum):
	pending = "pending"
	confirmed = "confirmed"
	processing = "processing"
	packed = "packed"
	shipped = "shipped"
	out_for_delivery = "out_for_delivery"
	delivered = "delivered"
	completed = "completed"
	canceled = "canceled"

# --- Payment Status ---
class OrderPaymentStatus(enum.Enum):
	pending = "pending"
	paid = "paid"
	failed = "failed"

class PaymentMethod(enum.Enum):
	credit_card = "credit_card"
	paypal = "paypal"
	bank_transfer = "bank_transfer"

class PaymentStatus(enum.Enum):
	successful = "successful"
	failed = "failed"
	pending = "pending"

from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from uuid import uuid4

class WinsAuction(Base):
	__tablename__ = "wins_auction"

	auction_id = Column(UNIQUEIDENTIFIER, ForeignKey("auctions.auction_id"), primary_key=True)
	user_id = Column(UNIQUEIDENTIFIER, primary_key=True)
	order_id = Column(UNIQUEIDENTIFIER, ForeignKey("orders.order_id"), primary_key=True)

class Order(Base):
	__tablename__ = "orders"

	order_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
	display_order_id = Column(String(30), unique=True, nullable=True, index=True)
	user_id = Column(UNIQUEIDENTIFIER, nullable=False)  # buyer
	seller_id = Column(UNIQUEIDENTIFIER, ForeignKey("users.user_id"), nullable=True)
	auction_id = Column(UNIQUEIDENTIFIER, ForeignKey("auctions.auction_id"), unique=True, nullable=False)
	total_amount = Column(Float, nullable=False)
	order_date = Column(DateTime, nullable=False)
	status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)
	order_status = Column(String(30), nullable=False, default="pending")
	payment_status = Column(String(20), nullable=False, default="pending")
	created_at = Column(DateTime(timezone=True), server_default=func.now())
	updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

	payment_details = relationship("PaymentDetails", back_populates="order", uselist=False)
	auction = relationship("Auction", back_populates="order", uselist=False)

class PaymentDetails(Base):
	__tablename__ = "payment_details"

	payment_id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4, index=True)
	payment_method = Column(Enum(PaymentMethod), nullable=False)
	payment_date = Column(DateTime, nullable=False)
	order_id = Column(UNIQUEIDENTIFIER, ForeignKey("orders.order_id"), nullable=False, unique=True)
	amount = Column(Float, nullable=False)
	status = Column(Enum(PaymentStatus), nullable=False)
	stripe_session_id = Column(String(255), nullable=True)
	stripe_payment_intent_id = Column(String(255), nullable=True)

	order = relationship("Order", back_populates="payment_details")

