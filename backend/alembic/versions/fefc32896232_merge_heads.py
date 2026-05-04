"""merge_heads

Revision ID: fefc32896232
Revises: 8bf7d5aee2c1, e3a1b6c9d2f4
Create Date: 2026-04-29 03:28:46.148161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fefc32896232'
down_revision: Union[str, Sequence[str], None] = ('8bf7d5aee2c1', 'e3a1b6c9d2f4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
