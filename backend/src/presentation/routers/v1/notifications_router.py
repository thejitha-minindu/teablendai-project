from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.application.dependencies import get_current_user, get_db
from src.application.schemas.notification import NotificationCreate, NotificationRead
from src.infrastructure.repositories.notification_repository import NotificationRepository

router = APIRouter(
    tags=["notifications"],
)


# ── User endpoints (profile page) ─────────────────────────────────────────────

@router.get(
    "/me",
    response_model=list[NotificationRead],
    summary="Get my notifications",
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns notifications addressed to the current user
    plus any broadcast notifications (user_id IS NULL).
    Ordered newest first.
    """
    repo = NotificationRepository(db)
    return repo.get_for_user(user_id=current_user.user_id)


@router.patch(
    "/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark a single notification as read",
)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = NotificationRepository(db)
    updated = repo.mark_read(
        notification_id=notification_id,
        user_id=current_user.user_id,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or does not belong to you.",
        )
    return {"detail": "Marked as read."}


@router.patch(
    "/mark-all-read",
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications as read",
)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = NotificationRepository(db)
    repo.mark_all_read(user_id=current_user.user_id)
    return {"detail": "All notifications marked as read."}


# ── Admin endpoint (sendnotification page) ────────────────────────────────────

@router.post(
    "/",
    response_model=NotificationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: send a notification to a user or broadcast",
)
def send_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Admin-only endpoint used by the sendnotification page.
    Set user_id to a specific UUID to target one user.
    Leave user_id as null to broadcast to all users.

    TODO: Add is_admin check once your admin guard dependency is ready.
    e.g. current_user = Depends(get_current_admin_user)
    """
    repo = NotificationRepository(db)
    return repo.create(data=data)