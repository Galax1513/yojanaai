"""evolve scheme schema: eligibility rules, versions, sync runs, data sources

Revision ID: 89c5708dd697
Revises: 7f2bd25fd6e2
Create Date: 2026-09-19 17:53:23.301111

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89c5708dd697'
down_revision: Union[str, None] = '7f2bd25fd6e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- 1. Convert schemes.id and required_documents.scheme_id from
    # VARCHAR to UUID FIRST, before any new table references schemes.id
    # as a foreign key. Both tables are empty at this point in the
    # project's history, but this is still done the way any Postgres
    # deployment would need to: drop the dependent FK, change both
    # column types with an explicit USING cast (Postgres has no
    # automatic VARCHAR->UUID cast for ALTER COLUMN TYPE), then recreate
    # the FK.
    op.drop_constraint("required_documents_scheme_id_fkey", "required_documents", type_="foreignkey")
    op.alter_column(
        "schemes",
        "id",
        existing_type=sa.VARCHAR(length=80),
        type_=sa.UUID(),
        postgresql_using="id::uuid",
        existing_nullable=False,
    )
    op.alter_column(
        "required_documents",
        "scheme_id",
        existing_type=sa.VARCHAR(length=80),
        type_=sa.UUID(),
        postgresql_using="scheme_id::uuid",
        existing_nullable=False,
    )
    op.create_foreign_key(
        "required_documents_scheme_id_fkey",
        "required_documents",
        "schemes",
        ["scheme_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --- 2. New reference/audit tables ---
    op.create_table('data_source_registry',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('key', sa.String(length=100), nullable=False),
    sa.Column('provider_name', sa.String(length=200), nullable=False),
    sa.Column('dataset_name', sa.String(length=200), nullable=False),
    sa.Column('license', sa.String(length=200), nullable=True),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('collected_at', sa.Date(), nullable=True),
    sa.Column('attribution', sa.Text(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('is_official_government_source', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key')
    )
    op.create_table('scheme_sync_runs',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('data_source_id', sa.Integer(), nullable=False),
    sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.Enum('running', 'completed', 'failed', 'partial', name='syncrunstatus', native_enum=False), nullable=False),
    sa.Column('records_seen', sa.Integer(), nullable=False),
    sa.Column('records_created', sa.Integer(), nullable=False),
    sa.Column('records_updated', sa.Integer(), nullable=False),
    sa.Column('records_unchanged', sa.Integer(), nullable=False),
    sa.Column('records_deactivated', sa.Integer(), nullable=False),
    sa.Column('records_failed', sa.Integer(), nullable=False),
    sa.Column('error_summary', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['data_source_id'], ['data_source_registry.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )

    # --- 3. New scheme-related tables (schemes.id is already UUID now) ---
    op.create_table('eligibility_rules',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('scheme_id', sa.UUID(), nullable=False),
    sa.Column('rule_type', sa.Enum('structured', 'text_review', name='ruletype', native_enum=False), nullable=False),
    sa.Column('field', sa.String(length=100), nullable=True),
    sa.Column('operator', sa.Enum('>=', '<=', '>', '<', '=', '!=', 'in', 'not_in', name='ruleoperator', native_enum=False), nullable=True),
    sa.Column('value', sa.JSON(), nullable=True),
    sa.Column('raw_text', sa.Text(), nullable=True),
    sa.Column('scope', sa.Enum('national', 'state', 'district', name='rulescope', native_enum=False), nullable=False),
    sa.Column('scope_value', sa.String(length=150), nullable=True),
    sa.Column('source_reference', sa.String(length=300), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("(rule_type = 'structured' AND field IS NOT NULL AND operator IS NOT NULL AND value IS NOT NULL) OR (rule_type = 'text_review' AND raw_text IS NOT NULL)", name='ck_eligibility_rules_shape_matches_type'),
    sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_eligibility_rules_field', 'eligibility_rules', ['field'], unique=False)
    op.create_index('ix_eligibility_rules_scheme_id', 'eligibility_rules', ['scheme_id'], unique=False)
    op.create_table('scheme_versions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('scheme_id', sa.UUID(), nullable=False),
    sa.Column('version_number', sa.Integer(), nullable=False),
    sa.Column('snapshot', sa.JSON(), nullable=False),
    sa.Column('source_updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('captured_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('content_hash', sa.String(length=64), nullable=False),
    sa.ForeignKeyConstraint(['scheme_id'], ['schemes.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('scheme_id', 'version_number', name='uq_scheme_versions_scheme_version')
    )

    # --- 4. New columns on schemes ---
    op.add_column('schemes', sa.Column('source_id', sa.String(length=200), nullable=True))
    op.add_column('schemes', sa.Column('slug', sa.String(length=160), nullable=False))
    op.add_column('schemes', sa.Column('short_title', sa.String(length=150), nullable=True))
    op.add_column('schemes', sa.Column('level', sa.Enum('central', 'state', name='schemelevel', native_enum=False), nullable=True))
    op.add_column('schemes', sa.Column('ministry', sa.String(length=200), nullable=True))
    op.add_column('schemes', sa.Column('department', sa.String(length=200), nullable=True))
    op.add_column('schemes', sa.Column('state', sa.String(length=100), nullable=True))
    op.add_column('schemes', sa.Column('categories', sa.JSON(), nullable=True))
    op.add_column('schemes', sa.Column('tags', sa.JSON(), nullable=True))
    op.add_column('schemes', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('schemes', sa.Column('benefits', sa.Text(), nullable=True))
    op.add_column('schemes', sa.Column('documents_required_raw', sa.Text(), nullable=True))
    op.add_column('schemes', sa.Column('official_application_url', sa.String(length=500), nullable=True))
    op.add_column('schemes', sa.Column('source_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('schemes', sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('schemes', sa.Column('last_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('schemes', sa.Column('status', sa.Enum('active', 'inactive', 'deprecated', name='schemestatus', native_enum=False), nullable=False, server_default='active'))
    op.add_column('schemes', sa.Column('content_hash', sa.String(length=64), nullable=True))
    op.add_column('schemes', sa.Column('data_source_id', sa.Integer(), nullable=True))
    op.alter_column('schemes', 'official_source_url',
               existing_type=sa.VARCHAR(length=500),
               nullable=True)
    op.alter_column('schemes', 'official_source_label',
               existing_type=sa.VARCHAR(length=200),
               nullable=True)
    op.create_index('ix_schemes_category', 'schemes', ['category'], unique=False)
    op.create_index('ix_schemes_content_hash', 'schemes', ['content_hash'], unique=False)
    op.create_index('ix_schemes_level', 'schemes', ['level'], unique=False)
    op.create_index('ix_schemes_ministry', 'schemes', ['ministry'], unique=False)
    op.create_index('ix_schemes_name', 'schemes', ['name'], unique=False)
    op.create_index('ix_schemes_state', 'schemes', ['state'], unique=False)
    op.create_index('ix_schemes_status', 'schemes', ['status'], unique=False)
    op.create_unique_constraint('uq_schemes_source_identity', 'schemes', ['data_source_id', 'source_id'])
    op.create_unique_constraint('uq_schemes_slug', 'schemes', ['slug'])
    op.create_foreign_key('fk_schemes_data_source_id', 'schemes', 'data_source_registry', ['data_source_id'], ['id'], ondelete='SET NULL')
    op.drop_column('schemes', 'state_scope')
    op.drop_column('schemes', 'last_verified')
    # status had a server_default only to backfill any existing rows
    # safely; new inserts should rely on the ORM model's default instead.
    op.alter_column('schemes', 'status', server_default=None)


def downgrade() -> None:
    op.add_column('schemes', sa.Column('last_verified', sa.DATE(), autoincrement=False, nullable=False))
    op.add_column('schemes', sa.Column('state_scope', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
    op.drop_constraint('fk_schemes_data_source_id', 'schemes', type_='foreignkey')
    op.drop_constraint('uq_schemes_slug', 'schemes', type_='unique')
    op.drop_constraint('uq_schemes_source_identity', 'schemes', type_='unique')
    op.drop_index('ix_schemes_status', table_name='schemes')
    op.drop_index('ix_schemes_state', table_name='schemes')
    op.drop_index('ix_schemes_name', table_name='schemes')
    op.drop_index('ix_schemes_ministry', table_name='schemes')
    op.drop_index('ix_schemes_level', table_name='schemes')
    op.drop_index('ix_schemes_content_hash', table_name='schemes')
    op.drop_index('ix_schemes_category', table_name='schemes')
    op.alter_column('schemes', 'official_source_label',
               existing_type=sa.VARCHAR(length=200),
               nullable=False)
    op.alter_column('schemes', 'official_source_url',
               existing_type=sa.VARCHAR(length=500),
               nullable=False)
    op.drop_column('schemes', 'data_source_id')
    op.drop_column('schemes', 'content_hash')
    op.drop_column('schemes', 'status')
    op.drop_column('schemes', 'last_verified_at')
    op.drop_column('schemes', 'last_synced_at')
    op.drop_column('schemes', 'source_updated_at')
    op.drop_column('schemes', 'official_application_url')
    op.drop_column('schemes', 'documents_required_raw')
    op.drop_column('schemes', 'benefits')
    op.drop_column('schemes', 'description')
    op.drop_column('schemes', 'tags')
    op.drop_column('schemes', 'categories')
    op.drop_column('schemes', 'state')
    op.drop_column('schemes', 'department')
    op.drop_column('schemes', 'ministry')
    op.drop_column('schemes', 'level')
    op.drop_column('schemes', 'short_title')
    op.drop_column('schemes', 'slug')
    op.drop_column('schemes', 'source_id')

    op.drop_table('scheme_versions')
    op.drop_index('ix_eligibility_rules_scheme_id', table_name='eligibility_rules')
    op.drop_index('ix_eligibility_rules_field', table_name='eligibility_rules')
    op.drop_table('eligibility_rules')
    op.drop_table('scheme_sync_runs')
    op.drop_table('data_source_registry')

    op.drop_constraint("required_documents_scheme_id_fkey", "required_documents", type_="foreignkey")
    op.alter_column('schemes', 'id',
               existing_type=sa.UUID(),
               type_=sa.VARCHAR(length=80),
               postgresql_using="id::text",
               existing_nullable=False)
    op.alter_column('required_documents', 'scheme_id',
               existing_type=sa.UUID(),
               type_=sa.VARCHAR(length=80),
               postgresql_using="scheme_id::text",
               existing_nullable=False)
    op.create_foreign_key(
        "required_documents_scheme_id_fkey",
        "required_documents",
        "schemes",
        ["scheme_id"],
        ["id"],
        ondelete="CASCADE",
    )
