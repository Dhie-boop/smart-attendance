---
description: "Scaffold a backend feature end-to-end (route, service, schema, optional model, and tests) for this smart attendance FastAPI project."
name: "Scaffold Backend Feature"
argument-hint: "Describe the feature, endpoint(s), roles, and expected request/response behavior"
agent: "agent"
---

Implement the feature described by the user for this workspace.

Requirements:
- Follow workspace rules in `.github/copilot-instructions.md`.
- Respect layer boundaries:
  - routes in `app/api/*_routes.py`
  - business logic in `app/services/*_service.py`
  - models in `app/models/*.py`
  - schemas in `schemas/*.py`
- Keep route handlers thin and delegate non-trivial logic to services.
- Add type hints and keep functions small.
- If relevant, enforce attendance domain constraints (single scan per session, QR expiry, role checks, location checks).
- Add or update tests in `tests/` for happy-path and failure-path coverage.
- Do not edit `smart/Lib/site-packages/`.

Execution checklist:
1. Read existing files that will be touched and preserve conventions.
2. Implement the minimal set of changes for the requested feature.
3. Run `pytest` if tests are available and report results.
4. Summarize changed files and any assumptions.
