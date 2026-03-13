import base64
import io
import uuid
from datetime import datetime, timezone

import qrcode  # type: ignore[import-untyped]
from fastapi import HTTPException, status
from jose import JWTError, jwt  # type: ignore[import-untyped]

from app.core.config import settings


def generate_qr_token(session_id: str, expire_seconds: int | None = None) -> str:
    """Create a short-lived signed JWT embedding the session_id and a nonce."""
    exp_seconds = expire_seconds if expire_seconds is not None else settings.QR_TOKEN_EXPIRE_SECONDS
    now = int(datetime.now(timezone.utc).timestamp())
    payload = {
        "session_id": session_id,
        "iat": now,
        "exp": now + exp_seconds,
        "nonce": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_qr_token(token: str) -> dict:
    """Decode and validate a QR token. Raises 400 if invalid or expired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code is invalid or has expired",
        )


def generate_qr_image_base64(token: str) -> str:
    """Generate a QR code whose payload is a deep-link URL.

    When scanned with *any* QR reader the student's browser opens the
    ``/attend?token=…`` page which auto-submits attendance.
    """
    url = f"{settings.FRONTEND_URL}/attend?token={token}"
    img = qrcode.make(url)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
