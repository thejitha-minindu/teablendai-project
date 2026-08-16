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
