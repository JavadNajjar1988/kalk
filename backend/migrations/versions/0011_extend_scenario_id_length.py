"""extend scenarios.id for demo- prefixed IDs

Revision ID: 0011_extend_scenario_id_length
Revises: 0010_add_dashboard_header_tables
Create Date: 2026-04-02
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0011_extend_scenario_id_length"
down_revision = "0010_add_dashboard_header_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "scenarios",
        "id",
        existing_type=sa.String(length=36),
        type_=sa.String(length=128),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "scenarios",
        "id",
        existing_type=sa.String(length=128),
        type_=sa.String(length=36),
        existing_nullable=False,
    )
