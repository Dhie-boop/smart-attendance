from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.course import Course, Enrollment
from app.models.user import User
from app.services.auth_service import get_current_user, require_role
from schemas.auth_schema import UserResponse
from schemas.course_schema import CourseCreate, CourseResponse, EnrollmentCreate, EnrollmentResponse

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lecturer")),
) -> CourseResponse:
    """Create a new course. The creating user becomes the lecturer."""
    existing = db.query(Course).filter(Course.code == data.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Course code already exists")

    course = Course(
        code=data.code,
        name=data.name,
        lecturer_id=current_user.id if current_user.role == "lecturer" else None,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("", response_model=list[CourseResponse])
def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CourseResponse]:
    """List courses with lecturer name and enrolled student count.

    - Lecturer: only their assigned courses.
    - Admin: all courses.
    - Student: all courses (for potential browsing).
    """
    query = (
        db.query(Course, User, func.count(Enrollment.id))
        .outerjoin(User, Course.lecturer_id == User.id)
        .outerjoin(Enrollment, Enrollment.course_id == Course.id)
    )

    if current_user.role == "lecturer":
        query = query.filter(Course.lecturer_id == current_user.id)

    rows = (
        query.group_by(Course.id, User.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        CourseResponse(
            id=course.id,
            code=course.code,
            name=course.name,
            lecturer_id=course.lecturer_id,
            lecturer_name=lecturer.full_name if lecturer else None,
            enrolled_count=count,
            created_at=course.created_at,
        )
        for course, lecturer, count in rows
    ]


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_student(
    course_id: UUID,
    data: EnrollmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> EnrollmentResponse:
    """Enroll a student in a course (admin only)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    student = db.query(User).filter(User.id == data.student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == data.student_id, Enrollment.course_id == course_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student already enrolled in this course")

    enrollment = Enrollment(student_id=data.student_id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/{course_id}/students", response_model=list[UserResponse])
def list_enrolled_students(
    course_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "lecturer")),
) -> list[User]:
    """List all students enrolled in a course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    student_ids = [e.student_id for e in enrollments]
    return db.query(User).filter(User.id.in_(student_ids)).all()


class AssignLecturerRequest(BaseModel):
    lecturer_id: UUID


@router.patch("/{course_id}/lecturer", response_model=CourseResponse)
def assign_lecturer(
    course_id: UUID,
    data: AssignLecturerRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Course:
    """Assign a lecturer to a course (admin only)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    lecturer = db.query(User).filter(User.id == data.lecturer_id, User.role == "lecturer").first()
    if not lecturer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecturer not found")

    # Prevent re-assigning a course that already has a different lecturer
    if course.lecturer_id and str(course.lecturer_id) != str(data.lecturer_id):
        current_lecturer = db.query(User).filter(User.id == course.lecturer_id).first()
        current_name = current_lecturer.full_name if current_lecturer else "another lecturer"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This course unit is already assigned to {current_name}. Please unassign the current lecturer first.",
        )

    course.lecturer_id = data.lecturer_id
    db.commit()
    db.refresh(course)
    return course


@router.patch("/{course_id}/unassign-lecturer", response_model=CourseResponse)
def unassign_lecturer(
    course_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Course:
    """Remove the current lecturer from a course (admin only)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.lecturer_id = None
    db.commit()
    db.refresh(course)
    return course
