from typing import Optional
from uuid import UUID

from pydantic import BaseModel


# Internal payload embedded in QR token
class QRPayload(BaseModel):
    session_id: str
    iat: int   # issued-at (unix timestamp)
    exp: int   # expiry (unix timestamp)
    nonce: str  # UUID4 for replay prevention
