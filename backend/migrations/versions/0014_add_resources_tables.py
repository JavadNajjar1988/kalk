"""add resources and resource_media tables

Revision ID: 0014_add_resources_tables
Revises: 0013_archive_and_audit_log
Create Date: 2026-04-26
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "0014_add_resources_tables"
down_revision = "0013_archive_and_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resources",
        sa.Column("id", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("code", sa.String(length=128), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index(op.f("ix_resources_type"), "resources", ["type"], unique=False)
    op.create_index(op.f("ix_resources_code"), "resources", ["code"], unique=False)
    op.create_index(op.f("ix_resources_name"), "resources", ["name"], unique=False)
    op.create_index(op.f("ix_resources_status"), "resources", ["status"], unique=False)

    op.create_table(
        "resource_media",
        sa.Column("id", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=True),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("content_type", sa.String(length=128), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("caption", sa.String(length=500), nullable=True),
        sa.Column("credits", sa.String(length=255), nullable=True),
        sa.Column("credits_url", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["resource_id"], ["resources.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_resource_media_resource_id"),
        "resource_media",
        ["resource_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_resource_media_resource_id"), table_name="resource_media")
    op.drop_table("resource_media")
    op.drop_index(op.f("ix_resources_status"), table_name="resources")
    op.drop_index(op.f("ix_resources_name"), table_name="resources")
    op.drop_index(op.f("ix_resources_code"), table_name="resources")
    op.drop_index(op.f("ix_resources_type"), table_name="resources")
    op.drop_table("resources")
