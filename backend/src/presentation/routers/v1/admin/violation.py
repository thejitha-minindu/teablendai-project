import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.application.dependencies import get_db
from src.application.schemas.violation import (
    AdminViolationRead,
    AdminViolationStatusUpdate,
    ViolationRead,
)
from src.infrastructure.repositories.violation_repository import ViolationRepository

router = APIRouter()


@router.get("/violations", response_model=list[AdminViolationRead])
def fetch_violations(db: Session = Depends(get_db)):
    repo = ViolationRepository(db)
    return repo.list_all()


@router.get("/violations/{violation_id}", response_model=AdminViolationRead)
def get_violation(violation_id: uuid.UUID, db: Session = Depends(get_db)):
    repo = ViolationRepository(db)

    for item in repo.list_all():
        if item["violation_id"] == violation_id:
            return item

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Violation not found.",
    )


@router.patch("/violations/{violation_id}", response_model=ViolationRead)
def update_violation_status(
    violation_id: uuid.UUID,
    payload: AdminViolationStatusUpdate,
    db: Session = Depends(get_db),
):
    repo = ViolationRepository(db)
    violation = repo.update_status(violation_id, payload.status)

    if not violation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Violation not found.",
        )

    return violation
