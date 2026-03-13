import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("student_id", "session_id", name="uq_attendance_student_session"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    device_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("present", "late", "absent", name="attendance_status"),
        default="present",
        nullable=False,
    )

    # Relationships
    student = relationship("User", back_populates="attendance_records", foreign_keys=[student_id])
    session = relationship("Session", back_populates="attendance_records")

    @property
    def student_name(self) -> str | None:
        """Full name of the student who scanned."""
        return self.student.full_name if self.student else None

    @property
    def student_number(self) -> str | None:
        """Student registration number from the Student profile."""
        if self.student and self.student.student_profile:
            return self.student.student_profile.student_number
        return None

    @property
    def course_code(self) -> str | None:
        """Course code from the session's course."""
        if self.session and self.session.course:
            return self.session.course.code
        return None

    @property
    def course_name(self) -> str | None:
        """Course name from the session's course."""
        if self.session and self.session.course:
            return self.session.course.name
        return None
