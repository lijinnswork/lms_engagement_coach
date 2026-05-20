"""Add DailyActivity table

Revision ID: dfba86f7316d
Revises: ab65dd853e56
Create Date: 2026-05-20 11:41:04.240186

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfba86f7316d'
down_revision: Union[str, Sequence[str], None] = 'ab65dd853e56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('daily_activity',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('was_active', sa.Boolean(), nullable=False),
    sa.Column('courses_accessed', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'date', name='uq_user_date')
    )
    op.create_index(op.f('ix_daily_activity_date'), 'daily_activity', ['date'], unique=False)
    op.create_index(op.f('ix_daily_activity_user_id'), 'daily_activity', ['user_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_daily_activity_user_id'), table_name='daily_activity')
    op.drop_index(op.f('ix_daily_activity_date'), table_name='daily_activity')
    op.drop_table('daily_activity')
    # ### end Alembic commands ###
