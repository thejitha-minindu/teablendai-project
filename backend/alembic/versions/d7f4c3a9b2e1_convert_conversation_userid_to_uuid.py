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
        IF COL_LENGTH('Conversations', 'UserID') IS NOT NULL
            ALTER TABLE Conversations DROP COLUMN UserID
        """
    )

    op.execute("EXEC sp_rename 'Conversations.UserID_UUID', 'UserID', 'COLUMN'")


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
