from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attendance import AttendanceRecord
from app.models.course import Course
from app.models.course import Enrollment
from app.models.session import Session as ClassSession
from app.models.session import ScheduledSession
from app.models.user import User
from app.services.auth_service import get_current_user, require_role
from app.services.qr_service import generate_qr_image_base64, generate_qr_token
from app.core.config import settings
from schemas.session_schema import (
    ScheduledSessionCreate,
    ScheduledSessionResponse,
    SessionEndResponse,
    SessionPublicResponse,
    SessionResponse,
    SessionStartRequest,
)

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    data: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer", "admin")),
) -> SessionResponse:
    """Start a class session and return a QR code image (base64 PNG)."""
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Lecturer can start their own courses; unassigned courses are auto-assigned on first start.
    if current_user.role == "lecturer":
        if course.lecturer_id and str(course.lecturer_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only start sessions for your assigned courses",
            )
        if course.lecturer_id is None:
            course.lecturer_id = current_user.id

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_DURATION_SECONDS)

    # Create session record first (with placeholder token)
    session = ClassSession(
        course_id=data.course_id,
        lecturer_id=current_user.id,
        expires_at=expires_at,
        is_active=True,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_meters=data.radius_meters,
        qr_token="",  # filled below
    )
    db.add(session)
    db.flush()  # populate session.id

    token = generate_qr_token(str(session.id), expire_seconds=settings.SESSION_DURATION_SECONDS)
    session.qr_token = token

    # NOTE: Attendance records are NOT pre-seeded here.
    # Students create their own records by scanning the QR code.
    # Absent records are created when the session ends for students who did not scan.

    db.commit()
    db.refresh(session)

    qr_b64 = generate_qr_image_base64(token)

    return SessionResponse(
        id=session.id,
        course_id=session.course_id,
        started_at=session.started_at,
        expires_at=session.expires_at,
        is_active=session.is_active,
        qr_image_base64=qr_b64,
    )


