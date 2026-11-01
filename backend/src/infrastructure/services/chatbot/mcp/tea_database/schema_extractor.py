"""
Schema Extractor for Tea Database

Dynamically extracts database schema from MSSQL and formats it for LLM consumption.
"""

import logging
from typing import Optional
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


class SchemaExtractor:
    """Extract and format MSSQL database schema"""

    def __init__(self, engine: Engine):
        """
        Initialize with SQLAlchemy engine
        
        Args:
            engine: SQLAlchemy engine connected to MSSQL
        """
        self.engine = engine
        self.inspector = inspect(engine)

    def extract_schema(self) -> str:
        """
        Extract complete database schema and format for LLM.
        
        Returns:
            Formatted schema string with tables, columns, types, and relationships
        """
        try:
            schema_parts = []
            if self.engine.dialect.name == "mssql":
                return self._extract_mssql_schema()
            
            # Get all table names
            table_names = self.inspector.get_table_names()
            
            if not table_names:
                logger.warning("No tables found in database")
                return "No tables found in database"
            
            for table_name in sorted(table_names):
                table_schema = self._extract_table_schema(table_name)
                if table_schema:
                    schema_parts.append(table_schema)
            
            # Add relationships section
            relationships = self._extract_relationships(table_names)
            if relationships:
                schema_parts.append(relationships)
            
            return "\n\n".join(schema_parts)
        
        except Exception as e:
            logger.error(f"Error extracting schema: {e}", exc_info=True)
            return f"Error extracting schema: {str(e)}"

    def _extract_mssql_schema(self) -> str:
        """Join small catalog results in Python to avoid SQL memory grants.

        On a memory-constrained RDS instance, even catalog joins/sorts can wait
        on RESOURCE_SEMAPHORE. These fixed-count scans need no SQL hash joins
        or sorting and still preserve column order, types, and composite keys.
        """
        with self.engine.connect() as connection:
            def catalog(sql):
                return connection.execute(text(sql)).mappings().all()

            table_rows = catalog("SELECT name, object_id FROM sys.tables WHERE schema_id = SCHEMA_ID() AND is_ms_shipped = 0")
            column_rows = catalog("SELECT object_id, name, column_id, user_type_id, max_length, precision, scale, is_nullable FROM sys.columns")
            type_rows = catalog("SELECT user_type_id, name FROM sys.types")
            primary_indexes = catalog("SELECT object_id, index_id FROM sys.indexes WHERE is_primary_key = 1")
            index_columns = catalog("SELECT object_id, index_id, column_id FROM sys.index_columns WHERE key_ordinal > 0")
            foreign_key_rows = catalog("SELECT constraint_object_id, parent_object_id, parent_column_id, referenced_object_id, referenced_column_id, constraint_column_id FROM sys.foreign_key_columns")

        table_names = {row["object_id"]: row["name"] for row in table_rows}
        type_names = {row["user_type_id"]: row["name"] for row in type_rows}
        primary_indexes = {(row["object_id"], row["index_id"]) for row in primary_indexes}
        primary_columns = {(row["object_id"], row["column_id"]) for row in index_columns
                           if (row["object_id"], row["index_id"]) in primary_indexes}
        column_names = {(row["object_id"], row["column_id"]): row["name"] for row in column_rows}
        columns = [dict(row, table_name=table_names[row["object_id"]], column_name=row["name"],
                        type_name=type_names[row["user_type_id"]],
                        is_primary_key=(row["object_id"], row["column_id"]) in primary_columns)
                   for row in column_rows if row["object_id"] in table_names]
        columns.sort(key=lambda row: (row["table_name"], row["column_id"]))
        foreign_keys = [dict(
            row, table_name=table_names[row["parent_object_id"]],
            constraint_name=row["constraint_object_id"],
            column_name=column_names[(row["parent_object_id"], row["parent_column_id"])],
            referred_table=table_names[row["referenced_object_id"]],
            referred_column=column_names[(row["referenced_object_id"], row["referenced_column_id"])],
        ) for row in foreign_key_rows
            if row["parent_object_id"] in table_names and row["referenced_object_id"] in table_names]
        foreign_keys.sort(key=lambda row: (row["table_name"], row["constraint_name"], row["constraint_column_id"]))

        tables = {}
        for column in columns:
            name = column["table_name"]
            lines = tables.setdefault(name, [f"TABLE: {name}"])
            type_name = column["type_name"].upper()
            if type_name in {"VARCHAR", "NVARCHAR", "CHAR", "NCHAR", "BINARY", "VARBINARY"}:
                size = column["max_length"]
                if size == -1:
                    size = "MAX"
                elif type_name in {"NVARCHAR", "NCHAR"}:
                    size //= 2
                type_name += f"({size})"
            elif type_name in {"DECIMAL", "NUMERIC"}:
                type_name += f"({column['precision']}, {column['scale']})"
            nullable = "NULL" if column["is_nullable"] else "NOT NULL"
            primary = " PK" if column["is_primary_key"] else ""
            lines.append(f"  {column['column_name']}: {type_name} {nullable}{primary}")

        if not tables:
            return "No tables found in database"
        parts = ["\n".join(lines) for lines in tables.values()]
        relationships = {}
        for foreign_key in foreign_keys:
            key = (foreign_key["table_name"], foreign_key["constraint_name"], foreign_key["referred_table"])
            local_columns, remote_columns = relationships.setdefault(key, ([], []))
            local_columns.append(foreign_key["column_name"])
            remote_columns.append(foreign_key["referred_column"])
        if relationships:
            lines = ["RELATIONSHIPS (Foreign Keys):"]
            for (table, _constraint, target), (local, remote) in relationships.items():
                lines.append(f"  {table}.{', '.join(local)} → {target}.{', '.join(remote)}")
            parts.append("\n".join(lines))
        return "\n\n".join(parts)

    def _extract_table_schema(self, table_name: str) -> Optional[str]:
        """Extract schema for a single table"""
        try:
            columns = self.inspector.get_columns(table_name)
            pk = self.inspector.get_pk_constraint(table_name)
            pk_columns = pk.get('constrained_columns', []) if pk else []
            
            schema_lines = [f"TABLE: {table_name}"]
            
            for col in columns:
                col_name = col['name']
                col_type = str(col['type'])
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                is_pk = "PK" if col_name in pk_columns else ""
                
                # Format column info
                col_info = f"  {col_name}: {col_type} {nullable}"
                if is_pk:
                    col_info += f" {is_pk}"
                
                schema_lines.append(col_info)
            
            return "\n".join(schema_lines)
        
        except Exception as e:
            logger.warning(f"Error extracting schema for table {table_name}: {e}")
            return None

    def _extract_relationships(self, table_names: list) -> Optional[str]:
        """Extract foreign key relationships between tables"""
        try:
            relationships = []
            
            for table_name in table_names:
                fks = self.inspector.get_foreign_keys(table_name)
                
                for fk in fks:
                    local_cols = ", ".join(fk['constrained_columns'])
                    referenced_table = fk['referred_table']
                    referenced_cols = ", ".join(fk['referred_columns'])
                    
                    relationship = (
                        f"{table_name}.{local_cols} → "
                        f"{referenced_table}.{referenced_cols}"
                    )
                    relationships.append(relationship)
            
            if relationships:
                schema_lines = ["RELATIONSHIPS (Foreign Keys):"]
                schema_lines.extend(f"  {rel}" for rel in relationships)
                return "\n".join(schema_lines)
            
            return None
        
        except Exception as e:
            logger.warning(f"Error extracting relationships: {e}")
            return None

    def get_table_columns(self, table_name: str) -> list:
        """Get column names for a specific table"""
        try:
            columns = self.inspector.get_columns(table_name)
            return [col['name'] for col in columns]
        except Exception as e:
            logger.error(f"Error getting columns for {table_name}: {e}")
            return []

    def table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the database"""
        return table_name in self.inspector.get_table_names()


# Initialize with engine from config
def _get_schema_extractor(engine: Engine) -> SchemaExtractor:
    """Factory function to create schema extractor"""
    return SchemaExtractor(engine)


# Singleton instance - will be set by server.py
_instance: Optional[SchemaExtractor] = None


def initialize(engine: Engine) -> None:
    """Initialize schema extractor with engine"""
    global _instance
    _instance = SchemaExtractor(engine)
    logger.info("Schema extractor initialized")


def extract_schema() -> str:
    """Extract database schema (uses singleton instance)"""
    if _instance is None:
        raise RuntimeError("Schema extractor not initialized. Call initialize() first.")
    return _instance.extract_schema()


def get_table_columns(table_name: str) -> list:
    """Get columns for a table"""
    if _instance is None:
        raise RuntimeError("Schema extractor not initialized. Call initialize() first.")
    return _instance.get_table_columns(table_name)


def table_exists(table_name: str) -> bool:
    """Check if table exists"""
    if _instance is None:
        raise RuntimeError("Schema extractor not initialized. Call initialize() first.")
    return _instance.table_exists(table_name)
