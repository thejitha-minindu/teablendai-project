"""Create CSV upload tables (TeaPurchase, TeaBlendSale, BlendComposition, Customer, BlendPurchaseMapping)

Revision ID: b5c6d7e8f9a0
Revises: 60c90d150bcf, a2b3c4d5e6f7
Create Date: 2026-06-03 13:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5c6d7e8f9a0'
down_revision: Union[str, Sequence[str], None] = ('60c90d150bcf', 'a2b3c4d5e6f7')
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
    """Create the five CSV upload tables used by the admin CSV wizard."""

    # ── Customer (no FK dependencies) ──
    if not _table_exists('Customer'):
        op.create_table(
            'Customer',
            sa.Column('CustomerID', sa.Integer(), nullable=False),
            sa.Column('Name', sa.String(length=100), nullable=True),
            sa.Column('Region', sa.String(length=100), nullable=True),
            sa.PrimaryKeyConstraint('CustomerID'),
        )
        if not _index_exists('Customer', 'ix_Customer_CustomerID'):
            op.create_index('ix_Customer_CustomerID', 'Customer', ['CustomerID'])

    # ── TeaPurchase ──
    if not _table_exists('TeaPurchase'):
        op.create_table(
            'TeaPurchase',
            sa.Column('PurchaseID', sa.Integer(), nullable=False),
            sa.Column('SourceType', sa.String(length=50), nullable=True),
            sa.Column('Standard', sa.String(length=50), nullable=True),
            sa.Column('PricePerKg', sa.DECIMAL(), nullable=True),
            sa.Column('QuantityKg', sa.DECIMAL(), nullable=True),
            sa.Column('PurchaseDate', sa.Date(), nullable=True),
            sa.PrimaryKeyConstraint('PurchaseID'),
        )
        if not _index_exists('TeaPurchase', 'ix_TeaPurchase_PurchaseID'):
            op.create_index('ix_TeaPurchase_PurchaseID', 'TeaPurchase', ['PurchaseID'])

    # ── TeaBlendSale ──
    if not _table_exists('TeaBlendSale'):
        op.create_table(
            'TeaBlendSale',
            sa.Column('SaleID', sa.Integer(), nullable=False),
            sa.Column('CustomerID', sa.Integer(), nullable=True),
            sa.Column('BlendName', sa.String(length=100), nullable=True),
            sa.Column('PricePerKg', sa.DECIMAL(), nullable=True),
            sa.Column('QuantityKg', sa.DECIMAL(), nullable=True),
            sa.Column('SaleDate', sa.Date(), nullable=True),
            sa.PrimaryKeyConstraint('SaleID'),
        )
        if not _index_exists('TeaBlendSale', 'ix_TeaBlendSale_SaleID'):
            op.create_index('ix_TeaBlendSale_SaleID', 'TeaBlendSale', ['SaleID'])

    # ── BlendComposition ──
    if not _table_exists('BlendComposition'):
        op.create_table(
            'BlendComposition',
            sa.Column('BlendID', sa.Integer(), nullable=False),
            sa.Column('Standard', sa.String(length=50), nullable=True),
            sa.Column('Ratio', sa.DECIMAL(), nullable=True),
            sa.PrimaryKeyConstraint('BlendID'),
        )
        if not _index_exists('BlendComposition', 'ix_BlendComposition_BlendID'):
            op.create_index('ix_BlendComposition_BlendID', 'BlendComposition', ['BlendID'])

    # ── BlendPurchaseMapping ──
    if not _table_exists('BlendPurchaseMapping'):
        op.create_table(
            'BlendPurchaseMapping',
            sa.Column('MappingID', sa.Integer(), nullable=False),
            sa.Column('SaleID', sa.Integer(), nullable=True),
            sa.Column('PurchaseID', sa.Integer(), nullable=True),
            sa.Column('Standard', sa.String(length=50), nullable=True),
            sa.Column('QuantityUsedKg', sa.DECIMAL(), nullable=True),
            sa.PrimaryKeyConstraint('MappingID'),
        )
        if not _index_exists('BlendPurchaseMapping', 'ix_BlendPurchaseMapping_MappingID'):
            op.create_index('ix_BlendPurchaseMapping_MappingID', 'BlendPurchaseMapping', ['MappingID'])


def downgrade() -> None:
    """Drop CSV upload tables in reverse dependency order."""
    for table in ('BlendPurchaseMapping', 'BlendComposition', 'TeaBlendSale', 'TeaPurchase', 'Customer'):
        if _table_exists(table):
            op.drop_table(table)
