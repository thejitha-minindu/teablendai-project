from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from src.infrastructure.database.base import Base
import enum

class OrderStatus(enum.Enum):
	pending = "pending"
	completed = "completed"
	canceled = "canceled"

class PaymentMethod(enum.Enum):
	credit_card = "credit_card"
	paypal = "paypal"
	bank_transfer = "bank_transfer"

class PaymentStatus(enum.Enum):
	successful = "successful"
	failed = "failed"
	pending = "pending"

class WinsAuction(Base):
	__tablename__ = "wins_auction"

	auction_id = Column(String(64), ForeignKey("auctions.auction_id"), primary_key=True)
	user_id = Column(String(64), primary_key=True)
	order_id = Column(String(64), ForeignKey("orders.order_id"), primary_key=True)

class Order(Base):
	__tablename__ = "orders"

	order_id = Column(String(64), primary_key=True, index=True)
	user_id = Column(String(64), nullable=False)
	auction_id = Column(String(64), ForeignKey("auctions.auction_id"), unique=True, nullable=False)
	total_amount = Column(Float, nullable=False)
	order_date = Column(DateTime, nullable=False)
	status = Column(Enum(OrderStatus), nullable=False)

	payment_details = relationship("PaymentDetails", back_populates="order", uselist=False)
	auction = relationship("Auction", back_populates="order", uselist=False)

class PaymentDetails(Base):
	__tablename__ = "payment_details"

	payment_id = Column(String(64), primary_key=True, index=True)
	payment_method = Column(Enum(PaymentMethod), nullable=False)
	payment_date = Column(DateTime, nullable=False)
	order_id = Column(String(64), ForeignKey("orders.order_id"), nullable=False, unique=True)
	amount = Column(Float, nullable=False)
	status = Column(Enum(PaymentStatus), nullable=False)

	order = relationship("Order", back_populates="payment_details")
