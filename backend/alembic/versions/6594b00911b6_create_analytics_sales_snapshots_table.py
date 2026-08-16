"""create analytics sales snapshots table

Revision ID: 6594b00911b6
Revises: f3d2b1a0c9d8
Create Date: 2026-04-24 09:52:09.681987
"""

from alembic import op

revision = "6594b00911b6"
down_revision = "f3d2b1a0c9d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        IF OBJECT_ID('analytics_sales_snapshots', 'U') IS NULL
        BEGIN
            CREATE TABLE analytics_sales_snapshots (
                snapshot_id BIGINT IDENTITY(1,1) PRIMARY KEY,
                snapshot_at DATETIME2(3) NOT NULL
                    CONSTRAINT DF_analytics_sales_snapshot_at DEFAULT SYSUTCDATETIME(),
                summary_json NVARCHAR(MAX) NOT NULL,
                auction_performance_json NVARCHAR(MAX) NOT NULL,
                grade_wise_prices_json NVARCHAR(MAX) NOT NULL,
                selling_trends_json NVARCHAR(MAX) NOT NULL,
                seller_performance_json NVARCHAR(MAX) NOT NULL,
                bid_volume_analysis_json NVARCHAR(MAX) NOT NULL,
                CONSTRAINT CK_analytics_sales_summary_json CHECK (ISJSON(summary_json) = 1),
                CONSTRAINT CK_analytics_sales_auction_perf_json CHECK (ISJSON(auction_performance_json) = 1),
                CONSTRAINT CK_analytics_sales_grade_prices_json CHECK (ISJSON(grade_wise_prices_json) = 1),
                CONSTRAINT CK_analytics_sales_trends_json CHECK (ISJSON(selling_trends_json) = 1),
                CONSTRAINT CK_analytics_sales_seller_perf_json CHECK (ISJSON(seller_performance_json) = 1),
                CONSTRAINT CK_analytics_sales_bid_volume_json CHECK (ISJSON(bid_volume_analysis_json) = 1)
            )
        END
        """
    )

    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_sales_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_sales_snapshots')
        )
        BEGIN
            CREATE INDEX IX_analytics_sales_snapshots_snapshot_at
            ON analytics_sales_snapshots(snapshot_at DESC)
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE name = 'IX_analytics_sales_snapshots_snapshot_at'
              AND object_id = OBJECT_ID('analytics_sales_snapshots')
        )
        BEGIN
            DROP INDEX IX_analytics_sales_snapshots_snapshot_at ON analytics_sales_snapshots
        END
        """
    )

    op.execute(
        """
        IF OBJECT_ID('analytics_sales_snapshots', 'U') IS NOT NULL
        BEGIN
            DROP TABLE analytics_sales_snapshots
        END
        """
    )