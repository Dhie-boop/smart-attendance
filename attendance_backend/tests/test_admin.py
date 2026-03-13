"""Tests for admin and student management endpoints."""
import uuid

import pytest
from fastapi.testclient import TestClient


def _get_user(client: TestClient, token: str) -> dict:
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    return r.json()


def _create_course(client: TestClient, admin_token: str, code: str) -> dict:
    r = client.post(
        "/courses",
        json={"code": code, "name": f"Course {code}"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201, r.text
    return r.json()


def _enroll(client: TestClient, admin_token: str, student_id: str, course_id: str):
    r = client.post(
        f"/courses/{course_id}/enroll",
        json={"student_id": student_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201, r.text


def _start_session(client: TestClient, lecturer_token: str, course_id: str) -> dict:
    r = client.post(
        "/sessions/start",
        json={"course_id": course_id},
        headers={"Authorization": f"Bearer {lecturer_token}"},
    )
    assert r.status_code == 201, r.text
    return r.json()


# ---------------------------------------------------------------------------
# Admin — list users
# ---------------------------------------------------------------------------

class TestAdminListUsers:
    def test_admin_can_list_all_users(self, client: TestClient, admin_token: str, lecturer_token: str):
        r = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        # At minimum the fixtures have created admin + lecturer
        emails = [u["email"] for u in users]
        assert "admin@test.com" in emails
        assert "lecturer@test.com" in emails

    def test_lecturer_cannot_list_users(self, client: TestClient, lecturer_token: str):
        r = client.get("/admin/users", headers={"Authorization": f"Bearer {lecturer_token}"})
        assert r.status_code == 403

    def test_student_cannot_list_users(self, client: TestClient, student_token: str):
        r = client.get("/admin/users", headers={"Authorization": f"Bearer {student_token}"})
        assert r.status_code == 403

    def test_unauthenticated_rejected(self, client: TestClient):
        r = client.get("/admin/users")
        assert r.status_code == 401

    def test_pagination(self, client: TestClient, admin_token: str, lecturer_token: str):
        r = client.get("/admin/users?skip=0&limit=1", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert len(r.json()) == 1


# ---------------------------------------------------------------------------
# Admin — analytics
# ---------------------------------------------------------------------------

class TestAdminAnalytics:
    def test_admin_gets_analytics(self, client: TestClient, admin_token: str, lecturer_token: str, student_token: str):
        course = _create_course(client, admin_token, "ANA101")
        student = _get_user(client, student_token)
        _enroll(client, admin_token, student["id"], course["id"])
        _start_session(client, lecturer_token, course["id"])

        r = client.get("/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        body = r.json()
        assert "courses" in body
        codes = [c["course_code"] for c in body["courses"]]
        assert "ANA101" in codes

    def test_lecturer_cannot_access_analytics(self, client: TestClient, lecturer_token: str):
        r = client.get("/admin/analytics", headers={"Authorization": f"Bearer {lecturer_token}"})
        assert r.status_code == 403

    def test_unauthenticated_rejected(self, client: TestClient):
        r = client.get("/admin/analytics")
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Admin — CSV export
# ---------------------------------------------------------------------------

class TestAdminExport:
    def test_admin_can_export_csv(self, client: TestClient, admin_token: str, lecturer_token: str, student_token: str):
        from app.services.qr_service import generate_qr_token

        course = _create_course(client, admin_token, "EXP101")
        student = _get_user(client, student_token)
        _enroll(client, admin_token, student["id"], course["id"])
        session = _start_session(client, lecturer_token, course["id"])

        # Record attendance
        qr = generate_qr_token(session["id"])
        client.post("/attendance/scan", json={"session_token": qr}, headers={"Authorization": f"Bearer {student_token}"})

        r = client.get(
            f"/admin/export?session_id={session['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert "text/csv" in r.headers["content-type"]
        content = r.text
        assert "student_id" in content  # header row

    def test_lecturer_can_export_csv(self, client: TestClient, admin_token: str, lecturer_token: str):
        course = _create_course(client, admin_token, "EXP102")
        session = _start_session(client, lecturer_token, course["id"])
        r = client.get(
            f"/admin/export?session_id={session['id']}",
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 200

    def test_student_cannot_export(self, client: TestClient, admin_token: str, lecturer_token: str, student_token: str):
        course = _create_course(client, admin_token, "EXP103")
        session = _start_session(client, lecturer_token, course["id"])
        r = client.get(
            f"/admin/export?session_id={session['id']}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    def test_missing_session_id_rejected(self, client: TestClient, admin_token: str):
        r = client.get("/admin/export", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Students endpoints (GET /students, POST /students)
# ---------------------------------------------------------------------------

class TestListStudents:
    def test_admin_can_list_students(self, client: TestClient, admin_token: str, student_token: str):
        r = client.get("/students", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        students = r.json()
        assert isinstance(students, list)
        # student_token fixture created a student
        emails = [s["email"] for s in students]
        assert "student@test.com" in emails
        # All returned users must be students
        roles = [s["role"] for s in students]
        assert all(role == "student" for role in roles)

    def test_student_id_field_present(self, client: TestClient, admin_token: str, student_token: str):
        r = client.get("/students", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        students = r.json()
        target = next(s for s in students if s["email"] == "student@test.com")
        # student_id (student_number) should be populated
        assert target["student_id"] == "STU001"

    def test_lecturer_cannot_list_students(self, client: TestClient, lecturer_token: str):
        r = client.get("/students", headers={"Authorization": f"Bearer {lecturer_token}"})
        assert r.status_code == 403

    def test_unauthenticated_rejected(self, client: TestClient):
        r = client.get("/students")
        assert r.status_code == 401


class TestCreateStudent:
    def test_admin_can_create_student(self, client: TestClient, admin_token: str):
        r = client.post(
            "/students",
            json={
                "email": "newstudent@test.com",
                "password": "secure123",
                "full_name": "New Student",
                "role": "student",
                "student_number": "STU999",
                "department": "Engineering",
                "year_level": 1,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201
        body = r.json()
        assert "access_token" in body

    def test_non_student_role_rejected(self, client: TestClient, admin_token: str):
        r = client.post(
            "/students",
            json={
                "email": "anotherlecturer@test.com",
                "password": "pass",
                "full_name": "Sneak",
                "role": "lecturer",
                "student_number": "STU888",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 400

    def test_missing_student_number_rejected(self, client: TestClient, admin_token: str):
        r = client.post(
            "/students",
            json={
                "email": "nostudentno@test.com",
                "password": "pass",
                "full_name": "No Number",
                "role": "student",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 400

    def test_lecturer_cannot_create_student(self, client: TestClient, lecturer_token: str):
        r = client.post(
            "/students",
            json={
                "email": "fromlecturer@test.com",
                "password": "pass",
                "full_name": "Snuck In",
                "role": "student",
                "student_number": "STU777",
            },
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 403
