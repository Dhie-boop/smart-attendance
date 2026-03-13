from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AttendanceScanRequest(BaseModel):
    session_token: str
    student_number: str
    device_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AttendanceScanResponse(BaseModel):
    success: bool
    message: str
    attendance_id: Optional[UUID] = None
    timestamp: Optional[datetime] = None


class AttendanceRecordResponse(BaseModel):
    id: Optional[UUID] = None
    student_id: UUID
    session_id: UUID
    timestamp: Optional[datetime] = None
    device_id: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    # Joined fields — populated from the student's User and Student profile
    student_name: Optional[str] = None
    student_number: Optional[str] = None
    # Joined fields — populated via session → course
    course_code: Optional[str] = None
    course_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SessionReportSummaryResponse(BaseModel):
    id: UUID
    course_id: UUID
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    lecturer_id: Optional[UUID] = None
    lecturer_name: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    expires_at: datetime
    is_active: bool
    total_students: int
    present_count: int
    late_count: int
    absent_count: int
