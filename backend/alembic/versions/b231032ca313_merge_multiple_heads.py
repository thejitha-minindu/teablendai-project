"""merge multiple heads

Revision ID: b231032ca313
Revises: 8a3f7c2e1d9f, b4a9a7d1c2e3, cebf37212469
Create Date: 2026-04-23 10:37:04.109382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b231032ca313'
down_revision: Union[str, Sequence[str], None] = ('8a3f7c2e1d9f', 'b4a9a7d1c2e3', 'cebf37212469')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
