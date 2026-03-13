# Attendance Rules Reference

Use this checklist when implementing or reviewing attendance flows.

## Acceptance Criteria
- Duplicate prevention:
  - Same student cannot be marked present twice for the same session.
  - Back this with a DB-level unique constraint and service-level guard.
- QR validity:
  - QR payload includes enough context to validate session and expiration.
  - Expired or malformed tokens are rejected.
- Authorization:
  - Only authorized roles can create sessions or generate QR codes.
  - Student check-in is limited to the authenticated student identity.
- Location verification:
  - If location is required, check proximity before final attendance write.
  - Reject when coordinates are missing, invalid, or outside allowed threshold.

## Test Matrix
- Success:
  - valid token + valid role + valid location => attendance recorded once
- Failure:
  - duplicate scan
  - expired token
  - invalid token signature/claims
  - unauthorized role
  - location outside threshold
