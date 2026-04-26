"""create analytics blends snapshots table

Revision ID: 7a1c3e4d5f60
Revises: 6594b00911b6
Create Date: 2026-04-24
"""

from alembic import op


revision = "7a1c3e4d5f60"
down_revision = "6594b00911b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        IF OBJECT_ID('analytics_blends_snapshots', 'U') IS NULL
        BEGIN
            CREATE TABLE analytics_blends_snapshots (
                snapshot_id BIGINT IDENTITY(1,1) PRIMARY KEY,
                snapshot_at DATETIME2(3) NOT NULL
                    CONSTRAINT DF_analytics_blends_snapshot_at DEFAULT SYSUTCDATETIME(),
                payload_json NVARCHAR(MAX) NOT NULL,
                CONSTRAINT CK_analytics_blends_payload_json CHECK (ISJSON(payload_json) = 1)
            )
        END
        """
    )

    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_blends_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_blends_snapshots')
        )
        BEGIN
            CREATE INDEX IX_analytics_blends_snapshots_snapshot_at
            ON analytics_blends_snapshots(snapshot_at DESC)
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_blends_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_blends_snapshots')
        )
        BEGIN
            DROP INDEX IX_analytics_blends_snapshots_snapshot_at ON analytics_blends_snapshots
        END
        """
    )

    op.execute(
        """
        IF OBJECT_ID('analytics_blends_snapshots', 'U') IS NOT NULL
        BEGIN
            DROP TABLE analytics_blends_snapshots
        END
        """
    )
