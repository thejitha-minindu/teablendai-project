"""add profile fields to users

Revision ID: 7afcc3f4b0e1
Revises: d62fe694cc91
Create Date: 2026-03-12 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "7afcc3f4b0e1"
down_revision: Union[str, Sequence[str], None] = "d62fe694cc91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names() -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    existing_columns = _column_names()

    if "shipping_address" not in existing_columns:
        op.add_column("users", sa.Column("shipping_address", sa.String(length=256), nullable=True))
    if "payment_method" not in existing_columns:
        op.add_column("users", sa.Column("payment_method", sa.String(length=128), nullable=True))


def downgrade() -> None:
    existing_columns = _column_names()

    if "payment_method" in existing_columns:
        op.drop_column("users", "payment_method")
    if "shipping_address" in existing_columns:
        op.drop_column("users", "shipping_address")
