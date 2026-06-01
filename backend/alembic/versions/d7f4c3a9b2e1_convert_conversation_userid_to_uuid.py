"""convert conversation userid to uuid

Revision ID: d7f4c3a9b2e1
Revises: 1e25b4c0b33f
Create Date: 2026-03-24
"""

from typing import Sequence, Union
from alembic import op
from sqlalchemy import text


revision: str = "d7f4c3a9b2e1"
down_revision: Union[str, Sequence[str], None] = "1e25b4c0b33f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    has_conversations = bind.execute(
        text("SELECT CASE WHEN OBJECT_ID('Conversations', 'U') IS NOT NULL THEN 1 ELSE 0 END")
    ).scalar()

    if not has_conversations:
        return

    user_id_type = bind.execute(
        text(
            """
            SELECT DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Conversations' AND COLUMN_NAME = 'UserID'
            """
        )
    ).scalar()

    if not user_id_type:
        return

    if str(user_id_type).lower() == "uniqueidentifier":
        return

    op.execute(
        """
        IF COL_LENGTH('Conversations', 'UserID_UUID') IS NULL
            ALTER TABLE Conversations ADD UserID_UUID UNIQUEIDENTIFIER NULL
        """
    )

    # No safe automatic mapping from legacy INT user IDs to UUID users.
    # Keep as NULL for legacy rows; new rows will store authenticated UUID owner.

    op.execute(
        """
        DECLARE @drop_userid_indexes_sql NVARCHAR(MAX) = N'';
        SELECT @drop_userid_indexes_sql = @drop_userid_indexes_sql +
            N'DROP INDEX [' + i.name + N'] ON [' + OBJECT_SCHEMA_NAME(i.object_id) + N'].[' + OBJECT_NAME(i.object_id) + N'];'
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID('Conversations')
          AND i.is_hypothetical = 0
          AND i.name IS NOT NULL
          AND c.name = 'UserID';

        IF LEN(@drop_userid_indexes_sql) > 0
            EXEC sp_executesql @drop_userid_indexes_sql;
        """
    )

    op.execute(
        """
        IF COL_LENGTH('Conversations', 'UserID') IS NOT NULL
            ALTER TABLE Conversations DROP COLUMN UserID
        """
    )

    op.execute("EXEC sp_rename 'Conversations.UserID_UUID', 'UserID', 'COLUMN'")

    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID('Conversations')
              AND name = 'ix_Conversations_UserID'
        )
            CREATE INDEX ix_Conversations_UserID ON Conversations(UserID)
        """
    )


def downgrade() -> None:
    bind = op.get_bind()

    has_conversations = bind.execute(
        text("SELECT CASE WHEN OBJECT_ID('Conversations', 'U') IS NOT NULL THEN 1 ELSE 0 END")
    ).scalar()

    if not has_conversations:
        return

    user_id_type = bind.execute(
        text(
            """
            SELECT DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Conversations' AND COLUMN_NAME = 'UserID'
            """
        )
    ).scalar()

    if not user_id_type or str(user_id_type).lower() == "int":
        return

    op.execute(
        """
        IF COL_LENGTH('Conversations', 'UserID_INT') IS NULL
            ALTER TABLE Conversations ADD UserID_INT INT NULL
        """
    )

    op.execute(
        """
        IF COL_LENGTH('Conversations', 'UserID') IS NOT NULL
            ALTER TABLE Conversations DROP COLUMN UserID
        """
    )

    op.execute("EXEC sp_rename 'Conversations.UserID_INT', 'UserID', 'COLUMN'")
