"""add user auth columns and notifications table

Revision ID: 9f2c6b8e1a4d
Revises: 4d1a6d6c7f2b
Create Date: 2026-04-28 18:05:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "9f2c6b8e1a4d"
down_revision: Union[str, Sequence[str], None] = "4d1a6d6c7f2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        IF COL_LENGTH('users', 'hashed_password') IS NULL
            ALTER TABLE users ADD hashed_password VARCHAR(256) NULL
        """
    )

    op.execute(
        """
        IF COL_LENGTH('users', 'shipping_address') IS NULL
            ALTER TABLE users ADD shipping_address VARCHAR(256) NULL
        """
    )

    op.execute(
        """
        IF COL_LENGTH('users', 'payment_method') IS NULL
            ALTER TABLE users ADD payment_method VARCHAR(128) NULL
        """
    )

    op.execute(
        """
        IF OBJECT_ID('notifications', 'U') IS NULL
        BEGIN
            CREATE TABLE notifications (
                notification_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                user_id UNIQUEIDENTIFIER NULL,
                title VARCHAR(255) NOT NULL,
                message VARCHAR(MAX) NOT NULL,
                type VARCHAR(20) NOT NULL CONSTRAINT DF_notifications_type DEFAULT 'system',
                is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
                created_at DATETIMEOFFSET NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT SYSDATETIMEOFFSET()
            )
        END
        """
    )

    op.execute(
        """
        IF OBJECT_ID('notifications', 'U') IS NOT NULL
           AND COL_LENGTH('users', 'user_id') IS NOT NULL
           AND NOT EXISTS (
                SELECT 1
                FROM sys.foreign_keys
                WHERE name = 'FK_notifications_users'
                  AND parent_object_id = OBJECT_ID('notifications')
           )
        BEGIN
            ALTER TABLE notifications
            ADD CONSTRAINT FK_notifications_users
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        END
        """
    )

    op.execute(
        """
        IF OBJECT_ID('notifications', 'U') IS NOT NULL
           AND NOT EXISTS (
                SELECT 1
                FROM sys.indexes
                WHERE name = 'IX_notifications_user_id'
                  AND object_id = OBJECT_ID('notifications')
           )
        BEGIN
            CREATE INDEX IX_notifications_user_id ON notifications(user_id)
        END
        """
    )


def downgrade() -> None:
    pass
