---
name: attendance-domain
description: "Implement and review smart attendance domain logic for QR-based check-ins. Use for duplicate scan prevention, QR expiry validation, location/proximity checks, role authorization, and attendance flow design in FastAPI services/routes."
argument-hint: "Describe the attendance flow or rule you need to implement or validate"
user-invocable: true
---

# Attendance Domain Skill

## When To Use
- Implementing attendance check-in or session start flows.
- Reviewing correctness of QR validation logic.
- Adding role and authorization checks in attendance endpoints.
- Writing tests for attendance business rules.

## Core Rules
- One attendance record per `(student_id, session_id)`.
- QR tokens must be short-lived (target 2-5 minutes).
- Attendance can require classroom proximity verification.
- Authorization must be role-aware for admin, lecturer, and student actions.

Detailed acceptance criteria are in [attendance rules reference](./references/attendance-rules.md).

## Procedure
1. Identify whether the request affects route wiring, service logic, model constraints, or all of them.
2. Place logic in the correct layer:
   - route handlers coordinate request/response only
   - services enforce domain decisions and call persistence
3. Enforce duplicate-scan prevention in persistence constraints and service checks.
4. Validate QR claims (including expiration) before marking attendance.
5. Apply role checks before allowing session creation, reports, or check-in operations.
6. Add tests for success and failure paths (duplicate, expired QR, bad role, invalid location).
7. Report assumptions explicitly when classroom geofence rules are not fully specified.

## Output Expectations
- Changes are minimal and aligned with existing project structure.
- Domain rules are enforced both in code paths and tests.
- Security-sensitive values are read from configuration, not hardcoded.
