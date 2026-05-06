"""add_nic_column_to_users

Revision ID: dfff2bd72f51
Revises: 900139e4f5bd
Create Date: 2026-04-24 22:27:24.755394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'dfff2bd72f51'
down_revision: Union[str, Sequence[str], None] = '900139e4f5bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names() -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    """Upgrade schema."""
    if "nic" not in _column_names():
        op.add_column("users", sa.Column("nic", sa.String(length=32), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    if "nic" in _column_names():
        op.drop_column("users", "nic")
