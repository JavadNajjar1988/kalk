"""add dashboard header tables

Revision ID: 0010_add_dashboard_header_tables
Revises: 0009_roles_three_levels
Create Date: 2026-02-28 10:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_add_dashboard_header_tables"
down_revision = "0009_roles_three_levels"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dashboard_header_entries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("quote_text", sa.Text(), nullable=False),
        sa.Column("person_name", sa.String(length=255), nullable=False),
        sa.Column("person_position", sa.String(length=255), nullable=False),
        sa.Column("person_image", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "dashboard_header_configs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("active_entry_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["active_entry_id"], ["dashboard_header_entries.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.execute(
        sa.text(
            """
            INSERT INTO dashboard_header_configs (id, enabled)
            VALUES (1, true)
            """
        )
    )


def downgrade() -> None:
    op.drop_table("dashboard_header_configs")
    op.drop_table("dashboard_header_entries")
