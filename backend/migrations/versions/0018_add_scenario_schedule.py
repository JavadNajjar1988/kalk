"""add normalized scenario schedule

Revision ID: 0018_add_scenario_schedule
Revises: 0017_harden_user_management
"""

from alembic import op
import sqlalchemy as sa


revision = "0018_add_scenario_schedule"
down_revision = "0017_harden_user_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scenarios", sa.Column("start_time", sa.DateTime(timezone=True), nullable=True))
    op.add_column("scenarios", sa.Column("end_time", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_scenarios_start_time", "scenarios", ["start_time"])

    if op.get_bind().dialect.name == "postgresql":
        op.execute(
            """
            UPDATE scenarios
            SET start_time = to_timestamp((content->>'startTime')::double precision / 1000.0)
            WHERE content IS NOT NULL
              AND jsonb_typeof(content->'startTime') = 'number'
            """
        )
        op.execute(
            """
            UPDATE scenarios
            SET end_time = to_timestamp((content->>'endTime')::double precision / 1000.0)
            WHERE content IS NOT NULL
              AND jsonb_typeof(content->'endTime') = 'number'
            """
        )
        op.execute(
            """
            UPDATE scenarios
            SET start_time = (content->>'startTime')::timestamp with time zone
            WHERE start_time IS NULL
              AND content IS NOT NULL
              AND jsonb_typeof(content->'startTime') = 'string'
              AND pg_input_is_valid(content->>'startTime', 'timestamp with time zone')
            """
        )
        op.execute(
            """
            UPDATE scenarios
            SET end_time = (content->>'endTime')::timestamp with time zone
            WHERE end_time IS NULL
              AND content IS NOT NULL
              AND jsonb_typeof(content->'endTime') = 'string'
              AND pg_input_is_valid(content->>'endTime', 'timestamp with time zone')
            """
        )


def downgrade() -> None:
    op.drop_index("ix_scenarios_start_time", table_name="scenarios")
    op.drop_column("scenarios", "end_time")
    op.drop_column("scenarios", "start_time")
