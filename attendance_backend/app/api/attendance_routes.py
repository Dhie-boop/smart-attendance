from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.services.attendance_service import (
    get_session_report,
    get_student_attendance,
    list_report_sessions,
    scan_attendance,
)
from app.services.auth_service import get_current_user, require_role
from schemas.attendance_schema import (
    AttendanceRecordResponse,
    AttendanceScanRequest,
    AttendanceScanResponse,
    SessionReportSummaryResponse,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/sessions", response_model=list[SessionReportSummaryResponse])
def report_sessions(
    include_active: bool = Query(True),
    include_ended: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer", "admin")),
) -> list:
    """List sessions with attendance summary counts (lecturer/admin only)."""
    return list_report_sessions(
        db=db,
        current_user=current_user,
        include_active=include_active,
        include_ended=include_ended,
        skip=skip,
        limit=limit,
    )


@router.post("/scan", response_model=AttendanceScanResponse)
def scan(
    data: AttendanceScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
) -> AttendanceScanResponse:
    """Student scans QR code to record attendance."""
    record = scan_attendance(
        db=db,
        student_id=current_user.id,
        session_token=data.session_token,
        student_number=data.student_number,
        device_id=data.device_id,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    return AttendanceScanResponse(
        success=True,
        message="Attendance recorded successfully",
        attendance_id=record.id,
        timestamp=record.timestamp,
    )


@router.get("/report", response_model=list[AttendanceRecordResponse])
def attendance_report(
    session_id: UUID = Query(..., description="Session UUID to report on"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("lecturer", "admin")),
) -> list:
    """Get attendance records for a specific session (lecturer/admin only)."""
    return get_session_report(db, session_id, skip=skip, limit=limit)


@router.get("/student/{student_id}", response_model=list[AttendanceRecordResponse])
def student_history(
    student_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    """Get a student's attendance history. Students can only view their own records."""
    if current_user.role == "student" and str(current_user.id) != str(student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own attendance history",
        )
    return get_student_attendance(db, student_id, skip=skip, limit=limit)
