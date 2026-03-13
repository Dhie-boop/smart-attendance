# Smart Attendance Backend — Claude Rules

## Project Overview
FastAPI backend for a QR-code-based attendance tracking system.  
Stack: Python 3.11 · FastAPI · SQLAlchemy 2 · PostgreSQL (psycopg2) · Alembic · JWT (python-jose) · Passlib/bcrypt · Pillow + qrcode.

## Environment Setup
```bash
# Activate venv (PowerShell)
smart\Scripts\Activate.ps1

# Install deps
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload

# Run tests
pytest

# Database migrations (once alembic.ini is scaffolded)
alembic upgrade head
```

## Repository Layout
```
app/
  main.py               ← FastAPI app entry point
  api/                  ← Route handlers only (no business logic)
    attendance_routes.py
    auth_routes.py
    session_routes.py
  services/             ← Domain logic (attendance rules, QR flow, auth)
    attendance_service.py
    qr_service.py
  models/               ← SQLAlchemy ORM models
    attendance.py  course.py  session.py  student.py
  core/
    config.py           ← Settings loaded from .env
    security.py         ← JWT helpers, password hashing
  database/
    connection.py       ← SQLAlchemy engine + session factory
schemas/                ← Pydantic request/response models
tests/                  ← Pytest tests (currently empty — add here)
utils/
  helpers.py            ← Shared utility functions
migrations/             ← Alembic migration scripts (not yet scaffolded)
```

> Most source files are currently empty scaffolding stubs. Respect layer boundaries when adding code.

## Layer Rules
- **`app/api/`** — wire routes, validate input, call services, return responses. No DB queries.
- **`app/services/`** — all domain decisions live here. Call models and DB session; never import FastAPI.
- **`app/models/`** — ORM definitions only. No business logic.
- **`schemas/`** — Pydantic models for request bodies and response shapes.
- **`app/core/`** — config (`BaseSettings` from pydantic-settings) and security utilities.
- **`app/database/`** — engine, `SessionLocal`, `get_db` dependency.
- **`smart/Lib/site-packages/`** — third-party packages, **never edit**.

## Domain Constraints (non-negotiable)
| Rule | Implementation |
|------|---------------|
| One scan per student per session | Unique constraint on `(student_id, session_id)` in `Attendance` model |
| Short-lived QR codes | Embed `exp` claim; reject tokens older than 2–5 minutes |
| GPS proximity check | Validate student location against session classroom coordinates before marking attendance |
| Role-based access | `admin`/`lecturer` can create sessions & view reports; `student` can only scan & view own history |
| JWT auth | Issue access tokens on login; verify on every protected route via FastAPI `Depends` |

## Coding Conventions
- All function signatures must include type hints.
- Read secrets from `.env` via `app/core/config.py` — **never hardcode credentials**.
- Use `python-jose` for JWT, `passlib[bcrypt]` for password hashing.
- Generate QR codes with the `qrcode` + `Pillow` libraries already installed.
- Migrations: use `alembic revision --autogenerate -m "<message>"` then `alembic upgrade head`.
- Tests go in `tests/`; do not confuse with `smart/Lib/site-packages/` vendor tests.
- Keep functions small and single-purpose; prefer explicit over implicit.

## Security Checklist
- [ ] No plaintext passwords stored — always hash with bcrypt.
- [ ] JWT secret loaded from env, not hardcoded.
- [ ] QR token expiry enforced server-side, not just client-side.
- [ ] Role checks applied in route dependencies, not only in UI.
- [ ] SQL queries via SQLAlchemy ORM — no raw string interpolation.
- [ ] Location/GPS inputs validated and bounded before use.
