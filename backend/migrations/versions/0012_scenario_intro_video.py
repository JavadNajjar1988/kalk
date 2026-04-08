"""scenario intro video fields and per-user intro views

Revision ID: 0012_scenario_intro_video
Revises: 0011_extend_scenario_id_length
Create Date: 2026-04-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0012_scenario_intro_video"
down_revision = "0011_extend_scenario_id_length"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "scenarios",
        sa.Column("intro_video_url", sa.String(length=2000), nullable=True),
    )
    op.add_column(
        "scenarios",
        sa.Column("intro_title", sa.String(length=300), nullable=True),
    )
    op.add_column(
        "scenarios",
        sa.Column("intro_summary", sa.Text(), nullable=True),
    )
    op.create_table(
        "scenario_intro_views",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("scenario_id", sa.String(length=128), nullable=False),
        sa.Column("seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("never_show_again", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["scenario_id"], ["scenarios.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "scenario_id", name="uq_scenario_intro_user_scenario"),
    )
    op.create_index(
        op.f("ix_scenario_intro_views_scenario_id"),
        "scenario_intro_views",
        ["scenario_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_scenario_intro_views_user_id"),
        "scenario_intro_views",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_scenario_intro_views_user_id"), table_name="scenario_intro_views")
    op.drop_index(op.f("ix_scenario_intro_views_scenario_id"), table_name="scenario_intro_views")
    op.drop_table("scenario_intro_views")
    op.drop_column("scenarios", "intro_summary")
    op.drop_column("scenarios", "intro_title")
    op.drop_column("scenarios", "intro_video_url")
