from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_seller
from src.domain.models.user import User
from src.domain.models.order import Order
from src.domain.models.auction import Auction
import logging

router = APIRouter(prefix="/orders", tags=["seller-orders"])
logger = logging.getLogger(__name__)


def _build_seller_order(order: Order, db: Session) -> dict:
    """Build an order response dict with buyer + auction details for seller view."""
    auction = order.auction
    buyer = db.query(User).filter(User.user_id == order.user_id).first()

    buyer_name = ""
    if buyer:
        buyer_name = " ".join(filter(None, [buyer.first_name, buyer.last_name]))

    return {
        "order_id": str(order.order_id).lower(),
        "display_order_id": order.display_order_id,
        "buyer_id": str(order.user_id).lower(),
        "buyer_name": buyer_name,
        "buyer_email": buyer.email if buyer else None,
        "seller_id": str(order.seller_id).lower() if order.seller_id else None,
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


# --- List all orders for the authenticated seller ---
@router.get("")
def list_seller_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_seller),
):
    seller_id = str(current_user.user_id)
    query = db.query(Order).filter(Order.seller_id == seller_id)

    if status:
        query = query.filter(Order.order_status == status.lower())

    orders = query.order_by(Order.order_date.desc()).all()

    # Also find orders linked via auctions where seller_id matches (fallback)
    if not orders:
        auction_ids = [
            a.auction_id for a in
            db.query(Auction).filter(Auction.seller_id == seller_id).all()
        ]
        if auction_ids:
            query = db.query(Order).filter(Order.auction_id.in_(auction_ids))
            if status:
                query = query.filter(Order.order_status == status.lower())
            orders = query.order_by(Order.order_date.desc()).all()

    return [_build_seller_order(o, db) for o in orders]


# --- Get a single order detail ---
@router.get("/{order_id}")
def get_seller_order_detail(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_seller),
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    seller_id = str(current_user.user_id)
    is_seller = str(order.seller_id) == seller_id if order.seller_id else False
    if not is_seller and order.auction:
        is_seller = str(order.auction.seller_id) == seller_id

    if not is_seller:
        raise HTTPException(status_code=403, detail="Access denied")

    return _build_seller_order(order, db)


# --- Search orders by display_order_id ---
@router.get("/search/by-display-id")
def search_orders_by_display_id(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_seller),
):
    seller_id = str(current_user.user_id)
    query = db.query(Order).filter(
        Order.seller_id == seller_id,
        Order.display_order_id.ilike(f"%{q}%")
    )
    orders = query.order_by(Order.order_date.desc()).all()
    return [_build_seller_order(o, db) for o in orders]
