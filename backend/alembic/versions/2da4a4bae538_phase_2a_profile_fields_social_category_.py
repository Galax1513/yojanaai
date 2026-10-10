"""phase 2A profile fields: social_category rename, bpl_status, occupation

Revision ID: 2da4a4bae538
Revises: 9ad5a191d726
Create Date: 2026-09-20 13:29:55.329844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2da4a4bae538'
down_revision: Union[str, None] = '9ad5a191d726'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_profiles', sa.Column('occupation', sa.String(length=200), nullable=True))
    op.add_column('user_profiles', sa.Column('bpl_status', sa.Enum('Yes', 'No', 'Unknown', name='bplstatus', native_enum=False), nullable=True))
    op.alter_column('user_profiles', 'area_type',
               existing_type=sa.VARCHAR(length=10),
               type_=sa.Enum('Urban', 'Rural', name='areatype', native_enum=False),
               existing_nullable=True)
    op.alter_column('user_profiles', 'disability_status',
               existing_type=sa.VARCHAR(length=16),
               type_=sa.Enum('Yes', 'No', 'Unknown', name='disabilitystatus', native_enum=False),
               existing_nullable=True)
    # True rename (category -> social_category) rather than drop+add —
    # there are zero rows either way, but this correctly documents that
    # this is a rename, not the removal of an unrelated column. Also
    # widens the column: the old enum's longest value was "General" (7
    # chars); the new enum's longest is "Prefer not to say" (18 chars).
    op.alter_column('user_profiles', 'category',
               new_column_name='social_category',
               existing_type=sa.VARCHAR(length=7),
               type_=sa.Enum('General', 'OBC', 'SC', 'ST', 'EWS', 'Other', 'Prefer not to say', name='socialcategory', native_enum=False),
               existing_nullable=True)
    op.create_check_constraint(
        'ck_user_profiles_occupation_not_blank',
        'user_profiles',
        "occupation IS NULL OR trim(occupation) <> ''",
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_constraint('ck_user_profiles_occupation_not_blank', 'user_profiles', type_='check')
    op.alter_column('user_profiles', 'social_category',
               new_column_name='category',
               existing_type=sa.Enum('General', 'OBC', 'SC', 'ST', 'EWS', 'Other', 'Prefer not to say', name='socialcategory', native_enum=False),
               type_=sa.VARCHAR(length=7),
               existing_nullable=True)
    op.alter_column('user_profiles', 'disability_status',
               existing_type=sa.Enum('Yes', 'No', 'Unknown', name='disabilitystatus', native_enum=False),
               type_=sa.VARCHAR(length=16),
               existing_nullable=True)
    op.alter_column('user_profiles', 'area_type',
               existing_type=sa.Enum('Urban', 'Rural', name='areatype', native_enum=False),
               type_=sa.VARCHAR(length=10),
               existing_nullable=True)
    op.drop_column('user_profiles', 'bpl_status')
    op.drop_column('user_profiles', 'occupation')
    # ### end Alembic commands ###