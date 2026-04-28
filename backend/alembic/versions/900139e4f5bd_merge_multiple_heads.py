"""merge_multiple_heads

Revision ID: 900139e4f5bd
Revises: b231032ca313, c2a4d7f0e9b1, d168e52fdc48
Create Date: 2026-04-24 22:27:17.140507

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '900139e4f5bd'
down_revision: Union[str, Sequence[str], None] = ('b231032ca313', 'c2a4d7f0e9b1', 'd168e52fdc48')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
