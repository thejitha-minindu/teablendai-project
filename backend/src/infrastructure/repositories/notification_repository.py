from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.application.schemas.notification import NotificationCreate
from src.domain.models.notification_model import Notification


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: NotificationCreate) -> Notification:
        notification = Notification(
            user_id=data.user_id,
            title=data.title,
            message=data.message,
            type=data.type,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_for_user(self, user_id: uuid.UUID) -> list[Notification]:
        return (
            self.db.query(Notification)
            .filter(
                (Notification.user_id == user_id) |
                (Notification.user_id.is_(None))
            )
            .order_by(Notification.created_at.desc())
            .all()
        )

    def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        notification = (
            self.db.query(Notification)
            .filter(
                Notification.notification_id == notification_id,
                (Notification.user_id == user_id) |
                (Notification.user_id.is_(None)),
            )
            .first()
        )
        if not notification:
            return False
        notification.is_read = True
        self.db.commit()
        return True

    def mark_all_read(self, user_id: uuid.UUID) -> None:
        self.db.query(Notification).filter(
            (Notification.user_id == user_id) |
            (Notification.user_id.is_(None))
        ).update({"is_read": True}, synchronize_session=False)
        self.db.commit()