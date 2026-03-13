---
description: "Use when creating or updating pytest tests for this backend, including API route tests, service unit tests, attendance domain rules, and regression coverage."
name: "Testing Rules"
applyTo: "tests/**/*.py"
---

# Testing Rules

## Test Location and Naming
- Put all project tests under `tests/`.
- Use file names like `test_<feature>.py`.
- Use test names that describe behavior, not implementation details.

## Coverage Priorities
- Validate attendance domain invariants:
  - one scan per student per session
  - expired QR tokens are rejected
  - unauthorized roles are blocked
  - location checks fail when outside allowed bounds
- Add regression tests for bug fixes.

## API Test Guidance
- Prefer FastAPI `TestClient` for route-level behavior.
- Assert status code, response shape, and critical fields.
- Cover success and failure paths (validation, auth, duplicates, expired tokens).

## Service Test Guidance
- Keep service tests focused on business rules.
- Mock or isolate external dependencies when useful.
- Avoid brittle assertions tied to non-essential implementation details.

## Safety Notes
- Do not use or run tests from `smart/Lib/site-packages/`.
- Keep tests deterministic and independent.
