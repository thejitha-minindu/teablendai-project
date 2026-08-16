"""merge heads

Revision ID: 0d4241af2805
Revises: 9f2c6b8e1a4d, fefc32896232
Create Date: 2026-06-02 09:41:15.308996

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d4241af2805'
down_revision: Union[str, Sequence[str], None] = ('9f2c6b8e1a4d', 'fefc32896232')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
