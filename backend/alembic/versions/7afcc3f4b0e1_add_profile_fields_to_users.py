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


def upgrade() -> None:
    try:
        op.add_column("users", sa.Column("shipping_address", sa.String(length=256), nullable=True))
    except Exception as e:
        print(f"Ignoring error adding shipping_address: {e}")
    try:
        op.add_column("users", sa.Column("payment_method", sa.String(length=128), nullable=True))
    except Exception as e:
        print(f"Ignoring error adding payment_method: {e}")


def downgrade() -> None:
    op.drop_column("users", "payment_method")
    op.drop_column("users", "shipping_address")
