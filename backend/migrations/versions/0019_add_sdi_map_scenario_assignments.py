"""add scenario assignments to SDI maps

Revision ID: 0019_sdi_scenario_ids
Revises: 0018_add_scenario_schedule
"""

from alembic import op
import sqlalchemy as sa


revision = "0019_sdi_scenario_ids"
down_revision = "0018_add_scenario_schedule"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sdi_maps",
        sa.Column("scenario_ids", sa.JSON(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("sdi_maps", "scenario_ids")
