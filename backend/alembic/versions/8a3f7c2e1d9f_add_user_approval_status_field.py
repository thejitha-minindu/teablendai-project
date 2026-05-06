"""add user approval status field

Revision ID: 8a3f7c2e1d9f
Revises: 7afcc3f4b0e1
Create Date: 2026-04-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "8a3f7c2e1d9f"
down_revision: Union[str, Sequence[str], None] = "7afcc3f4b0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return inspect(op.get_bind())


def _column_names() -> set[str]:
    return {column["name"] for column in _inspector().get_columns("users")}


def _index_exists(index_name: str) -> bool:
    return any(index["name"] == index_name for index in _inspector().get_indexes("users"))


def upgrade() -> None:
    if "status" not in _column_names():
        op.add_column("users", sa.Column("status", sa.String(length=16), nullable=False, server_default="PENDING"))
    if not _index_exists("ix_users_status"):
        op.create_index("ix_users_status", "users", ["status"])


def downgrade() -> None:
    if _index_exists("ix_users_status"):
        op.drop_index("ix_users_status", "users")
    if "status" in _column_names():
        op.drop_column("users", "status")
