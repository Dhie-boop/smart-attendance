---
description: "Use when implementing FastAPI backend code in app/ and schemas/: route wiring, service logic, SQLAlchemy models, auth/JWT handling, QR validation, and DB session usage for this attendance backend."
name: "Backend Implementation Rules"
applyTo: "app/**/*.py,schemas/**/*.py,utils/**/*.py"
---

# Backend Implementation Rules

## Layer Boundaries
- Keep request/response orchestration in `app/api/*_routes.py`.
- Keep domain logic in `app/services/*_service.py`.
- Keep ORM definitions in `app/models/*.py`.
- Keep Pydantic models in `schemas/*.py`.
- Keep settings and security helpers in `app/core/`.
- Keep database session and engine wiring in `app/database/connection.py`.

## FastAPI Patterns
- Use dependency injection (`Depends`) for DB session and authenticated user context.
- Declare request and response schemas explicitly.
- Return structured error responses with proper HTTP status codes.
- Keep route handlers thin; delegate non-trivial logic to services.

## Data and Domain Rules
- Enforce unique attendance on `(student_id, session_id)`.
- Treat QR tokens as short-lived (target 2-5 minutes).
- Support location/proximity verification before accepting attendance.
- Preserve role-aware authorization (`admin`/`lecturer`/`student`) in protected flows.

## Security and Config
- Load secrets and environment-specific values from `.env` through config utilities.
- Never hardcode credentials, JWT secrets, or connection strings.
- Use secure password hashing and JWT validation utilities in `app/core/security.py`.

## Quality Guardrails
- Add type hints to function signatures.
- Prefer small, single-purpose functions.
- Avoid editing `smart/Lib/site-packages/`.
