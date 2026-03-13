import csv
import io
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload, Session

from app.models.attendance import AttendanceRecord
from app.models.course import Course
from app.models.course import Enrollment
from app.models.session import Session as ClassSession
from app.models.student import Student
from app.models.user import User
from app.services.qr_service import decode_qr_token
from app.core.config import settings

from app.models.session import Session as ClassSession


def scan_attendance(
    db: Session,
    student_id: UUID,
    session_token: str,
    student_number: str,
    device_id: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
) -> AttendanceRecord:
    """Validate QR token and record attendance for a student."""
    # Step 1: Decode and validate token
    payload = decode_qr_token(session_token)
    session_id_str: str = payload.get("session_id", "")

    try:
        session_uuid = UUID(session_id_str)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid QR token payload")

    # Step 2: Load session
    session = db.query(ClassSession).filter(ClassSession.id == session_uuid).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Step 3: Verify session is active
    if not session.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is no longer active")

    # Step 4: Verify session not expired (belt-and-suspenders beyond JWT exp)
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session QR code has expired")

    # Step 5: Verify provided student number matches authenticated student profile
    profile = db.query(Student).filter(Student.user_id == student_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student profile not found")

    normalized_db_id = profile.student_number.strip().lower()
    normalized_input_id = student_number.strip().lower()
    if normalized_db_id != normalized_input_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Entered student ID does not match your registered student ID",
        )

    # Step 6: Verify student is enrolled in the course
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id, Enrollment.course_id == session.course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course",
        )

    # Step 7: Determine present vs late based on how long after session start
    now = datetime.now(timezone.utc)
    started_at = session.started_at
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    elapsed = (now - started_at).total_seconds()
    scan_status = "late" if elapsed > settings.LATE_THRESHOLD_SECONDS else "present"

    # Step 8: Update existing absent seed row, otherwise reject duplicate present/late rows
    existing = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == student_id, AttendanceRecord.session_id == session_uuid)
        .first()
    )
    if existing:
        if existing.status in {"present", "late"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Attendance already recorded for this session",
            )

        existing.status = scan_status
        existing.timestamp = now
        existing.device_id = device_id
        existing.latitude = latitude
        existing.longitude = longitude
        db.commit()
        db.refresh(existing)
        return existing

    # Step 9: Backward-compatible insert for sessions without pre-seeded absent rows
    record = AttendanceRecord(
        student_id=student_id,
        session_id=session.id,
        device_id=device_id,
        latitude=latitude,
        longitude=longitude,
        status=scan_status,
    )
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already recorded for this session",
        )
    return record


def get_student_attendance(
    db: Session,
    student_id: UUID,
    skip: int = 0,
    limit: int = 50,
) -> list[AttendanceRecord]:
    return (
        db.query(AttendanceRecord)
        .options(
            joinedload(AttendanceRecord.student).joinedload(User.student_profile),
            joinedload(AttendanceRecord.session).joinedload(ClassSession.course),
        )
        .filter(AttendanceRecord.student_id == student_id)
        .order_by(AttendanceRecord.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_session_report(
    db: Session,
    session_id: UUID,
    skip: int = 0,
    limit: int = 50,
) -> list[AttendanceRecord]:
    return (
        db.query(AttendanceRecord)
        .options(joinedload(AttendanceRecord.student).joinedload(User.student_profile))
        .filter(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.timestamp.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_report_csv(db: Session, session_id: UUID) -> str:
    """Return attendance for a session as a CSV string."""
    records = (
        db.query(AttendanceRecord)
        .options(joinedload(AttendanceRecord.student).joinedload(User.student_profile))
        .filter(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.timestamp.asc())
        .all()
    )
    output = io.StringIO()
    fieldnames = ["id", "student_id", "session_id", "timestamp", "status", "device_id", "latitude", "longitude"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for r in records:
        writer.writerow({
            "id": str(r.id),
            "student_id": str(r.student_id),
            "session_id": str(r.session_id),
            "timestamp": r.timestamp.isoformat(),
            "status": r.status,
            "device_id": r.device_id or "",
            "latitude": r.latitude if r.latitude is not None else "",
            "longitude": r.longitude if r.longitude is not None else "",
        })
    return output.getvalue()


def list_report_sessions(
    db: Session,
    current_user: User,
    include_active: bool = True,
    include_ended: bool = True,
    skip: int = 0,
    limit: int = 100,
) -> list[dict]:
    """Return report-ready sessions (active and/or ended) with attendance aggregates."""
    query = (
        db.query(ClassSession, Course, User)
        .join(Course, ClassSession.course_id == Course.id)
        .outerjoin(User, ClassSession.lecturer_id == User.id)
    )

    if current_user.role == "lecturer":
        query = query.filter(ClassSession.lecturer_id == current_user.id)

    if include_active and not include_ended:
        query = query.filter(ClassSession.is_active == True)  # noqa: E712
    elif include_ended and not include_active:
        query = query.filter(ClassSession.is_active == False)  # noqa: E712

    rows = (
        query.order_by(ClassSession.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    payload: list[dict] = []
    for session, course, lecturer in rows:
        total_students = db.query(Enrollment).filter(Enrollment.course_id == session.course_id).count()
        status_counts = dict(
            db.query(AttendanceRecord.status, func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.session_id == session.id)
            .group_by(AttendanceRecord.status)
            .all()
        )
        present_count = int(status_counts.get("present", 0))
        late_count = int(status_counts.get("late", 0))
        # Absent = enrolled students who have no present/late record.
        # For ended sessions this also includes explicit absent records;
        # for active sessions it's derived from total minus scanned.
        absent_count = max(0, total_students - present_count - late_count)

        payload.append(
            {
                "id": session.id,
                "course_id": session.course_id,
                "course_code": course.code,
                "course_name": course.name,
                "lecturer_id": session.lecturer_id,
                "lecturer_name": lecturer.full_name if lecturer else None,
                "started_at": session.started_at,
                "ended_at": session.ended_at,
                "expires_at": session.expires_at,
                "is_active": session.is_active,
                "total_students": total_students,
                "present_count": present_count,
                "late_count": late_count,
                "absent_count": absent_count,
            }
        )

    return payload
