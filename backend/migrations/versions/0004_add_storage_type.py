"""add storage_type to offline maps

Revision ID: 0004_add_storage_type
Revises: 0003_add_offline_maps_table
Create Date: 2025-01-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0004_add_storage_type'
down_revision = '0003_add_offline_maps_table'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'offline_maps',
        sa.Column('storage_type', sa.String(length=32), nullable=False, server_default='mbtiles'),
    )
    op.execute("UPDATE offline_maps SET storage_type = 'mbtiles' WHERE storage_type IS NULL")
    op.alter_column('offline_maps', 'storage_type', server_default=None)


def downgrade():
    op.drop_column('offline_maps', 'storage_type')
