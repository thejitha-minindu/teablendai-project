"""Add stripe fields to PaymentDetails

Revision ID: f3b1ab73c060
Revises: 60c90d150bcf
Create Date: 2026-06-24 21:50:00.342262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql

# revision identifiers, used by Alembic.
revision: str = 'f3b1ab73c060'
down_revision: Union[str, Sequence[str], None] = '60c90d150bcf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('payment_details', sa.Column('stripe_session_id', sa.String(length=255), nullable=True))
    op.add_column('payment_details', sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payment_details', 'stripe_payment_intent_id')
    op.drop_column('payment_details', 'stripe_session_id')
