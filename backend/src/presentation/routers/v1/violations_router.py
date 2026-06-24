from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.application.dependencies import get_current_user, get_db, get_system_log_service
from src.infrastructure.services.system_log_service import SystemLogService
from src.application.schemas.violation import ViolationCreate, ViolationRead
from src.infrastructure.repositories.violation_repository import ViolationRepository

router = APIRouter(
    tags=["violations"],
)


@router.post(
    "/",
    response_model=ViolationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a violation report",
)
def submit_violation(
    data: ViolationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    log_service: SystemLogService = Depends(get_system_log_service),
):
    """
    Authenticated users submit a violation against another user or auction.
    sender_id is injected automatically from the auth token — never sent by the client.
    """
    repo = ViolationRepository(db)
    result = repo.create(sender_id=current_user.user_id, data=data)
    
    target_ref = f"User {data.violator_id}"
    if data.auction_id:
        target_ref += f" on Auction #{data.auction_id}"
        
    log_service.log_violation_flagged(
        user_name=current_user.user_name or current_user.email,
        target_ref=target_ref
    )
    return result


@router.get(
    "/me",
    response_model=list[ViolationRead],
    summary="Get my submitted violation reports",
)
def get_my_violations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return all violations the current user has submitted, newest first."""
    repo = ViolationRepository(db)
    return repo.get_by_sender(sender_id=current_user.user_id)


@router.get(
    "/{violation_id}",
    response_model=ViolationRead,
    summary="Get a single violation by ID",
)
def get_violation(
    violation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Fetch a specific violation. Users can only view their own reports.
    Admins should use the admin router instead.
    """
    repo = ViolationRepository(db)
    violation = repo.get_by_id(violation_id)

    if not violation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Violation not found.",
        )

    if violation.sender_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this report.",
        )

    return violation