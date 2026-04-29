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


def upgrade() -> None:
    op.add_column("users", sa.Column("status", sa.String(length=16), nullable=False, server_default="PENDING"))
    op.create_index("ix_users_status", "users", ["status"])


def downgrade() -> None:
    op.drop_index("ix_users_status", "users")
    op.drop_column("users", "status")
