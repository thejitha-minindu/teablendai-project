"""Verify shared connection reuse and bounded SQL execution without a real RDS."""
from types import SimpleNamespace
from unittest.mock import Mock

from src.infrastructure.database import engine as module


def test_engine_uses_configured_limits_and_query_timeout(monkeypatch):
    configured = SimpleNamespace(DATABASE_POOL_SIZE=3, DATABASE_MAX_OVERFLOW=2,
                                 DATABASE_POOL_TIMEOUT=5, DATABASE_POOL_RECYCLE=1800,
                                 DATABASE_CONNECT_TIMEOUT_SECONDS=10, DATABASE_QUERY_TIMEOUT_SECONDS=15)
    fake_engine = Mock()
    fake_engine.dialect.name = "mssql"
    fake_engine.dialect.driver = "pyodbc"
    factory = Mock(return_value=fake_engine)
    listeners = []
    monkeypatch.setattr(module, "get_settings", lambda: configured)
    monkeypatch.setattr(module, "get_mssql_connection_string", lambda: "mssql+pyodbc://test")
    monkeypatch.setattr(module, "create_engine", factory)
    monkeypatch.setattr(module.event, "listens_for", lambda *args: lambda function: listeners.append(function) or function)
    assert module.get_database_engine.__wrapped__() is fake_engine
    factory.assert_called_once_with("mssql+pyodbc://test", pool_size=3, max_overflow=2,
                                    pool_timeout=5, pool_recycle=1800, pool_pre_ping=True,
                                    connect_args={"timeout": 10}, implicit_returning=False, echo=False)
    connection = SimpleNamespace(timeout=0)
    fake_engine.dialect.loaded_dbapi.connect.return_value = connection
    assert listeners[0](fake_engine.dialect, None, ["test-dsn"], {"timeout": 10}) is connection
    fake_engine.dialect.loaded_dbapi.connect.assert_called_once_with("test-dsn", timeout=10)
    assert connection.timeout == 15


def test_api_database_modules_share_one_pool():
    from src.infrastructure.database import base, connection

    assert base.engine is connection.engine
    assert base.engine is module.get_database_engine()
