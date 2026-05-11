"""add_nic_column_to_users

Revision ID: dfff2bd72f51
Revises: 900139e4f5bd
Create Date: 2026-04-24 22:27:24.755394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfff2bd72f51'
down_revision: Union[str, Sequence[str], None] = '900139e4f5bd'
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
    """Upgrade schema."""
    if not _column_exists("users", "nic"):
        op.add_column("users", sa.Column("nic", sa.String(length=32), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    if _column_exists("users", "nic"):
        op.drop_column("users", "nic")
