"""Tests for attendance scan endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.services.qr_service import generate_qr_token


def _create_course(client: TestClient, admin_token: str, code: str) -> str:
    r = client.post(
        "/courses",
        json={"code": code, "name": f"Course {code}"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _enroll_student(client: TestClient, admin_token: str, student_id: str, course_id: str):
    r = client.post(
        f"/courses/{course_id}/enroll",
        json={"student_id": student_id, "course_id": course_id},
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


def _get_student_id(client: TestClient, student_token: str) -> str:
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    return r.json()["id"]


class TestAttendanceScan:
    def test_session_start_does_not_seed_absent_records(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        """Starting a session should NOT pre-create absent records.
        Absent records are only created when the session ends."""
        course_id = _create_course(client, admin_token, "ATT100")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)

        report = client.get(
            "/attendance/report",
            params={"session_id": session["id"]},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert report.status_code == 200, report.text
        rows = report.json()
        assert len(rows) == 0, "No attendance records should exist before students scan"

    def test_scan_valid(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT101")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)
        token = session["id"]  # use session qr_token from service
        # Re-generate a token for the session_id (mirrors what the QR image contains)
        qr_token = generate_qr_token(session["id"])

        r = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["success"] is True
        assert body["attendance_id"] is not None

        report = client.get(
            "/attendance/report",
            params={"session_id": session["id"]},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert report.status_code == 200
        rows = report.json()
        assert len(rows) == 1
        assert rows[0]["status"] == "present"

    def test_scan_duplicate_rejected(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT102")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)
        qr_token = generate_qr_token(session["id"])

        # First scan — OK
        r1 = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r1.status_code == 200

        # Second scan — must be rejected
        r2 = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r2.status_code == 409

    def test_scan_expired_token(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT103")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)
        # Generate an already-expired token (expire_seconds = -1)
        expired_token = generate_qr_token(session["id"], expire_seconds=-1)

        r = client.post(
            "/attendance/scan",
            json={"session_token": expired_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 400

    def test_scan_not_enrolled_rejected(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT104")
        # Do NOT enroll the student
        session = _start_session(client, lecturer_token, course_id)
        qr_token = generate_qr_token(session["id"])

        r = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    def test_scan_inactive_session_rejected(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT105")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)
        # End the session
        client.post(
            f"/sessions/end/{session['id']}",
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        qr_token = generate_qr_token(session["id"])

        r = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 400

    def test_scan_requires_student_role(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT106")
        session = _start_session(client, lecturer_token, course_id)
        qr_token = generate_qr_token(session["id"])

        # Lecturer trying to scan — should be forbidden
        r = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "STU001"},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 403

    def test_scan_rejects_wrong_student_number(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        course_id = _create_course(client, admin_token, "ATT107")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)
        qr_token = generate_qr_token(session["id"])

        r = client.post(
            "/attendance/scan",
            json={"session_token": qr_token, "student_number": "WRONG-999"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    def test_session_end_seeds_absent_for_unenrolled(
        self,
        client: TestClient,
        admin_token: str,
        lecturer_token: str,
        student_token: str,
    ):
        """When a session ends, enrolled students who never scanned get an absent record."""
        course_id = _create_course(client, admin_token, "ATT108")
        student_id = _get_student_id(client, student_token)
        _enroll_student(client, admin_token, student_id, course_id)
        session = _start_session(client, lecturer_token, course_id)

        # Don't scan — just end the session
        end_r = client.post(
            f"/sessions/end/{session['id']}",
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert end_r.status_code == 200

        report = client.get(
            "/attendance/report",
            params={"session_id": session["id"]},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert report.status_code == 200
        rows = report.json()
        assert len(rows) == 1
        assert rows[0]["student_id"] == student_id
        assert rows[0]["status"] == "absent"


class TestAttendanceHistory:
    def test_student_views_own_history(
        self, client: TestClient, student_token: str
    ):
        student_id = _get_student_id(client, student_token)
        r = client.get(
            f"/attendance/student/{student_id}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_student_cannot_view_other_history(
        self, client: TestClient, student_token: str
    ):
        fake_id = "00000000-0000-0000-0000-000000000001"
        r = client.get(
            f"/attendance/student/{fake_id}",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403
