"""create analytics overview snapshots table

Revision ID: c2a4d7f0e9b1
Revises: b4a9a7d1c2e3
Create Date: 2026-04-23
"""

from alembic import op

revision = "c2a4d7f0e9b1"
down_revision = "b4a9a7d1c2e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        IF OBJECT_ID('analytics_overview_snapshots', 'U') IS NULL
        BEGIN
            CREATE TABLE analytics_overview_snapshots (
                snapshot_id BIGINT IDENTITY(1,1) PRIMARY KEY,
                snapshot_at DATETIME2(3) NOT NULL
                    CONSTRAINT DF_analytics_overview_snapshot_at DEFAULT SYSUTCDATETIME(),
                kpis_json NVARCHAR(MAX) NOT NULL,
                revenue_by_month_json NVARCHAR(MAX) NOT NULL,
                tea_grade_distribution_json NVARCHAR(MAX) NOT NULL,
                top_blends_json NVARCHAR(MAX) NOT NULL,
                quick_stats_json NVARCHAR(MAX) NOT NULL,
                CONSTRAINT CK_analytics_overview_kpis_json CHECK (ISJSON(kpis_json) = 1),
                CONSTRAINT CK_analytics_overview_revenue_json CHECK (ISJSON(revenue_by_month_json) = 1),
                CONSTRAINT CK_analytics_overview_grade_json CHECK (ISJSON(tea_grade_distribution_json) = 1),
                CONSTRAINT CK_analytics_overview_blends_json CHECK (ISJSON(top_blends_json) = 1),
                CONSTRAINT CK_analytics_overview_quick_json CHECK (ISJSON(quick_stats_json) = 1)
            )
        END
        """
    )

    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_overview_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_overview_snapshots')
        )
        BEGIN
            CREATE INDEX IX_analytics_overview_snapshots_snapshot_at
            ON analytics_overview_snapshots(snapshot_at DESC)
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_overview_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_overview_snapshots')
        )
        BEGIN
            DROP INDEX IX_analytics_overview_snapshots_snapshot_at ON analytics_overview_snapshots
        END
        """
    )

    op.execute(
        """
        IF OBJECT_ID('analytics_overview_snapshots', 'U') IS NOT NULL
        BEGIN
            DROP TABLE analytics_overview_snapshots
        END
        """
    )
