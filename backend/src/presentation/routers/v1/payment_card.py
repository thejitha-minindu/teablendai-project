from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.application.dependencies import get_current_user
from src.application.schemas.payment_card import PaymentCardCreate, PaymentCardResponse
from src.application.use_cases.payment_card_service import PaymentCardService
from src.database import get_db
from src.domain.models.user import User

router = APIRouter()


@router.get("/profile/payment-cards", response_model=list[PaymentCardResponse])
def list_payment_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentCardService(db)
    return service.list_cards(current_user)


@router.post("/profile/payment-cards", response_model=PaymentCardResponse, status_code=201)
def add_payment_card(
    payload: PaymentCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentCardService(db)
    return service.add_card(payload, current_user)


@router.delete("/profile/payment-cards/{card_id}")
def delete_payment_card(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentCardService(db)
    return service.delete_card(card_id, current_user)


@router.put("/profile/payment-cards/{card_id}/default", response_model=PaymentCardResponse)
def set_default_payment_card(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PaymentCardService(db)
    return service.set_default_card(card_id, current_user)
