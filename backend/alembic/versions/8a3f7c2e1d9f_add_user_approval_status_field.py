"""add user approval status field

Revision ID: 8a3f7c2e1d9f
Revises: 7afcc3f4b0e1
Create Date: 2026-04-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8a3f7c2e1d9f"
down_revision: Union[str, Sequence[str], None] = "7afcc3f4b0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        sa.text(
            """
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = :table_name
              AND COLUMN_NAME = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).first()
    return result is not None


def _index_exists(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        sa.text(
            """
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(:table_name)
              AND name = :index_name
            """
        ),
        {"table_name": table_name, "index_name": index_name},
    ).first()
    return result is not None


def upgrade() -> None:
    if not _column_exists("users", "status"):
        op.add_column("users", sa.Column("status", sa.String(length=16), nullable=False, server_default="PENDING"))
    if not _index_exists("users", "ix_users_status"):
        op.create_index("ix_users_status", "users", ["status"])


def downgrade() -> None:
    if _index_exists("users", "ix_users_status"):
        op.drop_index("ix_users_status", "users")
    if _column_exists("users", "status"):
        op.drop_column("users", "status")
