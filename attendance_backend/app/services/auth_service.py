from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.database.connection import get_db
from app.models.user import User
from app.models.student import Student
from schemas.auth_schema import RegisterRequest

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

VALID_ROLES = {"admin", "lecturer", "student"}


def register_user(db: Session, data: RegisterRequest) -> tuple[User, str]:
    """Create a new user, optionally with a student profile. Returns (user, access_token)."""
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {data.role}")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.flush()  # get user.id before creating student profile

    if data.role == "student":
        if not data.student_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="student_number is required for student role",
            )
        # Validate student_number uniqueness
        duplicate = db.query(Student).filter(Student.student_number == data.student_number).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="student_number already in use")
        profile = Student(
            user_id=user.id,
            student_number=data.student_number,
            department=data.department,
            year_level=data.year_level,
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return user, token


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Return user if credentials are valid, else None."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, str(user.hashed_password)):
        return None
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency — decode Bearer token and return the authenticated user."""
    payload = decode_access_token(token)
    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_role(*roles: str):
    """Dependency factory that raises 403 if the current user's role is not in *roles."""
    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}",
            )
        return current_user
    return _checker