@router.post("/end/{session_id}", response_model=SessionEndResponse)
def end_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer", "admin")),
) -> ClassSession:
    """Mark a session as ended."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if not session.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is already ended")

    # Lecturers may only close their own sessions; admins can close any
    if current_user.role == "lecturer" and str(session.lecturer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot end another lecturer's session")

    session.is_active = False
    session.ended_at = datetime.now(timezone.utc)

    # Seed "absent" records for enrolled students who never scanned
    enrolled_student_ids = {
        row.student_id
        for row in db.query(Enrollment.student_id).filter(Enrollment.course_id == session.course_id).all()
    }
    scanned_student_ids = {
        row.student_id
        for row in db.query(AttendanceRecord.student_id).filter(AttendanceRecord.session_id == session.id).all()
    }
    for sid in enrolled_student_ids - scanned_student_ids:
        db.add(
            AttendanceRecord(
                student_id=sid,
                session_id=session.id,
                timestamp=session.ended_at,
                status="absent",
            )
        )

    db.commit()
    db.refresh(session)
    return session


@router.get("/active", response_model=list[SessionPublicResponse])
def list_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SessionPublicResponse]:
    """List active sessions filtered by role.

    - Student: only sessions for enrolled courses, with QR image payload for in-dashboard access.
    - Lecturer: only sessions they started.
    - Admin: all active sessions.

    Auto-closes any sessions whose QR token has expired.
    """
    # Auto-close stale sessions whose duration has expired but is_active is still True
    now = datetime.now(timezone.utc)
    stale = db.query(ClassSession).filter(
        ClassSession.is_active == True,  # noqa: E712
        ClassSession.expires_at <= now,
    ).all()
    for s in stale:
        s.is_active = False
        s.ended_at = s.expires_at
        # Seed absent records for students who never scanned
        enrolled_ids = {
            row.student_id
            for row in db.query(Enrollment.student_id).filter(Enrollment.course_id == s.course_id).all()
        }
        scanned_ids = {
            row.student_id
            for row in db.query(AttendanceRecord.student_id).filter(AttendanceRecord.session_id == s.id).all()
        }
        for sid in enrolled_ids - scanned_ids:
            db.add(
                AttendanceRecord(
                    student_id=sid,
                    session_id=s.id,
                    timestamp=s.expires_at,
                    status="absent",
                )
            )
    if stale:
        db.commit()

    query = db.query(ClassSession, Course, User).join(Course, ClassSession.course_id == Course.id).outerjoin(
        User, ClassSession.lecturer_id == User.id
    )

    if current_user.role == "student":
        query = query.join(Enrollment, Enrollment.course_id == ClassSession.course_id).filter(
            Enrollment.student_id == current_user.id
        )
        # Exclude sessions where this student already marked present/late
        attended_session_ids = (
            db.query(AttendanceRecord.session_id)
            .filter(
                AttendanceRecord.student_id == current_user.id,
                AttendanceRecord.status.in_(["present", "late"]),
            )
            .subquery()
        )
        query = query.filter(~ClassSession.id.in_(attended_session_ids))
        # Hide sessions whose QR code has expired
        query = query.filter(ClassSession.expires_at > datetime.now(timezone.utc))
    elif current_user.role == "lecturer":
        query = query.filter(ClassSession.lecturer_id == current_user.id)

    rows = (
        query.filter(ClassSession.is_active == True)  # noqa: E712
        .order_by(ClassSession.started_at.desc())
        .all()
    )

    return [
        SessionPublicResponse(
            id=session.id,
            course_id=session.course_id,
            started_at=session.started_at,
            expires_at=session.expires_at,
            is_active=session.is_active,
            course_code=course.code,
            course_name=course.name,
            lecturer_name=lecturer.full_name if lecturer else None,
            qr_image_base64=generate_qr_image_base64(session.qr_token) if current_user.role == "student" else None,
            session_token=session.qr_token if current_user.role == "student" else None,
        )
        for session, course, lecturer in rows
    ]


# ─── Scheduled Sessions ──────────────────────────────────────────────────────


@router.post("/schedule", response_model=ScheduledSessionResponse, status_code=status.HTTP_201_CREATED)
def schedule_session(
    data: ScheduledSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer")),
) -> ScheduledSessionResponse:
    """Lecturer schedules a future class session for one of their courses."""
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if course.lecturer_id and str(course.lecturer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only schedule sessions for your own courses")

    scheduled = ScheduledSession(
        course_id=data.course_id,
        lecturer_id=current_user.id,
        title=data.title,
        scheduled_date=data.scheduled_date,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
    )
    db.add(scheduled)
    db.commit()
    db.refresh(scheduled)

    return ScheduledSessionResponse(
        id=scheduled.id,
        course_id=scheduled.course_id,
        lecturer_id=scheduled.lecturer_id,
        title=scheduled.title,
        scheduled_date=scheduled.scheduled_date,
        start_time=scheduled.start_time,
        end_time=scheduled.end_time,
        location=scheduled.location,
        course_code=course.code,
        course_name=course.name,
        lecturer_name=current_user.full_name,
        created_at=scheduled.created_at,
    )


@router.get("/scheduled", response_model=list[ScheduledSessionResponse])
def list_scheduled_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ScheduledSessionResponse]:
    """List upcoming scheduled sessions.

    - Student: only for enrolled courses.
    - Lecturer: only their own scheduled sessions.
    - Admin: all scheduled sessions.
    """
    query = (
        db.query(ScheduledSession, Course, User)
        .join(Course, ScheduledSession.course_id == Course.id)
        .outerjoin(User, ScheduledSession.lecturer_id == User.id)
    )

    # Only return today and future scheduled sessions
    today = datetime.now(timezone.utc).date()
    query = query.filter(ScheduledSession.scheduled_date >= today)

    if current_user.role == "student":
        query = query.join(Enrollment, Enrollment.course_id == ScheduledSession.course_id).filter(
            Enrollment.student_id == current_user.id
        )
    elif current_user.role == "lecturer":
        query = query.filter(ScheduledSession.lecturer_id == current_user.id)

    rows = (
        query.order_by(ScheduledSession.scheduled_date.asc(), ScheduledSession.start_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        ScheduledSessionResponse(
            id=ss.id,
            course_id=ss.course_id,
            lecturer_id=ss.lecturer_id,
            title=ss.title,
            scheduled_date=ss.scheduled_date,
            start_time=ss.start_time,
            end_time=ss.end_time,
            location=ss.location,
            course_code=course.code,
            course_name=course.name,
            lecturer_name=lecturer.full_name if lecturer else None,
            created_at=ss.created_at,
        )
        for ss, course, lecturer in rows
    ]


@router.post("/scheduled/{scheduled_id}/activate", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def activate_scheduled_session(
    scheduled_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer")),
) -> SessionResponse:
    """Activate a scheduled session — starts a live attendance session and returns the QR code."""
    ss = db.query(ScheduledSession).filter(ScheduledSession.id == scheduled_id).first()
    if not ss:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled session not found")
    if str(ss.lecturer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your scheduled session")

    course = db.query(Course).filter(Course.id == ss.course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Prevent duplicate: reject if an active session already exists for this course
    existing_active = db.query(ClassSession).filter(
        ClassSession.course_id == ss.course_id,
        ClassSession.is_active == True,  # noqa: E712
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active session already exists for this course",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SESSION_DURATION_SECONDS)

    session = ClassSession(
        course_id=ss.course_id,
        lecturer_id=current_user.id,
        expires_at=expires_at,
        is_active=True,
        qr_token="",
    )
    db.add(session)
    db.flush()

    token = generate_qr_token(str(session.id), expire_seconds=settings.SESSION_DURATION_SECONDS)
    session.qr_token = token

    # NOTE: No absent pre-seeding. Students scan QR to record attendance.
    # Absent records are created when the lecturer ends the session.

    db.commit()
    db.refresh(session)

    qr_b64 = generate_qr_image_base64(token)

    return SessionResponse(
        id=session.id,
        course_id=session.course_id,
        started_at=session.started_at,
        expires_at=session.expires_at,
        is_active=session.is_active,
        qr_image_base64=qr_b64,
    )


@router.delete("/scheduled/{scheduled_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_scheduled_session(
    scheduled_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer", "admin")),
) -> None:
    """Cancel (delete) a scheduled session."""
    ss = db.query(ScheduledSession).filter(ScheduledSession.id == scheduled_id).first()
    if not ss:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled session not found")
    if current_user.role == "lecturer" and str(ss.lecturer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel another lecturer's session")
    db.delete(ss)
    db.commit()


# This catch-all must come AFTER all literal-path routes so that
# paths like /sessions/active, /sessions/scheduled, /sessions/start
# are matched first.
@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lecturer", "admin")),
) -> SessionResponse:
    """Get a single session by ID with QR image (lecturer/admin only)."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if current_user.role == "lecturer" and str(session.lecturer_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    qr_b64 = generate_qr_image_base64(session.qr_token)
    return SessionResponse(
        id=session.id,
        course_id=session.course_id,
        started_at=session.started_at,
        expires_at=session.expires_at,
        is_active=session.is_active,
        qr_image_base64=qr_b64,
    )
