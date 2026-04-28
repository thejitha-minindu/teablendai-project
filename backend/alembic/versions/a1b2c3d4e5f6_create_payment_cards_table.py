"""Create payment_cards table

Revision ID: a1b2c3d4e5f6
Revises: f58818eeef56
Create Date: 2026-04-25 00:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f58818eeef56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create payment_cards table for storing masked card display info."""
    op.create_table(
        'payment_cards',
        sa.Column('card_id', UNIQUEIDENTIFIER(), nullable=False),
        sa.Column('user_id', UNIQUEIDENTIFIER(), nullable=False),
        sa.Column('card_type', sa.String(length=32), nullable=False),
        sa.Column('last4', sa.String(length=4), nullable=False),
        sa.Column('expiry', sa.String(length=5), nullable=False),
        sa.Column('cardholder_name', sa.String(length=128), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('GETUTCDATE()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='fk_payment_cards_user_id'),
        sa.PrimaryKeyConstraint('card_id'),
    )
    op.create_index('ix_payment_cards_card_id', 'payment_cards', ['card_id'])
    op.create_index('ix_payment_cards_user_id', 'payment_cards', ['user_id'])


def downgrade() -> None:
    """Drop payment_cards table."""
    op.drop_index('ix_payment_cards_user_id', table_name='payment_cards')
    op.drop_index('ix_payment_cards_card_id', table_name='payment_cards')
    op.drop_table('payment_cards')
