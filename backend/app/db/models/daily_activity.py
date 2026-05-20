import uuid
import datetime
from sqlalchemy import Date, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

class DailyActivity(Base, TimestampMixin):
    __tablename__ = "daily_activity"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    was_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    courses_accessed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
    )
