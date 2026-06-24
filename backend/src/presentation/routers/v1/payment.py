from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_user
from src.domain.models.user import User
from src.domain.models.order import Order, PaymentDetails, PaymentMethod, PaymentStatus
from src.domain.models.order import OrderStatus as OrdSt
from src.application.services.stripe_service import StripeService
from src.config import get_settings
import logging
import datetime

router = APIRouter(prefix="/payment", tags=["payment"])
logger = logging.getLogger(__name__)
stripe_service = StripeService()
settings = get_settings()


class CheckoutSessionRequest(BaseModel):
    order_id: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    body: CheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order_id = body.order_id
    order = db.query(Order).filter(Order.order_id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    uid = str(current_user.user_id).lower()
    is_buyer = str(order.user_id).lower() == uid

    if not is_buyer:
        raise HTTPException(status_code=403, detail="Only the buyer can initiate payment")

    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Order is already paid")

    # Use FRONTEND_URL from .env (configured in Settings)
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    success_url = f"{frontend_url}/payment/success?orderId={order_id}"
    cancel_url = f"{frontend_url}/payment/{order_id}?canceled=true"

    product_name = (
        order.auction.auction_name
        if order.auction
        else f"Order {order.display_order_id or order_id}"
    )

    # Calculate total: subtotal + 10% tax + 2% platform fee
    subtotal = order.total_amount
    tax = subtotal * 0.1
    platform_fee = subtotal * 0.02
    total_charge = subtotal + tax + platform_fee

    try:
        session = stripe_service.create_checkout_session(
            order_id=order_id,
            amount=total_charge,
            currency="lkr",
            product_name=product_name,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        # Upsert PaymentDetails
        payment_details = (
            db.query(PaymentDetails)
            .filter(PaymentDetails.order_id == order.order_id)
            .first()
        )
        if not payment_details:
            payment_details = PaymentDetails(
                payment_method=PaymentMethod.credit_card,
                payment_date=datetime.datetime.utcnow(),
                order_id=order.order_id,
                amount=total_charge,
                status=PaymentStatus.pending,
                stripe_session_id=session.id,
            )
            db.add(payment_details)
        else:
            payment_details.amount = total_charge
            payment_details.status = PaymentStatus.pending
            payment_details.stripe_session_id = session.id
            payment_details.payment_date = datetime.datetime.utcnow()

        db.commit()

        return CheckoutSessionResponse(checkout_url=session.url)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create checkout session: {e}")
        raise HTTPException(status_code=500, detail="Payment service error")


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe_service.construct_webhook_event(payload, sig_header)
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(
            status_code=400, detail="Webhook signature verification failed"
        )

    # Handle the checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        order_id = session.get("metadata", {}).get("order_id")
        payment_intent = session.get("payment_intent")

        if order_id:
            order = db.query(Order).filter(Order.order_id == order_id).first()
            if order:
                # Idempotency: skip if already paid
                if order.payment_status == "paid":
                    logger.info(
                        f"Order {order_id} already paid, skipping duplicate webhook"
                    )
                    return {"status": "success"}

                order.payment_status = "paid"
                order.status = OrdSt.completed

                payment_details = (
                    db.query(PaymentDetails)
                    .filter(PaymentDetails.order_id == order.order_id)
                    .first()
                )
                if payment_details:
                    payment_details.status = PaymentStatus.successful
                    payment_details.stripe_payment_intent_id = payment_intent
                    payment_details.payment_date = datetime.datetime.utcnow()

                db.commit()
                logger.info(f"Payment successful for order {order_id}")
            else:
                logger.error(f"Webhook received for unknown order_id: {order_id}")

    return {"status": "success"}
