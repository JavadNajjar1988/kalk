"""add security fields to users table

Revision ID: 0008_add_security_fields
Revises: 0007_create_default_admin_user
Create Date: 2026-01-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0008_add_security_fields"
down_revision = "0007_create_default_admin_user"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("failed_login_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("last_login_attempt", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "last_login_attempt")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_count")

