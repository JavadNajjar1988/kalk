"""extend users table with structured profile data

Revision ID: 0006_extend_users_table
Revises: 0005_add_sdi_tables
Create Date: 2025-11-25 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0006_extend_users_table"
down_revision = "0005_add_sdi_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("user_code", sa.String(length=64), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "personal_info",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "contact_info",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "professional_info",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "system_info",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )

    op.execute(
        """
        UPDATE users
        SET
            user_code = COALESCE(user_code, 'USR-' || right(md5(random()::text), 8)),
            personal_info = COALESCE(personal_info, '{}'::jsonb),
            contact_info = COALESCE(contact_info, '{}'::jsonb),
            professional_info = COALESCE(professional_info, '{}'::jsonb),
            system_info = COALESCE(system_info, jsonb_build_object(
                'role', 'مهمان',
                'accessLevel', 'سطح 4 - دسترسی مهمان',
                'permissions', '[]'::jsonb,
                'loginCount', 0
            ))
        """
    )

    op.alter_column("users", "user_code", nullable=False)
    op.create_index("ix_users_user_code", "users", ["user_code"], unique=True)

    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("NOW()"),
    )
    op.alter_column(
        "users",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("NOW()"),
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
    )
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
    )

    op.drop_index("ix_users_user_code", table_name="users")

    op.drop_column("users", "system_info")
    op.drop_column("users", "professional_info")
    op.drop_column("users", "contact_info")
    op.drop_column("users", "personal_info")
    op.drop_column("users", "user_code")


