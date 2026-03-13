from datetime import date, datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class SessionStartRequest(BaseModel):
    course_id: UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_meters: Optional[int] = 50


class SessionResponse(BaseModel):
    id: UUID
    course_id: UUID
    started_at: datetime
    expires_at: datetime
    is_active: bool
    qr_image_base64: str  # base64-encoded PNG of the QR code

    model_config = {"from_attributes": True}


class SessionEndResponse(BaseModel):
    id: UUID
    is_active: bool
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SessionPublicResponse(BaseModel):
    id: UUID
    course_id: UUID
    started_at: datetime
    expires_at: datetime
    is_active: bool
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    lecturer_name: Optional[str] = None
    qr_image_base64: Optional[str] = None
    session_token: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Scheduled Sessions ──────────────────────────────────────────────────────

class ScheduledSessionCreate(BaseModel):
    course_id: UUID
    title: str
    scheduled_date: date
    start_time: time
    end_time: time
    location: Optional[str] = None


class ScheduledSessionResponse(BaseModel):
    id: UUID
    course_id: UUID
    lecturer_id: UUID
    title: str
    scheduled_date: date
    start_time: time
    end_time: time
    location: Optional[str] = None
    course_code: Optional[str] = None
    course_name: Optional[str] = None
    lecturer_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
