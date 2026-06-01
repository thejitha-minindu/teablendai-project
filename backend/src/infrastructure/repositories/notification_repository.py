from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from src.application.schemas.notification import NotificationCreate
from src.domain.models.notification_model import Notification


from src.domain.models.user import User

class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, data: NotificationCreate) -> Notification | list[Notification]:
        if data.target_role and data.target_role.lower() in ["buyer", "seller"] and not data.user_id:
            # Bulk insert for role
            query = self.db.query(User.user_id)
            if data.target_role.lower() == "seller":
                query = query.filter(
                    (User.seller_verification_status == 'APPROVED') | (User.default_role == 'seller')
                )
            elif data.target_role.lower() == "buyer":
                query = query.filter(User.status == 'APPROVED')
            
            user_ids = [row[0] for row in query.all()]
            
            if not user_ids:
                return []
                
            notifications = [
                Notification(
                    user_id=uid,
                    title=data.title,
                    message=data.message,
                    type=data.type,
                ) for uid in user_ids
            ]
            self.db.add_all(notifications)
            self.db.commit()
            return notifications[0] if notifications else None
        
        # Default behavior: single user or global broadcast (user_id=None)
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

    def get_history(self) -> list[dict]:
        # Fetch notifications ordered by latest. 
        # Grouping or just returning raw since bulk insert creates many duplicates.
        # To avoid showing 100 duplicate notifications in history, we should group by title/message/created_at
        from sqlalchemy import func
        results = (
            self.db.query(
                Notification.title,
                Notification.message,
                Notification.type,
                func.max(Notification.created_at).label("created_at"),
                func.count(Notification.notification_id).label("recipient_count")
            )
            .group_by(Notification.title, Notification.message, Notification.type)
            .order_by(func.max(Notification.created_at).desc())
            .all()
        )
        
        history = []
        for r in results:
            history.append({
                "title": r[0],
                "message": r[1],
                "type": r[2],
                "created_at": r[3],
                "recipient_count": r[4]
            })
        return history

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