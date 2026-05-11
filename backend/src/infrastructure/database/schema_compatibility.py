from dataclasses import dataclass

from sqlalchemy import text

from src.infrastructure.database.base import SessionLocal


@dataclass(frozen=True)
class RuntimeSchemaCompatibility:
    custom_auction_id_available: bool
    analytics_snapshots_available: bool
    notifications_available: bool
    hashed_password_available: bool


SNAPSHOT_TABLES = (
    "analytics_overview_snapshots",
    "analytics_purchases_snapshots",
    "analytics_sales_snapshots",
    "analytics_blends_snapshots",
    "analytics_buyers_snapshots",
)


def ensure_runtime_schema_compatibility() -> RuntimeSchemaCompatibility:
    db = SessionLocal()
    try:
        db.execute(
            text(
                """
                IF COL_LENGTH('users', 'hashed_password') IS NULL
                BEGIN
                    ALTER TABLE users
                    ADD hashed_password VARCHAR(256) NULL
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF COL_LENGTH('users', 'shipping_address') IS NULL
                BEGIN
                    ALTER TABLE users
                    ADD shipping_address VARCHAR(256) NULL
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF COL_LENGTH('users', 'payment_method') IS NULL
                BEGIN
                    ALTER TABLE users
                    ADD payment_method VARCHAR(128) NULL
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF COL_LENGTH('auctions', 'custom_auction_id') IS NULL
                BEGIN
                    ALTER TABLE auctions
                    ADD custom_auction_id VARCHAR(256) NULL
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'ix_auctions_custom_auction_id'
                      AND object_id = OBJECT_ID('dbo.auctions')
                )
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX ix_auctions_custom_auction_id
                    ON dbo.auctions(custom_auction_id)
                    WHERE custom_auction_id IS NOT NULL
                END
                """
            )
        )

        db.execute(
            text(
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
        )

        db.execute(
            text(
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
        )

        db.execute(
            text(
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
        )

        db.commit()

        analytics_snapshots_available = all(
            db.execute(
                text("SELECT CASE WHEN OBJECT_ID(:table_name, 'U') IS NOT NULL THEN 1 ELSE 0 END"),
                {"table_name": table_name},
            ).scalar()
            for table_name in SNAPSHOT_TABLES
        )

        notifications_available = bool(
            db.execute(
                text("SELECT CASE WHEN OBJECT_ID('notifications', 'U') IS NOT NULL THEN 1 ELSE 0 END")
            ).scalar()
        )

        return RuntimeSchemaCompatibility(
            custom_auction_id_available=True,
            analytics_snapshots_available=analytics_snapshots_available,
            notifications_available=notifications_available,
            hashed_password_available=True,
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
