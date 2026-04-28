"""Add shipping_address and payment_method columns to users

Revision ID: f58818eeef56
Revises: dfff2bd72f51
Create Date: 2026-04-24 23:52:49.871160

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f58818eeef56'
down_revision: Union[str, Sequence[str], None] = 'dfff2bd72f51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.
    
    shipping_address and payment_method columns already exist in the database.
    This migration adds them to the SQLAlchemy model only (no DDL needed).
    """
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
