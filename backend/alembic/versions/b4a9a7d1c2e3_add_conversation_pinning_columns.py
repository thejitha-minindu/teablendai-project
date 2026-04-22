"""add conversation pinning columns

Revision ID: b4a9a7d1c2e3
Revises: d7f4c3a9b2e1
Create Date: 2026-03-27
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "b4a9a7d1c2e3"
down_revision = "d7f4c3a9b2e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        IF COL_LENGTH('Conversations', 'IsPinned') IS NULL
        BEGIN
            ALTER TABLE Conversations
            ADD IsPinned BIT NOT NULL
                CONSTRAINT DF_Conversations_IsPinned DEFAULT 0
        END
        """
    )

    op.execute(
        """
        IF COL_LENGTH('Conversations', 'PinnedAt') IS NULL
        BEGIN
            ALTER TABLE Conversations
            ADD PinnedAt DATETIME NULL
        END
        """
    )


def downgrade() -> None:
    op.execute(
        """
        IF COL_LENGTH('Conversations', 'PinnedAt') IS NOT NULL
        BEGIN
            ALTER TABLE Conversations
            DROP COLUMN PinnedAt
        END
        """
    )

    op.execute(
        """
        IF EXISTS (
            SELECT 1
            FROM sys.default_constraints dc
            INNER JOIN sys.columns c
                ON c.default_object_id = dc.object_id
            WHERE dc.parent_object_id = OBJECT_ID('Conversations')
              AND c.name = 'IsPinned'
        )
        BEGIN
            DECLARE @ConstraintName NVARCHAR(200)
            SELECT @ConstraintName = dc.name
            FROM sys.default_constraints dc
            INNER JOIN sys.columns c
                ON c.default_object_id = dc.object_id
            WHERE dc.parent_object_id = OBJECT_ID('Conversations')
              AND c.name = 'IsPinned'

            EXEC('ALTER TABLE Conversations DROP CONSTRAINT ' + @ConstraintName)
        END
        """
    )

    op.execute(
        """
        IF COL_LENGTH('Conversations', 'IsPinned') IS NOT NULL
        BEGIN
            ALTER TABLE Conversations
            DROP COLUMN IsPinned
        END
        """
    )
