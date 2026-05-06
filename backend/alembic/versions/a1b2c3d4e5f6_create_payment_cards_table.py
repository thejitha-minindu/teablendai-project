"""Create payment_cards table

Revision ID: a1b2c3d4e5f6
Revises: f58818eeef56
Create Date: 2026-04-25 00:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f58818eeef56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return inspect(op.get_bind())


def _table_exists(table_name: str) -> bool:
    return table_name in _inspector().get_table_names()


def _index_exists(table_name: str, index_name: str) -> bool:
    if not _table_exists(table_name):
        return False
    return any(index["name"] == index_name for index in _inspector().get_indexes(table_name))


def upgrade() -> None:
    """Create payment_cards table for storing masked card display info."""
    if not _table_exists('payment_cards'):
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
    if not _index_exists('payment_cards', 'ix_payment_cards_card_id'):
        op.create_index('ix_payment_cards_card_id', 'payment_cards', ['card_id'])
    if not _index_exists('payment_cards', 'ix_payment_cards_user_id'):
        op.create_index('ix_payment_cards_user_id', 'payment_cards', ['user_id'])


def downgrade() -> None:
    """Drop payment_cards table."""
    if _index_exists('payment_cards', 'ix_payment_cards_user_id'):
        op.drop_index('ix_payment_cards_user_id', table_name='payment_cards')
    if _index_exists('payment_cards', 'ix_payment_cards_card_id'):
        op.drop_index('ix_payment_cards_card_id', table_name='payment_cards')
    if _table_exists('payment_cards'):
        op.drop_table('payment_cards')
