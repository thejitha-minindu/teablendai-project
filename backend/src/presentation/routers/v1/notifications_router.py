from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.application.dependencies import get_current_user, get_db, get_current_admin, get_token_payload
from src.application.schemas.notification import NotificationCreate, NotificationRead
from src.domain.models.admin import Admin
from src.domain.models.user import User
from src.domain.models.notification_model import Notification
from src.infrastructure.repositories.notification_repository import NotificationRepository

router = APIRouter(
    tags=["notifications"],
)


def get_current_user_or_admin(
    token_payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db),
):
    email = token_payload.get("sub")
    role = token_payload.get("role")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if role == "admin":
        admin = db.query(Admin).filter(Admin.email == email).first()
        if admin:
            return admin

    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


# ── User endpoints (profile page) ─────────────────────────────────────────────

@router.get(
    "/me",
    response_model=list[NotificationRead],
    summary="Get my notifications",
)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_entity=Depends(get_current_user_or_admin),
):
    """
    Returns notifications addressed to the current user
    plus any broadcast notifications (user_id IS NULL).
    Ordered newest first.
    """
    if isinstance(current_entity, Admin):
        return (
            db.query(Notification)
            .filter(Notification.user_id.is_(None))
            .order_by(Notification.created_at.desc())
            .all()
        )

    repo = NotificationRepository(db)
    return repo.get_for_user(user_id=current_entity.user_id)


@router.patch(
    "/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark a single notification as read",
)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_entity=Depends(get_current_user_or_admin),
):
    if isinstance(current_entity, Admin):
        return {"detail": "Marked as read."}

    repo = NotificationRepository(db)
    updated = repo.mark_read(
        notification_id=notification_id,
        user_id=current_entity.user_id,
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
    current_entity=Depends(get_current_user_or_admin),
):
    if isinstance(current_entity, Admin):
        return {"detail": "All notifications marked as read."}

    repo = NotificationRepository(db)
    repo.mark_all_read(user_id=current_entity.user_id)
    return {"detail": "All notifications marked as read."}


# ── Admin endpoint (sendnotification page) ────────────────────────────────────

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Admin: send a notification to a user or broadcast",
)
def send_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Admin-only endpoint used by the sendnotification page.
    Set user_id to a specific UUID to target one user.
    Leave user_id as null to broadcast to all users.
    """
    repo = NotificationRepository(db)
    result = repo.create(data=data)
    return {"detail": "Notification sent successfully"}


@router.get(
    "/history",
    summary="Admin: view notification history",
)
def get_notification_history(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = NotificationRepository(db)
    return repo.get_history()