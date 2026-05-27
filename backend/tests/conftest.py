import pytest
import uuid
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER

# 1. Tell SQLAlchemy's SQLite dialect to compile Microsoft's UNIQUEIDENTIFIER as VARCHAR(36)
@compiles(UNIQUEIDENTIFIER, "sqlite")
def compile_uniqueidentifier_sqlite(type_, compiler, **kw):
    return "VARCHAR(36)"

# 2. Patch bind_processor to convert Python values safely to strings under SQLite
original_bind_processor = UNIQUEIDENTIFIER.bind_processor

def patched_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        return lambda value: str(value) if value is not None else None
    return original_bind_processor(self, dialect)

UNIQUEIDENTIFIER.bind_processor = patched_bind_processor

# 3. Patch result_processor to convert SQLite strings back to Python uuid.UUID objects
original_result_processor = UNIQUEIDENTIFIER.result_processor

def patched_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        def process(value):
            if value is None:
                return None
            try:
                # Convert string back to uuid.UUID object so the ORM can match keys perfectly
                return uuid.UUID(str(value))
            except ValueError:
                return str(value)
        return process
    return original_result_processor(self, dialect, coltype)

UNIQUEIDENTIFIER.result_processor = patched_result_processor
