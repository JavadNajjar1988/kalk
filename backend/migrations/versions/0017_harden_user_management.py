"""harden user management lifecycle and auditing

Revision ID: 0017_harden_user_management
Revises: 0016_add_notifications
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0017_harden_user_management"
down_revision = "0016_add_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("version", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_deleted_at", "users", ["deleted_at"])

    op.create_table(
        "user_audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("target_user_id", sa.String(length=36), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("actor_username", sa.String(length=150), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("before_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after_state", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("client_ip", sa.String(length=64), nullable=True),
        sa.Column("request_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_audit_logs_target_user_id", "user_audit_logs", ["target_user_id"])
    op.create_index("ix_user_audit_logs_actor_user_id", "user_audit_logs", ["actor_user_id"])
    op.create_index("ix_user_audit_logs_action", "user_audit_logs", ["action"])
    op.create_index("ix_user_audit_logs_request_id", "user_audit_logs", ["request_id"])


def downgrade() -> None:
    op.drop_index("ix_user_audit_logs_request_id", table_name="user_audit_logs")
    op.drop_index("ix_user_audit_logs_action", table_name="user_audit_logs")
    op.drop_index("ix_user_audit_logs_actor_user_id", table_name="user_audit_logs")
    op.drop_index("ix_user_audit_logs_target_user_id", table_name="user_audit_logs")
    op.drop_table("user_audit_logs")
    op.drop_index("ix_users_deleted_at", table_name="users")
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "version")
    op.drop_column("users", "token_version")
