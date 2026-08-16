from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.application.schemas.payment_card import PaymentCardCreate, PaymentCardResponse
from src.domain.models.user import User, PaymentCard


class PaymentCardService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _detect_card_type(card_number: str) -> str:
        """Detect card network from the leading digits."""
        stripped = card_number.replace(" ", "")
        if stripped.startswith("4"):
            return "Visa"
        if stripped.startswith("5"):
            return "Mastercard"
        if stripped.startswith("3"):
            return "Amex"
        return "Card"

    def list_cards(self, current_user: User) -> list[PaymentCardResponse]:
        cards = (
            self.db.query(PaymentCard)
            .filter(PaymentCard.user_id == current_user.user_id)
            .order_by(PaymentCard.created_at)
            .all()
        )
        return [
            PaymentCardResponse(
                card_id=str(c.card_id),
                card_type=c.card_type,
                last4=c.last4,
                expiry=c.expiry,
                cardholder_name=c.cardholder_name,
                is_default=c.is_default,
            )
            for c in cards
        ]

    def add_card(self, payload: PaymentCardCreate, current_user: User) -> PaymentCardResponse:
        stripped = payload.card_number.replace(" ", "")

        # Basic validation
        if len(stripped) < 13 or not stripped.isdigit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid card number",
            )

        import re
        if not re.match(r"^\d{2}/\d{2}$", payload.expiry):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expiry must be in MM/YY format",
            )

        if len(payload.cvv) < 3 or not payload.cvv.isdigit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid CVV",
            )

        card_type = self._detect_card_type(stripped)
        last4 = stripped[-4:]

        # Check for duplicate (same last4 + expiry + type for this user)
        existing = (
            self.db.query(PaymentCard)
            .filter(
                PaymentCard.user_id == current_user.user_id,
                PaymentCard.last4 == last4,
                PaymentCard.expiry == payload.expiry,
                PaymentCard.card_type == card_type,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This card is already saved",
            )

        # If this is the user's first card, make it default
        has_cards = (
            self.db.query(PaymentCard)
            .filter(PaymentCard.user_id == current_user.user_id)
            .first()
        )
        is_default = has_cards is None

        card = PaymentCard(
            user_id=current_user.user_id,
            card_type=card_type,
            last4=last4,
            expiry=payload.expiry,
            cardholder_name=payload.cardholder_name,
            is_default=is_default,
        )
        self.db.add(card)
        self.db.commit()
        self.db.refresh(card)

        return PaymentCardResponse(
            card_id=str(card.card_id),
            card_type=card.card_type,
            last4=card.last4,
            expiry=card.expiry,
            cardholder_name=card.cardholder_name,
            is_default=card.is_default,
        )

    def delete_card(self, card_id: str, current_user: User) -> dict:
        card = (
            self.db.query(PaymentCard)
            .filter(
                PaymentCard.card_id == card_id,
                PaymentCard.user_id == current_user.user_id,
            )
            .first()
        )
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card not found",
            )

        was_default = card.is_default
        self.db.delete(card)
        self.db.commit()

        # If we deleted the default card, promote the first remaining card
        if was_default:
            first_card = (
                self.db.query(PaymentCard)
                .filter(PaymentCard.user_id == current_user.user_id)
                .order_by(PaymentCard.created_at)
                .first()
            )
            if first_card:
                first_card.is_default = True
                self.db.commit()

        return {"message": "Card deleted successfully"}

    def set_default_card(self, card_id: str, current_user: User) -> PaymentCardResponse:
        card = (
            self.db.query(PaymentCard)
            .filter(
                PaymentCard.card_id == card_id,
                PaymentCard.user_id == current_user.user_id,
            )
            .first()
        )
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card not found",
            )

        # Unset all defaults for this user
        self.db.query(PaymentCard).filter(
            PaymentCard.user_id == current_user.user_id
        ).update({PaymentCard.is_default: False})

        card.is_default = True
        self.db.commit()
        self.db.refresh(card)

        return PaymentCardResponse(
            card_id=str(card.card_id),
            card_type=card.card_type,
            last4=card.last4,
            expiry=card.expiry,
            cardholder_name=card.cardholder_name,
            is_default=card.is_default,
        )
