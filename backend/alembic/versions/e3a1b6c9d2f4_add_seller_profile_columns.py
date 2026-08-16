"""add seller profile columns

Revision ID: e3a1b6c9d2f4
Revises: a1b2c3d4e5f6
Create Date: 2026-04-28 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "e3a1b6c9d2f4"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names() -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    existing_columns = _column_names()

    columns = [
        sa.Column("seller_name", sa.String(length=256), nullable=True),
        sa.Column("seller_registration_no", sa.String(length=128), nullable=True),
        sa.Column("seller_started_year", sa.Integer(), nullable=True),
        sa.Column("seller_website", sa.String(length=256), nullable=True),
        sa.Column("seller_description", sa.Text(), nullable=True),
        sa.Column("seller_street_address", sa.String(length=512), nullable=True),
        sa.Column("seller_province", sa.String(length=128), nullable=True),
        sa.Column("seller_city", sa.String(length=128), nullable=True),
        sa.Column("seller_postal_code", sa.String(length=32), nullable=True),
        sa.Column("seller_verification_status", sa.String(length=16), nullable=True),
        sa.Column("seller_rejection_reason", sa.String(length=512), nullable=True),
        sa.Column("seller_requested_at", sa.DateTime(), nullable=True),
        sa.Column("seller_approved_at", sa.DateTime(), nullable=True),
    ]

    for column in columns:
        if column.name not in existing_columns:
            op.add_column("users", column)


def downgrade() -> None:
    existing_columns = _column_names()

    for column_name in [
        "seller_approved_at",
        "seller_requested_at",
        "seller_rejection_reason",
        "seller_verification_status",
        "seller_postal_code",
        "seller_city",
        "seller_province",
        "seller_street_address",
        "seller_description",
        "seller_website",
        "seller_started_year",
        "seller_registration_no",
        "seller_name",
    ]:
        if column_name in existing_columns:
            op.drop_column("users", column_name)
