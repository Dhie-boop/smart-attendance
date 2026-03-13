from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class CourseCreate(BaseModel):
    code: str
    name: str


class CourseResponse(BaseModel):
    id: UUID
    code: str
    name: str
    lecturer_id: Optional[UUID]
    lecturer_name: Optional[str] = None
    enrolled_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class EnrollmentCreate(BaseModel):
    student_id: UUID
    # course_id is taken from the URL path; include here only for client convenience
    course_id: Optional[UUID] = None


class EnrollmentResponse(BaseModel):
    id: UUID
    student_id: UUID
    course_id: UUID
    enrolled_at: datetime

    model_config = {"from_attributes": True}


class StudentCourseResponse(BaseModel):
    """A course as seen from the student dashboard — includes attendance stats."""

    id: UUID
    code: str
    name: str
    lecturer_name: Optional[str] = None
    total_sessions: int = 0
    present_count: int = 0
    late_count: int = 0
    absent_count: int = 0
