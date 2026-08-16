# pyrefly: ignore [missing-import]
import stripe
import logging
from src.config import get_settings

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        self.settings = get_settings()
        stripe.api_key = self.settings.STRIPE_SECRET_KEY

    def create_checkout_session(
        self,
        order_id: str,
        amount: float,
        currency: str,
        product_name: str,
        success_url: str,
        cancel_url: str,
    ):
        """Create a Stripe Checkout Session."""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": currency,
                            "unit_amount": int(amount * 100),
                            "product_data": {
                                "name": product_name,
                            },
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "order_id": order_id,
                },
            )
            return session
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {e}")
            raise

    def construct_webhook_event(self, payload: bytes, sig_header: str):
        """Construct and verify Stripe webhook event."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError as e:
            # Invalid payload
            logger.error(f"Invalid payload for Stripe webhook: {e}")
            raise
        except stripe.SignatureVerificationError as e:
            # Invalid signature
            logger.error(f"Invalid signature for Stripe webhook: {e}")
            raise

    def verify_checkout_session(self, session_id: str):
        """Retrieve a Stripe Checkout Session to check its payment status."""
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            return session
        except Exception as e:
            logger.error(f"Error retrieving Stripe checkout session {session_id}: {e}")
            raise

