from __future__ import annotations

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

import os
import sys

# Ensure backend root is on sys.path so that 'app' package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.abspath(os.path.join(current_dir, os.pardir))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.db.base import Base
from app.models import dashboard_header, scenario, scenario_audit_log, scenario_intro_view, user, user_audit_log, map, sdi, resource, notification  # noqa: F401
from app.core.config import settings


config = context.config

# Override sqlalchemy.url from runtime settings so migrations work
# both in Docker (service name 'db') and local (localhost) setups.
try:
    config.set_main_option("sqlalchemy.url", settings.DB_URL)
except Exception:
    pass

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())


