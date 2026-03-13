# Project Guidelines

## Code Style
- Use Python 3.11 style and keep code in `app/`, `schemas/`, `tests/`, and `utils/`.
- Add type hints for function signatures and prefer clear, small functions.
- Keep route modules in `app/api/*_routes.py`, business logic in `app/services/*_service.py`, and data models in `app/models/*.py`.
- Do not edit files in `smart/Lib/site-packages/`.

## Architecture
- App entry point: `app/main.py`.
- Intended layer boundaries:
  - `app/api/`: FastAPI route handlers and request/response wiring.
  - `app/services/`: domain logic (attendance rules, QR validation flow).
  - `app/models/`: ORM models.
  - `schemas/`: request/response schema definitions.
  - `app/core/`: configuration and security utilities.
  - `app/database/`: database connection/session management.
- Many files are currently scaffolding stubs (empty). When adding code, keep these boundaries instead of mixing concerns.

## Build and Test
- Activate virtual environment (PowerShell): `smart\\Scripts\\Activate.ps1`.
- Install dependencies: `pip install -r requirements.txt`.
- Run API locally: `uvicorn app.main:app --reload`.
- Run tests: `pytest`.
- Notes:
  - `tests/` is currently empty; do not confuse it with third-party tests in `smart/Lib/site-packages/`.
  - `docker-compose.yml` exists but is currently empty.
  - Alembic is installed, but migration scaffolding is not yet set up in this workspace.

## Conventions
- Domain rules from `project-details.md`:
  - Enforce one attendance scan per student per session (`student_id + session_id` uniqueness).
  - QR codes should be short-lived (about 2-5 minutes).
  - Attendance verification may include classroom proximity (GPS/location checks).
  - Use secure authentication with role-aware authorization and JWT session handling.
- Prefer environment-driven secrets/configuration (see `.env`), and do not hardcode credentials.
