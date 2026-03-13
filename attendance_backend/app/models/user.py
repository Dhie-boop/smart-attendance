import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(Enum("admin", "lecturer", "student", name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False)
    courses_taught = relationship("Course", back_populates="lecturer", foreign_keys="Course.lecturer_id")
    sessions_created = relationship("Session", back_populates="lecturer", foreign_keys="Session.lecturer_id")
    attendance_records = relationship("AttendanceRecord", back_populates="student", foreign_keys="AttendanceRecord.student_id")
    enrollments = relationship("Enrollment", back_populates="student", foreign_keys="Enrollment.student_id")

    @property
    def student_id(self) -> str | None:
        """Returns the student_number from the linked Student profile (students only)."""
        if self.student_profile:
            return self.student_profile.student_number
        return None
