from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_add_sdi_tables'
down_revision = '0004_add_storage_type'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'sdi_servers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('base_url', sa.String(length=512), nullable=False),
        sa.Column('service_types', sa.JSON(), nullable=False),
        sa.Column('auth_type', sa.String(length=32), nullable=False, server_default='none'),
        sa.Column('auth_config', sa.JSON(), nullable=True),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'sdi_maps',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('sdi_servers.id'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_type', sa.String(length=64), nullable=False),
        sa.Column('url_or_path', sa.String(length=1024), nullable=False),
        sa.Column('layer_name', sa.String(length=512), nullable=True),
        sa.Column('format', sa.String(length=32), nullable=True),
        sa.Column('srs', sa.String(length=64), nullable=True),
        sa.Column('minzoom', sa.Integer(), nullable=True),
        sa.Column('maxzoom', sa.Integer(), nullable=True),
        sa.Column('bbox', sa.JSON(), nullable=True),
        sa.Column('version', sa.String(length=64), nullable=True),
        sa.Column('hash', sa.String(length=128), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='draft'),
        sa.Column('roles', sa.JSON(), nullable=True),
        sa.Column('category', sa.String(length=128), nullable=True),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'sdi_jobs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('type', sa.String(length=32), nullable=False),
        sa.Column('server_id', sa.Integer(), sa.ForeignKey('sdi_servers.id'), nullable=True),
        sa.Column('map_ids', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='running'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('logs', sa.JSON(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
    )

    # helpful composite uniqueness to reduce duplicate maps
    op.create_index(
        'uq_sdi_maps_server_layer',
        'sdi_maps',
        ['server_id', 'source_type', 'layer_name'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('uq_sdi_maps_server_layer', table_name='sdi_maps')
    op.drop_table('sdi_jobs')
    op.drop_table('sdi_maps')
    op.drop_table('sdi_servers')

