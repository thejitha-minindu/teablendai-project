"""convert chat ids to uuid

Revision ID: convert_chat_ids_to_uuid
Revises: create_chat_tables
Create Date: 2026-03-18
"""

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = "convert_chat_ids_to_uuid"
down_revision = "create_chat_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    has_chat_tables = bind.execute(
        text(
            """
            SELECT CASE
                WHEN OBJECT_ID('Conversations', 'U') IS NOT NULL
                 AND OBJECT_ID('Messages', 'U') IS NOT NULL
                THEN 1 ELSE 0 END
            """
        )
    ).scalar()

    if not has_chat_tables:
        return

    is_conversation_int = bind.execute(
        text(
            """
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Conversations'
                  AND COLUMN_NAME = 'ConversationID'
                  AND DATA_TYPE = 'int'
            ) THEN 1 ELSE 0 END
            """
        )
    ).scalar()

    # Already UUID (or already migrated)
    if not is_conversation_int:
        return

    # Add staging UUID columns
    op.execute("""
        IF COL_LENGTH('Conversations', 'ConversationID_UUID') IS NULL
            ALTER TABLE Conversations ADD ConversationID_UUID UNIQUEIDENTIFIER NULL
    """)
    op.execute("""
        IF COL_LENGTH('Messages', 'MessageID_UUID') IS NULL
            ALTER TABLE Messages ADD MessageID_UUID UNIQUEIDENTIFIER NULL
    """)
    op.execute("""
        IF COL_LENGTH('Messages', 'ConversationID_UUID') IS NULL
            ALTER TABLE Messages ADD ConversationID_UUID UNIQUEIDENTIFIER NULL
    """)

    # Populate UUID values
    op.execute("UPDATE Conversations SET ConversationID_UUID = NEWID() WHERE ConversationID_UUID IS NULL")
    op.execute("UPDATE Messages SET MessageID_UUID = NEWID() WHERE MessageID_UUID IS NULL")
    op.execute(
        """
        UPDATE m
        SET m.ConversationID_UUID = c.ConversationID_UUID
        FROM Messages m
        INNER JOIN Conversations c ON c.ConversationID = m.ConversationID
        WHERE m.ConversationID_UUID IS NULL
        """
    )

    # Enforce non-null on staging columns
    op.execute("ALTER TABLE Conversations ALTER COLUMN ConversationID_UUID UNIQUEIDENTIFIER NOT NULL")
    op.execute("ALTER TABLE Messages ALTER COLUMN MessageID_UUID UNIQUEIDENTIFIER NOT NULL")
    op.execute("ALTER TABLE Messages ALTER COLUMN ConversationID_UUID UNIQUEIDENTIFIER NOT NULL")

    # Drop FKs from any table that still references the legacy
    # Conversations.ConversationID integer PK. Some databases contain both
    # the current Messages table and a legacy ChatMessages table.
    op.execute(
        """
        DECLARE @drop_fk_sql NVARCHAR(MAX) = N'';
        SELECT @drop_fk_sql = @drop_fk_sql +
            N'ALTER TABLE [' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + N'].[' + OBJECT_NAME(fk.parent_object_id) + N'] DROP CONSTRAINT [' + fk.name + N'];'
        FROM sys.foreign_keys fk
        INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        INNER JOIN sys.columns parent_col ON parent_col.object_id = fkc.parent_object_id AND parent_col.column_id = fkc.parent_column_id
        INNER JOIN sys.columns ref_col ON ref_col.object_id = fkc.referenced_object_id AND ref_col.column_id = fkc.referenced_column_id
        WHERE fkc.referenced_object_id = OBJECT_ID('Conversations')
          AND ref_col.name = 'ConversationID'
          AND parent_col.name = 'ConversationID';

        IF LEN(@drop_fk_sql) > 0
            EXEC sp_executesql @drop_fk_sql;
        """
    )

    # Drop PK constraints before renaming PK columns
    op.execute(
        """
        DECLARE @drop_pk_conv_sql NVARCHAR(MAX) = N'';
        SELECT @drop_pk_conv_sql = @drop_pk_conv_sql +
            N'ALTER TABLE Conversations DROP CONSTRAINT [' + kc.name + N'];'
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('Conversations')
          AND kc.type = 'PK';

        IF LEN(@drop_pk_conv_sql) > 0
            EXEC sp_executesql @drop_pk_conv_sql;
        """
    )
    op.execute(
        """
        DECLARE @drop_pk_msg_sql NVARCHAR(MAX) = N'';
        SELECT @drop_pk_msg_sql = @drop_pk_msg_sql +
            N'ALTER TABLE Messages DROP CONSTRAINT [' + kc.name + N'];'
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('Messages')
          AND kc.type = 'PK';

        IF LEN(@drop_pk_msg_sql) > 0
            EXEC sp_executesql @drop_pk_msg_sql;
        """
    )

    # Drop legacy index on old int FK column before rename
    op.execute(
        """
        IF EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE object_id = OBJECT_ID('Messages')
              AND name = 'IX_Messages_ConversationID'
        )
            DROP INDEX IX_Messages_ConversationID ON Messages
        """
    )

    # Rename columns (old -> legacy, staging -> canonical)
    op.execute("EXEC sp_rename 'Conversations.ConversationID', 'ConversationID_Legacy', 'COLUMN'")
    op.execute("EXEC sp_rename 'Conversations.ConversationID_UUID', 'ConversationID', 'COLUMN'")
    op.execute("EXEC sp_rename 'Messages.MessageID', 'MessageID_Legacy', 'COLUMN'")
    op.execute("EXEC sp_rename 'Messages.MessageID_UUID', 'MessageID', 'COLUMN'")
    op.execute("EXEC sp_rename 'Messages.ConversationID', 'ConversationID_Legacy', 'COLUMN'")
    op.execute("EXEC sp_rename 'Messages.ConversationID_UUID', 'ConversationID', 'COLUMN'")

    # Drop any indexes that still reference legacy columns created by rename
    op.execute(
        """
        DECLARE @drop_legacy_indexes_sql NVARCHAR(MAX) = N'';
        SELECT @drop_legacy_indexes_sql = @drop_legacy_indexes_sql +
            N'DROP INDEX [' + i.name + N'] ON [' + OBJECT_SCHEMA_NAME(i.object_id) + N'].[' + OBJECT_NAME(i.object_id) + N'];'
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID('Messages')
          AND i.is_hypothetical = 0
          AND i.name IS NOT NULL
          AND c.name IN ('MessageID_Legacy', 'ConversationID_Legacy');

        IF LEN(@drop_legacy_indexes_sql) > 0
            EXEC sp_executesql @drop_legacy_indexes_sql;
        """
    )

    op.execute(
        """
        DECLARE @drop_legacy_indexes_sql NVARCHAR(MAX) = N'';
        SELECT @drop_legacy_indexes_sql = @drop_legacy_indexes_sql +
            N'DROP INDEX [' + i.name + N'] ON [' + OBJECT_SCHEMA_NAME(i.object_id) + N'].[' + OBJECT_NAME(i.object_id) + N'];'
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID('Conversations')
          AND i.is_hypothetical = 0
          AND i.name IS NOT NULL
          AND c.name = 'ConversationID_Legacy';

        IF LEN(@drop_legacy_indexes_sql) > 0
            EXEC sp_executesql @drop_legacy_indexes_sql;
        """
    )

    # Drop legacy columns
    op.execute("IF COL_LENGTH('Messages', 'MessageID_Legacy') IS NOT NULL ALTER TABLE Messages DROP COLUMN MessageID_Legacy")
    op.execute("IF COL_LENGTH('Messages', 'ConversationID_Legacy') IS NOT NULL ALTER TABLE Messages DROP COLUMN ConversationID_Legacy")
    op.execute("IF COL_LENGTH('Conversations', 'ConversationID_Legacy') IS NOT NULL ALTER TABLE Conversations DROP COLUMN ConversationID_Legacy")

    # Ensure NEWID defaults
    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID('Conversations')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Conversations'), 'ConversationID', 'ColumnId')
        )
            ALTER TABLE Conversations
            ADD CONSTRAINT DF_Conversations_ConversationID DEFAULT NEWID() FOR ConversationID
        """
    )
    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID('Messages')
              AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('Messages'), 'MessageID', 'ColumnId')
        )
            ALTER TABLE Messages
            ADD CONSTRAINT DF_Messages_MessageID DEFAULT NEWID() FOR MessageID
        """
    )

    # Recreate constraints and index using UUID columns
    op.execute("ALTER TABLE Conversations ADD CONSTRAINT PK_Conversations PRIMARY KEY (ConversationID)")
    op.execute("ALTER TABLE Messages ADD CONSTRAINT PK_Messages PRIMARY KEY (MessageID)")
    op.execute(
        """
        ALTER TABLE Messages
        ADD CONSTRAINT FK_Messages_Conversations
            FOREIGN KEY (ConversationID)
            REFERENCES Conversations(ConversationID)
            ON DELETE CASCADE
        """
    )
    op.execute(
        """
        IF NOT EXISTS (
            SELECT 1 FROM sys.indexes
            WHERE object_id = OBJECT_ID('Messages')
              AND name = 'IX_Messages_ConversationID'
        )
            CREATE INDEX IX_Messages_ConversationID ON Messages(ConversationID)
        """
    )


def downgrade() -> None:
    # Downgrade from UUID back to INT is intentionally not automated to avoid data loss.
    pass
