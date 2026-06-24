from __future__ import annotations

import uuid

from sqlalchemy.orm import Session
from sqlalchemy.orm import aliased

from src.application.schemas.violation import ViolationCreate, ViolationStatusEnum
from src.domain.models.violation_model import Violation
from src.domain.models.user import User
from sqlalchemy import text, cast, String
from sqlalchemy.exc import DataError
# from src.infrastructure.repositories.violation_repository import ViolationRepository


class ViolationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, sender_id: uuid.UUID, data: ViolationCreate) -> Violation:
        """Insert a new violation submitted by the current user."""
        violation = Violation(
            sender_id=sender_id,
            violator_id=data.violator_id,
            auction_id=data.auction_id,
            violation_type=data.violation_type,
            reason=data.reason,
        )
        self.db.add(violation)
        self.db.commit()
        self.db.refresh(violation)
        return violation

    def get_by_sender(self, sender_id: uuid.UUID) -> list[Violation]:
        """Return all violations submitted by a specific user, newest first."""
        return (
            self.db.query(Violation)
            .filter(Violation.sender_id == sender_id)
            .order_by(Violation.created_at.desc())
            .all()
        )

    def get_by_id(self, violation_id: uuid.UUID) -> Violation | None:
        """Fetch a single violation by its primary key."""
        return (
            self.db.query(Violation)
            .filter(Violation.violation_id == violation_id)
            .first()
        )

    def list_all(self) -> list[dict]:
        sender = aliased(User)
        violator = aliased(User)

        rows = (
            self.db.query(
                Violation,
                sender.user_name.label("sender_name"),
                sender.email.label("sender_email"),
                violator.user_name.label("violator_name"),
                violator.email.label("violator_email"),
                violator.first_name.label("violator_first_name"),
                violator.last_name.label("violator_last_name"),
            )
            .outerjoin(sender, sender.user_id == Violation.sender_id)
            .outerjoin(violator, cast(violator.user_id, String(255)) == Violation.violator_id)
            .order_by(Violation.created_at.desc())
            .all()
        )

        return [
            {
                "violation_id": violation.violation_id,
                "sender_id": violation.sender_id,
                "sender_name": sender_name,
                "sender_email": sender_email,
                "violator_id": violation.violator_id,
                "violator_name": violator_name,
                "violator_email": violator_email,
                "violator_first_name": violator_first_name,
                "violator_last_name": violator_last_name,
                "auction_id": violation.auction_id,
                "violation_type": violation.violation_type,
                "reason": violation.reason,
                "status": violation.status,
                "created_at": violation.created_at,
            }
            for violation, sender_name, sender_email, violator_name, violator_email, violator_first_name, violator_last_name in rows
        ]

    def update_status(
        self, violation_id: uuid.UUID, status: ViolationStatusEnum
    ) -> Violation | None:
        violation = self.get_by_id(violation_id)
        if not violation:
            return None

        violation.status = status
        self.db.commit()
        self.db.refresh(violation)
        return violation
