
from logging.config import fileConfig
import os
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from src.infrastructure.database.base import Base
from src.domain.models.bid import Bid
from src.domain.models.auction import Auction
from src.domain.models.order import Order, PaymentDetails, WinsAuction
from src.domain.models.user import User
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config


# Build database URL from component environment variables
def build_database_url():
    server = os.getenv('MSSQL_SERVER')
    database = os.getenv('MSSQL_DATABASE')
    username = os.getenv('MSSQL_USERNAME') or ''
    password = os.getenv('MSSQL_PASSWORD') or ''
    trusted_env = os.getenv('DB_TRUSTED_CONNECTION')
    if trusted_env is None:
        trusted_env = os.getenv('MSSQL_TRUSTED_CONNECTION')
    trusted = False if trusted_env is None else str(trusted_env).lower() in ('1','true','yes','y')
    driver = "ODBC Driver 17 for SQL Server"
    if trusted or (not username and not password):
        url = (
            f"mssql+pyodbc://{server}/{database}"
            f"?driver={driver.replace(' ', '+')}"
            f"&trusted_connection=yes"
            f"&TrustServerCertificate=yes"
        )
    else:
        url = (
            f"mssql+pyodbc://{username}:{password}@{server}/{database}"
            f"?driver={driver.replace(' ', '+')}"
            f"&TrustServerCertificate=yes"
        )
    return url

# Set sqlalchemy.url from built URL
config.set_main_option("sqlalchemy.url", build_database_url())

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
