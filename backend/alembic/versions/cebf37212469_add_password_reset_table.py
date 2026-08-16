"""add_password_reset_table

Revision ID: cebf37212469
Revises: 7afcc3f4b0e1
Create Date: 2026-04-22 08:50:46.627570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import mssql


# revision identifiers, used by Alembic.
revision: str = 'cebf37212469'
down_revision: Union[str, Sequence[str], None] = '7afcc3f4b0e1'
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
    """Upgrade schema: Add password_resets table."""
    if not _table_exists('password_resets'):
        op.create_table('password_resets',
            sa.Column('id', mssql.UNIQUEIDENTIFIER(), nullable=False),
            sa.Column('user_id', mssql.UNIQUEIDENTIFIER(), nullable=False),
            sa.Column('otp_code', sa.String(length=6), nullable=False),
            sa.Column('attempts', sa.Integer(), nullable=False),
            sa.Column('max_attempts', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('is_used', sa.Boolean(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
            sa.PrimaryKeyConstraint('id')
        )

    if not _index_exists('password_resets', op.f('ix_password_resets_id')):
        op.create_index(op.f('ix_password_resets_id'), 'password_resets', ['id'], unique=False)
    if not _index_exists('password_resets', op.f('ix_password_resets_user_id')):
        op.create_index(op.f('ix_password_resets_user_id'), 'password_resets', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: Drop password_resets table."""
    if _index_exists('password_resets', op.f('ix_password_resets_user_id')):
        op.drop_index(op.f('ix_password_resets_user_id'), table_name='password_resets')
    if _index_exists('password_resets', op.f('ix_password_resets_id')):
        op.drop_index(op.f('ix_password_resets_id'), table_name='password_resets')
    if _table_exists('password_resets'):
        op.drop_table('password_resets')
