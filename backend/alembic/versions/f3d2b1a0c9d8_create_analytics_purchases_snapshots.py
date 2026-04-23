"""create analytics purchases snapshots table

Revision ID: f3d2b1a0c9d8
Revises: c2a4d7f0e9b1
Create Date: 2026-04-23
"""

from alembic import op


revision = "f3d2b1a0c9d8"
down_revision = "c2a4d7f0e9b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        IF OBJECT_ID('analytics_purchases_snapshots', 'U') IS NULL
        BEGIN
            CREATE TABLE analytics_purchases_snapshots (
                snapshot_id BIGINT IDENTITY(1,1) PRIMARY KEY,
                snapshot_at DATETIME2(3) NOT NULL
                    CONSTRAINT DF_analytics_purchases_snapshot_at DEFAULT SYSUTCDATETIME(),
                summary_json NVARCHAR(MAX) NOT NULL,
                purchase_volume_by_grade_json NVARCHAR(MAX) NOT NULL,
                price_trends_json NVARCHAR(MAX) NOT NULL,
                price_trend_grades_json NVARCHAR(MAX) NOT NULL,
                source_distribution_json NVARCHAR(MAX) NOT NULL,
                supplier_contribution_json NVARCHAR(MAX) NOT NULL,
                CONSTRAINT CK_analytics_purchases_summary_json CHECK (ISJSON(summary_json) = 1),
                CONSTRAINT CK_analytics_purchases_grade_volume_json CHECK (ISJSON(purchase_volume_by_grade_json) = 1),
                CONSTRAINT CK_analytics_purchases_price_trends_json CHECK (ISJSON(price_trends_json) = 1),
                CONSTRAINT CK_analytics_purchases_price_grades_json CHECK (ISJSON(price_trend_grades_json) = 1),
                CONSTRAINT CK_analytics_purchases_source_dist_json CHECK (ISJSON(source_distribution_json) = 1),
                CONSTRAINT CK_analytics_purchases_supplier_json CHECK (ISJSON(supplier_contribution_json) = 1)
            )
        END
        """
    )

    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_purchases_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_purchases_snapshots')
        )
        BEGIN
            CREATE INDEX IX_analytics_purchases_snapshots_snapshot_at
            ON analytics_purchases_snapshots(snapshot_at DESC)
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_purchases_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_purchases_snapshots')
        )
        BEGIN
            DROP INDEX IX_analytics_purchases_snapshots_snapshot_at ON analytics_purchases_snapshots
        END
        """
    )

    op.execute(
        """
        IF OBJECT_ID('analytics_purchases_snapshots', 'U') IS NOT NULL
        BEGIN
            DROP TABLE analytics_purchases_snapshots
        END
        """
    )
