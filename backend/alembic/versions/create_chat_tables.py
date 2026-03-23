"""create chat tables

Revision ID: create_chat_tables
Revises: add_custom_auction_id_column
Create Date: 2026-03-18
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "create_chat_tables"
down_revision = "add_custom_auction_id_column"
branch_labels = None
depends_on = None


def upgrade() -> None:
	op.execute(
		"""
		IF OBJECT_ID('Conversations', 'U') IS NULL
		BEGIN
			CREATE TABLE Conversations (
				ConversationID INT IDENTITY(1,1) PRIMARY KEY,
				Title NVARCHAR(500) NULL,
				UserID INT NULL,
				CreatedAt DATETIME NOT NULL CONSTRAINT DF_Conversations_CreatedAt DEFAULT GETDATE(),
				UpdatedAt DATETIME NOT NULL CONSTRAINT DF_Conversations_UpdatedAt DEFAULT GETDATE(),
				MessageCount INT NOT NULL CONSTRAINT DF_Conversations_MessageCount DEFAULT 0,
				IsActive BIT NOT NULL CONSTRAINT DF_Conversations_IsActive DEFAULT 1
			)
		END
		"""
	)

	op.execute(
		"""
		IF OBJECT_ID('Messages', 'U') IS NULL
		BEGIN
			CREATE TABLE Messages (
				MessageID INT IDENTITY(1,1) PRIMARY KEY,
				ConversationID INT NOT NULL,
				Role NVARCHAR(20) NOT NULL,
				Content NVARCHAR(MAX) NOT NULL,
				SQLQuery NVARCHAR(MAX) NULL,
				DataJSON NVARCHAR(MAX) NULL,
				Source NVARCHAR(50) NULL,
				VisualizationType NVARCHAR(50) NULL,
				VisualizationData NVARCHAR(MAX) NULL,
				SearchResults NVARCHAR(MAX) NULL,
				Timestamp DATETIME NOT NULL CONSTRAINT DF_Messages_Timestamp DEFAULT GETDATE(),
				ResponseTimeMs INT NULL,
				CONSTRAINT FK_Messages_Conversations
					FOREIGN KEY (ConversationID)
					REFERENCES Conversations(ConversationID)
					ON DELETE CASCADE
			)
		END
		"""
	)

	op.execute(
		"""
		IF NOT EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_Messages_ConversationID'
			  AND object_id = OBJECT_ID('Messages')
		)
		BEGIN
			CREATE INDEX IX_Messages_ConversationID ON Messages(ConversationID)
		END
		"""
	)

	op.execute(
		"""
		IF NOT EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_Messages_Timestamp'
			  AND object_id = OBJECT_ID('Messages')
		)
		BEGIN
			CREATE INDEX IX_Messages_Timestamp ON Messages([Timestamp])
		END
		"""
	)


def downgrade() -> None:
	op.execute(
		"""
		IF EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_Messages_Timestamp'
			  AND object_id = OBJECT_ID('Messages')
		)
		BEGIN
			DROP INDEX IX_Messages_Timestamp ON Messages
		END
		"""
	)

	op.execute(
		"""
		IF EXISTS (
			SELECT 1 FROM sys.indexes
			WHERE name = 'IX_Messages_ConversationID'
			  AND object_id = OBJECT_ID('Messages')
		)
		BEGIN
			DROP INDEX IX_Messages_ConversationID ON Messages
		END
		"""
	)

	op.execute(
		"""
		IF OBJECT_ID('Messages', 'U') IS NOT NULL
		BEGIN
			DROP TABLE Messages
		END
		"""
	)

	op.execute(
		"""
		IF OBJECT_ID('Conversations', 'U') IS NOT NULL
		BEGIN
			DROP TABLE Conversations
		END
		"""
	)
