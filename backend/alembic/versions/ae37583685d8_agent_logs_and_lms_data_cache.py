"""agent_logs_and_lms_data_cache

Revision ID: ae37583685d8
Revises: 
Create Date: 2026-04-21 15:58:45.915634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = 'ae37583685d8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create lms_data_cache
    op.create_table('lms_data_cache',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('course_id', sa.String(), nullable=False),
    sa.Column('data', sa.JSON(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_lms_data_cache_user_id'), 'lms_data_cache', ['user_id'], unique=False)

    # 2. Add columns to agent_logs
    with op.batch_alter_table('agent_logs') as batch_op:
        batch_op.add_column(sa.Column('priority', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('message_id', sa.UUID(), nullable=True))
        batch_op.create_foreign_key('fk_agent_logs_message_id_coach_messages', 'coach_messages', ['message_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    with op.batch_alter_table('agent_logs') as batch_op:
        batch_op.drop_constraint('fk_agent_logs_message_id_coach_messages', type_='foreignkey')
        batch_op.drop_column('message_id')
        batch_op.drop_column('priority')

    op.drop_index(op.f('ix_lms_data_cache_user_id'), table_name='lms_data_cache')
    op.drop_table('lms_data_cache')
