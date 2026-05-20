import uuid
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

class LMSDataCache(Base, TimestampMixin):
    __tablename__ = "lms_data_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_id: Mapped[str] = mapped_column(String, nullable=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    # fetched_at is handled by created_at/updated_at from TimestampMixin

    @property
    def raw_data(self) -> dict:
        return self.data

    @raw_data.setter
    def raw_data(self, value: dict):
        self.data = value

    @property
    def last_updated(self):
        return self.created_at

    @last_updated.setter
    def last_updated(self, value):
        self.created_at = value
