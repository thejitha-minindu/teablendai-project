"""add custom auction id column

Revision ID: add_custom_auction_id_column
Revises:
Create Date: 2026-03-14
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "add_custom_auction_id_column"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        IF COL_LENGTH('auctions', 'custom_auction_id') IS NULL
        BEGIN
            ALTER TABLE auctions
            ADD custom_auction_id VARCHAR(256) NULL
        END
        """
    )

    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'IX_auctions_custom_auction_id'
              AND object_id = OBJECT_ID('auctions')
        )
        BEGIN
            CREATE UNIQUE NONCLUSTERED INDEX IX_auctions_custom_auction_id
            ON auctions(custom_auction_id)
            WHERE custom_auction_id IS NOT NULL
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'IX_auctions_custom_auction_id'
              AND object_id = OBJECT_ID('auctions')
        )
        BEGIN
            DROP INDEX IX_auctions_custom_auction_id ON auctions
        END
        """
    )

    op.execute(
        """
        IF COL_LENGTH('auctions', 'custom_auction_id') IS NOT NULL
        BEGIN
            ALTER TABLE auctions
            DROP COLUMN custom_auction_id
        END
        """
    )
