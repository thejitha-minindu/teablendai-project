from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_user
from src.domain.models.user import User
from src.domain.models.order import Order
from src.domain.models.auction import Auction
import logging

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger(__name__)

# --- Schemas ---
class OrderStatusUpdateRequest(BaseModel):
    order_status: str

class PaymentStatusUpdateRequest(BaseModel):
    payment_status: str

class OrderDetailResponse(BaseModel):
    order_id: str
    display_order_id: Optional[str] = None
    buyer_id: str
    buyer_name: Optional[str] = None
    seller_id: Optional[str] = None
    seller_name: Optional[str] = None
    auction_id: str
    auction_name: Optional[str] = None
    estate_name: Optional[str] = None
    grade: Optional[str] = None
    quantity: Optional[float] = None
    total_amount: float
    sold_price: Optional[float] = None
    order_date: Optional[str] = None
    order_status: str
    payment_status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


def _build_order_response(order: Order, db: Session) -> dict:
    """Build a rich order response with buyer/seller/auction details."""
    auction = order.auction
    buyer = db.query(User).filter(User.user_id == order.user_id).first()

    # Resolve seller: try order.seller_id first, then auction.seller_id as fallback
    seller = None
    resolved_seller_id = order.seller_id
    if resolved_seller_id:
        seller = db.query(User).filter(User.user_id == resolved_seller_id).first()
    if not seller and auction and auction.seller_id:
        resolved_seller_id = auction.seller_id
        seller = db.query(User).filter(User.user_id == resolved_seller_id).first()

    buyer_name = ""
    if buyer:
        buyer_name = " ".join(filter(None, [buyer.first_name, buyer.last_name]))

    # Build seller name with multiple fallbacks
    seller_name = ""
    if seller:
        seller_name = (
            seller.seller_name
            or " ".join(filter(None, [seller.first_name, seller.last_name]))
        )
    if not seller_name and auction:
        seller_name = auction.seller_brand or auction.company_name or auction.estate_name or ""

    return {
        "order_id": str(order.order_id).lower(),
        "display_order_id": order.display_order_id,
        "buyer_id": str(order.user_id).lower(),
        "buyer_name": buyer_name,
        "seller_id": str(resolved_seller_id).lower() if resolved_seller_id else None,
        "seller_name": seller_name,
        "auction_id": str(order.auction_id).lower(),
        "auction_name": auction.auction_name if auction else None,
        "estate_name": auction.estate_name if auction else None,
        "grade": auction.grade if auction else None,
        "quantity": auction.quantity if auction else None,
        "total_amount": order.total_amount,
        "sold_price": auction.sold_price if auction else None,
        "order_date": order.order_date.isoformat() if order.order_date else None,
        "order_status": order.order_status or "pending",
        "payment_status": order.payment_status or "pending",
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }


# --- GET order by ID (accessible by buyer or seller) ---
@router.get("/{order_id}")
def get_order_detail(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    uid = str(current_user.user_id)
    # Access check: must be buyer or seller
    is_buyer = str(order.user_id) == uid
    is_seller = str(order.seller_id) == uid if order.seller_id else False
    # Also check via auction
    if not is_seller and order.auction:
        is_seller = str(order.auction.seller_id) == uid

    if not is_buyer and not is_seller:
        raise HTTPException(status_code=403, detail="Access denied")

    return _build_order_response(order, db)


# --- PATCH order status (seller only) ---
VALID_ORDER_STATUSES = [
    "pending", "confirmed", "processing", "packed",
    "shipped", "out_for_delivery", "delivered", "completed", "canceled"
]

@router.patch("/{order_id}/status")
def update_order_status(
    order_id: str,
    body: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    uid = str(current_user.user_id)
    is_seller = str(order.seller_id) == uid if order.seller_id else False
    if not is_seller and order.auction:
        is_seller = str(order.auction.seller_id) == uid

    if not is_seller:
        raise HTTPException(status_code=403, detail="Only the seller can update order status")

    new_status = body.order_status.lower()
    if new_status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    order.order_status = new_status
    db.commit()
    db.refresh(order)

    logger.info(f"Order {order_id} status updated to '{new_status}' by seller {uid}")
    return _build_order_response(order, db)


# --- PATCH payment status (buyer only) ---
@router.patch("/{order_id}/payment")
def update_payment_status(
    order_id: str,
    body: PaymentStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    uid = str(current_user.user_id)
    is_buyer = str(order.user_id) == uid
    if not is_buyer:
        raise HTTPException(status_code=403, detail="Only the buyer can update payment status")

    new_status = body.payment_status.lower()
    if new_status not in ["pending", "paid", "failed"]:
        raise HTTPException(status_code=400, detail=f"Invalid payment status: {new_status}")

    order.payment_status = new_status
    # If paid, also update legacy status to completed
    if new_status == "paid":
        from src.domain.models.order import OrderStatus as OrdSt
        order.status = OrdSt.completed

    db.commit()
    db.refresh(order)

    logger.info(f"Order {order_id} payment updated to '{new_status}' by buyer {uid}")
    return _build_order_response(order, db)