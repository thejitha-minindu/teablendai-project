"""Create system_logs table

Revision ID: a2b3c4d5e6f7
Revises: fefc32896232, 9f2c6b8e1a4d
Create Date: 2026-06-03 01:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER


# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = ('fefc32896232', '9f2c6b8e1a4d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            """
            SELECT 1
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = :table_name
            """
        ),
        {"table_name": table_name},
    ).first()
    return result is not None


def _index_exists(table_name: str, index_name: str) -> bool:
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            """
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(:table_name)
              AND name = :index_name
            """
        ),
        {"table_name": table_name, "index_name": index_name},
    ).first()
    return result is not None


def upgrade() -> None:
    """Create system_logs table for tracking admin system activity."""
    if not _table_exists('system_logs'):
        op.create_table(
            'system_logs',
            sa.Column('log_id', UNIQUEIDENTIFIER(), nullable=False, server_default=sa.text('NEWID()')),
            sa.Column('display_id', sa.String(length=16), nullable=False),
            sa.Column('user_name', sa.String(length=128), nullable=False),
            sa.Column('user_id', UNIQUEIDENTIFIER(), nullable=True),
            sa.Column('activity_type', sa.String(length=64), nullable=False),
            sa.Column('status', sa.String(length=16), nullable=False, server_default=sa.text("'success'")),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('details', sa.String(length=512), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('GETUTCDATE()')),
            sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='fk_system_logs_user_id'),
            sa.PrimaryKeyConstraint('log_id'),
            sa.UniqueConstraint('display_id', name='uq_system_logs_display_id'),
        )
        if not _index_exists('system_logs', 'ix_system_logs_status'):
            op.create_index('ix_system_logs_status', 'system_logs', ['status'])
        if not _index_exists('system_logs', 'ix_system_logs_activity_type'):
            op.create_index('ix_system_logs_activity_type', 'system_logs', ['activity_type'])
        if not _index_exists('system_logs', 'ix_system_logs_created_at'):
            op.create_index('ix_system_logs_created_at', 'system_logs', ['created_at'])
        if not _index_exists('system_logs', 'ix_system_logs_user_id'):
            op.create_index('ix_system_logs_user_id', 'system_logs', ['user_id'])


def downgrade() -> None:
    """Drop system_logs table."""
    if _index_exists('system_logs', 'ix_system_logs_user_id'):
        op.drop_index('ix_system_logs_user_id', table_name='system_logs')
    if _index_exists('system_logs', 'ix_system_logs_created_at'):
        op.drop_index('ix_system_logs_created_at', table_name='system_logs')
    if _index_exists('system_logs', 'ix_system_logs_activity_type'):
        op.drop_index('ix_system_logs_activity_type', table_name='system_logs')
    if _index_exists('system_logs', 'ix_system_logs_status'):
        op.drop_index('ix_system_logs_status', table_name='system_logs')
    if _table_exists('system_logs'):
        op.drop_table('system_logs')
