from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attendance import AttendanceRecord
from app.models.course import Course
from app.models.session import Session as ClassSession
from app.models.user import User
from app.services.attendance_service import get_report_csv
from app.services.auth_service import register_user, require_role
from schemas.auth_schema import RegisterRequest, UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/students", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    data: RegisterRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> UserResponse:
    """Admin creates a new student account with a student profile."""
    if data.role != "student":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'student'")
    user, _token = register_user(db, data)
    return user


@router.get("/users", response_model=list[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[User]:
    """List all registered users (admin only)."""
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/dashboard")
def dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> dict:
    """Return key system metrics for the admin dashboard."""
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0
    total_lecturers = db.query(func.count(User.id)).filter(User.role == "lecturer").scalar() or 0
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    active_sessions = db.query(func.count(ClassSession.id)).filter(ClassSession.is_active == True).scalar() or 0  # noqa: E712
    total_sessions = db.query(func.count(ClassSession.id)).scalar() or 0
    total_attendance = db.query(func.count(AttendanceRecord.id)).scalar() or 0
    present_count = db.query(func.count(AttendanceRecord.id)).filter(AttendanceRecord.status == "present").scalar() or 0
    attendance_rate = round((present_count / total_attendance * 100), 1) if total_attendance > 0 else 0.0

    # Recent students (last 5 registered)
    recent_students = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_students": total_students,
        "total_lecturers": total_lecturers,
        "total_courses": total_courses,
        "active_sessions": active_sessions,
        "total_sessions": total_sessions,
        "attendance_rate": attendance_rate,
        "recent_students": [
            {"id": str(s.id), "full_name": s.full_name, "email": s.email, "created_at": s.created_at.isoformat()}
            for s in recent_students
        ],
    }


@router.get("/analytics")
def analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> dict:
    """Return attendance analytics per course (admin only)."""
    courses = db.query(Course).all()
    result = []
    for course in courses:
        session_ids = [s.id for s in db.query(ClassSession).filter(ClassSession.course_id == course.id).all()]
        total_sessions = len(session_ids)
        total_records = (
            db.query(func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.session_id.in_(session_ids))
            .scalar()
            if session_ids else 0
        )
        result.append({
            "course_id": str(course.id),
            "course_code": course.code,
            "course_name": course.name,
            "total_sessions": total_sessions,
            "total_attendance_records": total_records,
        })
    return {"courses": result}


@router.get("/export")
def export_csv(
    session_id: UUID = Query(..., description="Session UUID to export attendance for"),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "lecturer")),
) -> StreamingResponse:
    """Download attendance for a session as a CSV file (admin/lecturer only)."""
    csv_content = get_report_csv(db, session_id)

    def _iter():
        yield csv_content

    return StreamingResponse(
        _iter(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{session_id}.csv"},
    )
