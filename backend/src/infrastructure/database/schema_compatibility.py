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

        db.execute(
            text(
                """
                IF OBJECT_ID('system_logs', 'U') IS NULL
                BEGIN
                    CREATE TABLE system_logs (
                        log_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
                        display_id VARCHAR(16) NOT NULL UNIQUE,
                        user_name VARCHAR(128) NOT NULL,
                        user_id UNIQUEIDENTIFIER NULL,
                        activity_type VARCHAR(64) NOT NULL,
                        status VARCHAR(16) NOT NULL CONSTRAINT DF_system_logs_status DEFAULT 'success',
                        ip_address VARCHAR(45) NULL,
                        details VARCHAR(512) NOT NULL,
                        created_at DATETIME NOT NULL CONSTRAINT DF_system_logs_created_at DEFAULT GETUTCDATE(),
                        CONSTRAINT FK_system_logs_users FOREIGN KEY (user_id) REFERENCES users(user_id)
                    )
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF OBJECT_ID('system_logs', 'U') IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1
                        FROM sys.indexes
                        WHERE name = 'IX_system_logs_created_at'
                          AND object_id = OBJECT_ID('system_logs')
                   )
                BEGIN
                    CREATE INDEX IX_system_logs_created_at ON system_logs(created_at DESC)
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF OBJECT_ID('system_logs', 'U') IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1
                        FROM sys.indexes
                        WHERE name = 'IX_system_logs_activity_type'
                          AND object_id = OBJECT_ID('system_logs')
                   )
                BEGIN
                    CREATE INDEX IX_system_logs_activity_type ON system_logs(activity_type)
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF OBJECT_ID('system_logs', 'U') IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1
                        FROM sys.indexes
                        WHERE name = 'IX_system_logs_status'
                          AND object_id = OBJECT_ID('system_logs')
                   )
                BEGIN
                    CREATE INDEX IX_system_logs_status ON system_logs(status)
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF OBJECT_ID('system_logs', 'U') IS NOT NULL
                   AND NOT EXISTS (
                        SELECT 1
                        FROM sys.indexes
                        WHERE name = 'IX_system_logs_user_id'
                          AND object_id = OBJECT_ID('system_logs')
                   )
                BEGIN
                    CREATE INDEX IX_system_logs_user_id ON system_logs(user_id)
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF COL_LENGTH('violations', 'auction_id') IS NULL
                BEGIN
                    ALTER TABLE violations
                    ADD auction_id VARCHAR(255) NULL
                END
                """
            )
        )

        # Fix violations.sender_id column type: int -> UNIQUEIDENTIFIER
        db.execute(
            text(
                """
                IF OBJECT_ID('violations', 'U') IS NOT NULL
                BEGIN
                    DECLARE @sender_type VARCHAR(128)
                    SELECT @sender_type = DATA_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'violations' AND COLUMN_NAME = 'sender_id'

                    IF @sender_type IS NOT NULL AND @sender_type <> 'uniqueidentifier'
                    BEGIN
                        -- Drop existing FK constraints on sender_id if any
                        DECLARE @fk_name NVARCHAR(256)
                        SELECT TOP 1 @fk_name = fk.name
                        FROM sys.foreign_keys fk
                        JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                        JOIN sys.columns c ON fkc.parent_column_id = c.column_id
                            AND fkc.parent_object_id = c.object_id
                        WHERE fk.parent_object_id = OBJECT_ID('violations')
                            AND c.name = 'sender_id'

                        IF @fk_name IS NOT NULL
                        BEGIN
                            DECLARE @drop_sql NVARCHAR(512) = 'ALTER TABLE violations DROP CONSTRAINT ' + QUOTENAME(@fk_name)
                            EXEC sp_executesql @drop_sql
                        END

                        -- Delete any existing rows (they have int sender_ids, incompatible)
                        DELETE FROM violations

                        -- Alter column type
                        ALTER TABLE violations ALTER COLUMN sender_id UNIQUEIDENTIFIER NOT NULL

                        -- Re-add FK constraint
                        ALTER TABLE violations
                        ADD CONSTRAINT FK_violations_sender_users
                        FOREIGN KEY (sender_id) REFERENCES users(user_id)
                    END
                END
                """
            )
        )
        # Add Stripe columns to payment_details if missing
        db.execute(
            text(
                """
                IF OBJECT_ID('payment_details', 'U') IS NOT NULL
                   AND COL_LENGTH('payment_details', 'stripe_session_id') IS NULL
                BEGIN
                    ALTER TABLE payment_details
                    ADD stripe_session_id VARCHAR(255) NULL
                END
                """
            )
        )

        db.execute(
            text(
                """
                IF OBJECT_ID('payment_details', 'U') IS NOT NULL
                   AND COL_LENGTH('payment_details', 'stripe_payment_intent_id') IS NULL
                BEGIN
                    ALTER TABLE payment_details
                    ADD stripe_payment_intent_id VARCHAR(255) NULL
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
