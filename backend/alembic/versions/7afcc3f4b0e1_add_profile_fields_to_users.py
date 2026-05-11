"""add profile fields to users

Revision ID: 7afcc3f4b0e1
Revises: d62fe694cc91
Create Date: 2026-03-12 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7afcc3f4b0e1"
down_revision: Union[str, Sequence[str], None] = "d62fe694cc91"
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


def upgrade() -> None:
    if not _column_exists("users", "shipping_address"):
        op.add_column("users", sa.Column("shipping_address", sa.String(length=256), nullable=True))
    if not _column_exists("users", "payment_method"):
        op.add_column("users", sa.Column("payment_method", sa.String(length=128), nullable=True))


def downgrade() -> None:
    if _column_exists("users", "payment_method"):
        op.drop_column("users", "payment_method")
    if _column_exists("users", "shipping_address"):
        op.drop_column("users", "shipping_address")
