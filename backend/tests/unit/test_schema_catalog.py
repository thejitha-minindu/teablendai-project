from unittest.mock import MagicMock
from unittest.mock import Mock
import pytest

from src.infrastructure.services.chatbot.mcp.tea_database.schema_extractor import SchemaExtractor


def test_mssql_catalog_avoids_memory_grants_and_preserves_types_and_composite_keys():
    extractor = SchemaExtractor.__new__(SchemaExtractor)
    extractor.engine = MagicMock()
    extractor.engine.dialect.name = "mssql"
    connection = extractor.engine.connect.return_value.__enter__.return_value
    columns = [
        dict(object_id=1, column_id=1, name="id", user_type_id=56, max_length=4,
             precision=10, scale=0, is_nullable=False),
        dict(object_id=1, column_id=2, name="name", user_type_id=231, max_length=256,
             precision=0, scale=0, is_nullable=True),
        dict(object_id=1, column_id=3, name="description", user_type_id=231, max_length=-1,
             precision=0, scale=0, is_nullable=True),
        dict(object_id=1, column_id=4, name="price", user_type_id=106, max_length=9,
             precision=18, scale=2, is_nullable=False),
    ]
    for object_id, column_id, name in [(1, 5, "region_id"), (1, 6, "country_id"),
                                       (2, 1, "id"), (2, 2, "country_id"), (99, 1, "ignored")]:
        columns.append(dict(object_id=object_id, column_id=column_id, name=name,
                            user_type_id=56, max_length=4, precision=10, scale=0, is_nullable=False))
    foreign_keys = [
        dict(constraint_object_id=10, parent_object_id=1, parent_column_id=6,
             referenced_object_id=2, referenced_column_id=2, constraint_column_id=2),
        dict(constraint_object_id=10, parent_object_id=1, parent_column_id=5,
             referenced_object_id=2, referenced_column_id=1, constraint_column_id=1),
        dict(constraint_object_id=11, parent_object_id=99, parent_column_id=1,
             referenced_object_id=2, referenced_column_id=1, constraint_column_id=1),
    ]
    connection.execute.return_value.mappings.return_value.all.side_effect = [
        [dict(object_id=2, name="region"), dict(object_id=1, name="blend")],
        list(reversed(columns)),
        [dict(user_type_id=56, name="int"), dict(user_type_id=231, name="nvarchar"), dict(user_type_id=106, name="decimal")],
        [dict(object_id=1, index_id=1)],
        [dict(object_id=1, index_id=1, column_id=1), dict(object_id=1, index_id=2, column_id=2)],
        foreign_keys,
    ]
    schema = extractor.extract_schema()
    assert connection.execute.call_count == 6
    for call in connection.execute.call_args_list:
        sql = str(call.args[0]).upper()
        assert " JOIN " not in sql
        assert "ORDER BY" not in sql
    assert "id: INT NOT NULL PK" in schema
    assert "name: NVARCHAR(128) NULL" in schema
    assert "description: NVARCHAR(MAX) NULL" in schema
    assert "price: DECIMAL(18, 2) NOT NULL" in schema
    assert "blend.region_id, country_id → region.id, country_id" in schema
    assert "ignored" not in schema
    assert "name: NVARCHAR(128) NULL PK" not in schema
    assert schema.index("id: INT") < schema.index("name: NVARCHAR")


def test_non_mssql_databases_keep_inspector_support():
    from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine

    engine = create_engine("sqlite://")
    table = Table("blend", MetaData(), Column("id", Integer, primary_key=True), Column("name", String(30)))
    table.metadata.create_all(engine)
    try:
        extractor = SchemaExtractor(engine)
        assert "TABLE: blend" in extractor.extract_schema()
        assert extractor.get_table_columns("blend") == ["id", "name"]
    finally:
        engine.dispose()


def test_transient_schema_failure_is_retried_instead_of_cached(monkeypatch):
    import src.infrastructure.services.chatbot.mcp.tea_database.server as module

    monkeypatch.setattr(module, "_schema_cache", None)
    monkeypatch.setattr(module, "_ensure_schema_initialized", lambda: True)
    extract = Mock(side_effect=["Error extracting schema: SQL timeout", "TABLE: blend\n  id: INT NOT NULL PK"])
    monkeypatch.setattr(module.schema_extractor, "extract_schema", extract)
    with pytest.raises(RuntimeError, match="temporarily unavailable"):
        module.get_schema()
    assert module._schema_cache is None
    assert module.get_schema().startswith("TABLE: blend")
    assert module.get_schema().startswith("TABLE: blend")
    assert extract.call_count == 2
