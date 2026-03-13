from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # "admin" | "lecturer" | "student"
    # Student-specific optional fields
    student_number: Optional[str] = None
    department: Optional[str] = None
    year_level: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    # Populated from the Student profile when role == "student"
    student_id: Optional[str] = None

    model_config = {"from_attributes": True}
