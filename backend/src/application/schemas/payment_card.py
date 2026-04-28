from typing import Optional
from pydantic import BaseModel, ConfigDict


class PaymentCardCreate(BaseModel):
    """Accept full card number from the client.
    The backend extracts last4 and card_type — the raw number is never stored."""
    card_number: str
    expiry: str
    cvv: str
    cardholder_name: str


class PaymentCardResponse(BaseModel):
    """Only masked info is ever returned to the client."""
    model_config = ConfigDict(from_attributes=True)

    card_id: str
    card_type: str
    last4: str
    expiry: str
    cardholder_name: str
    is_default: bool
