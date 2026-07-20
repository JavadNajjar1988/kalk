"""add tile_roots table for admin-managed tile folder paths

Revision ID: 0015_add_tile_roots_table
Revises: 0014_add_resources_tables
Create Date: 2026-04-28
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0015_add_tile_roots_table"
down_revision = "0014_add_resources_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tile_roots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("path", sa.String(length=1000), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tile_roots_path", "tile_roots", ["path"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_tile_roots_path", table_name="tile_roots")
    op.drop_table("tile_roots")
