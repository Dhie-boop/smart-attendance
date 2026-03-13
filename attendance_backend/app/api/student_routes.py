"""Student management endpoints.

GET  /students            — list all users with role='student' (admin only)
POST /students            — create a new student account (admin only)
GET  /students/my-courses — student's enrolled courses with attendance stats
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.attendance import AttendanceRecord
from app.models.course import Course, Enrollment
from app.models.session import Session as ClassSession
from app.models.user import User
from app.services.auth_service import get_current_user, register_user, require_role
from schemas.auth_schema import RegisterRequest, TokenResponse, UserResponse
from schemas.course_schema import StudentCourseResponse

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/my-courses", response_model=list[StudentCourseResponse])
def my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
) -> list[StudentCourseResponse]:
    """Return the student's enrolled courses with per-course attendance stats."""
    enrollments = (
        db.query(Enrollment, Course, User)
        .join(Course, Enrollment.course_id == Course.id)
        .outerjoin(User, Course.lecturer_id == User.id)
        .filter(Enrollment.student_id == current_user.id)
        .all()
    )

    result: list[StudentCourseResponse] = []
    for _enr, course, lecturer in enrollments:
        # Count sessions for this course
        session_ids = [
            row[0]
            for row in db.query(ClassSession.id).filter(ClassSession.course_id == course.id).all()
        ]
        total_sessions = len(session_ids)

        # Attendance stats for the student in these sessions
        status_counts: dict[str, int] = {}
        if session_ids:
            rows = (
                db.query(AttendanceRecord.status, func.count(AttendanceRecord.id))
                .filter(
                    AttendanceRecord.student_id == current_user.id,
                    AttendanceRecord.session_id.in_(session_ids),
                )
                .group_by(AttendanceRecord.status)
                .all()
            )
            status_counts = dict(rows)

        result.append(
            StudentCourseResponse(
                id=course.id,
                code=course.code,
                name=course.name,
                lecturer_name=lecturer.full_name if lecturer else None,
                total_sessions=total_sessions,
                present_count=int(status_counts.get("present", 0)),
                late_count=int(status_counts.get("late", 0)),
                absent_count=int(status_counts.get("absent", 0)),
            )
        )
    return result


@router.get("", response_model=list[UserResponse])
def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[User]:
    """List all registered students (admin only)."""
    return db.query(User).filter(User.role == "student").offset(skip).limit(limit).all()


@router.post("", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    data: RegisterRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> TokenResponse:
    """Create a new student account (admin only). Role must be 'student'."""
    if data.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint only creates student accounts; set role='student'",
        )
    _user, token = register_user(db, data)
    return TokenResponse(access_token=token)
