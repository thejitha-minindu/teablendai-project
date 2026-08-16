"""create or upgrade violations table

Revision ID: 4d1a6d6c7f2b
Revises: 8bf7d5aee2c1
Create Date: 2026-04-28 16:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mssql


revision: str = "4d1a6d6c7f2b"
down_revision: Union[str, Sequence[str], None] = "8bf7d5aee2c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "violations" not in tables:
        op.create_table(
            "violations",
            sa.Column("violation_id", mssql.UNIQUEIDENTIFIER(), nullable=False),
            sa.Column("sender_id", mssql.UNIQUEIDENTIFIER(), nullable=False),
            sa.Column("violator_id", sa.String(length=255), nullable=False),
            sa.Column("auction_id", sa.String(length=255), nullable=True),
            sa.Column("violation_type", sa.String(length=32), nullable=False),
            sa.Column("reason", sa.Text(), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(sysutcdatetime())"),
            ),
            sa.ForeignKeyConstraint(["sender_id"], ["users.user_id"]),
            sa.PrimaryKeyConstraint("violation_id"),
        )
    else:
        columns = {column["name"] for column in inspector.get_columns("violations")}

        if "auction_id" not in columns:
            op.add_column("violations", sa.Column("auction_id", sa.String(length=255), nullable=True))

        if "created_at" not in columns:
            op.add_column(
                "violations",
                sa.Column(
                    "created_at",
                    sa.DateTime(timezone=True),
                    nullable=False,
                    server_default=sa.text("(sysutcdatetime())"),
                ),
            )

        if "status" not in columns:
            op.add_column(
                "violations",
                sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
            )

    op.execute(
        """
        UPDATE violations
        SET status = CASE
            WHEN status IS NULL OR LTRIM(RTRIM(CAST(status AS VARCHAR(64)))) = '' THEN 'open'
            WHEN UPPER(LTRIM(RTRIM(CAST(status AS VARCHAR(64))))) = 'PENDING' THEN 'open'
            WHEN UPPER(LTRIM(RTRIM(CAST(status AS VARCHAR(64))))) = 'OPEN' THEN 'open'
            WHEN UPPER(LTRIM(RTRIM(CAST(status AS VARCHAR(64))))) IN ('UNDER REVIEW', 'UNDER_REVIEW') THEN 'under_review'
            WHEN UPPER(LTRIM(RTRIM(CAST(status AS VARCHAR(64))))) = 'RESOLVED' THEN 'resolved'
            WHEN UPPER(LTRIM(RTRIM(CAST(status AS VARCHAR(64))))) = 'CLOSED' THEN 'closed'
            ELSE 'open'
        END
        """
    )

    op.execute(
        """
        UPDATE violations
        SET violation_type = CASE
            WHEN violation_type IS NULL OR LTRIM(RTRIM(CAST(violation_type AS VARCHAR(100)))) = '' THEN 'other'
            WHEN UPPER(LTRIM(RTRIM(CAST(violation_type AS VARCHAR(100))))) = 'FRAUD' THEN 'fraud'
            WHEN UPPER(LTRIM(RTRIM(CAST(violation_type AS VARCHAR(100))))) = 'SCAM' THEN 'scam'
            WHEN UPPER(LTRIM(RTRIM(CAST(violation_type AS VARCHAR(100))))) = 'HARASSMENT' THEN 'harassment'
            WHEN UPPER(LTRIM(RTRIM(CAST(violation_type AS VARCHAR(100))))) IN ('FAKE PRODUCT', 'FAKE_PRODUCT') THEN 'fake_product'
            WHEN UPPER(LTRIM(RTRIM(CAST(violation_type AS VARCHAR(100))))) IN ('PAYMENT ISSUE', 'PAYMENT_ISSUE') THEN 'payment_issue'
            ELSE 'other'
        END
        """
    )

    op.alter_column("violations", "violator_id", existing_type=sa.String(length=255), nullable=False)
    op.alter_column("violations", "reason", existing_type=sa.Text(), nullable=False)
    op.alter_column(
        "violations",
        "violation_type",
        existing_type=sa.String(length=100),
        type_=sa.String(length=32),
        nullable=False,
    )
    op.execute(
        """
        DECLARE @default_name NVARCHAR(128);

        SELECT @default_name = dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c
            ON c.object_id = dc.parent_object_id
           AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID('violations')
          AND c.name = 'status';

        IF @default_name IS NOT NULL
            EXEC(N'ALTER TABLE violations DROP CONSTRAINT [' + @default_name + N']');
        """
    )
    op.alter_column(
        "violations",
        "status",
        existing_type=sa.String(length=64),
        type_=sa.String(length=32),
        nullable=False,
    )
    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1
            FROM sys.default_constraints dc
            INNER JOIN sys.columns c
                ON c.object_id = dc.parent_object_id
               AND c.column_id = dc.parent_column_id
            WHERE dc.parent_object_id = OBJECT_ID('violations')
              AND c.name = 'status'
        )
            ALTER TABLE violations ADD CONSTRAINT DF_violations_status DEFAULT 'open' FOR status
        """
    )


def downgrade() -> None:
    pass
