"""archive field on scenarios + audit log table

Revision ID: 0013_archive_and_audit_log
Revises: 0012_scenario_intro_video
Create Date: 2026-04-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0013_archive_and_audit_log"
down_revision = "0012_scenario_intro_video"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "scenarios",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "scenario_audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("scenario_id", sa.String(length=128), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("payload_diff", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["scenario_id"], ["scenarios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_scenario_audit_logs_scenario_id"),
        "scenario_audit_logs",
        ["scenario_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_scenario_audit_logs_scenario_id"), table_name="scenario_audit_logs")
    op.drop_table("scenario_audit_logs")
    op.drop_column("scenarios", "archived_at")
