"""Tests for session endpoints."""
import base64
import pytest
from fastapi.testclient import TestClient


def _create_course(client: TestClient, admin_token: str, code: str = "CS101") -> str:
    """Helper: create a course and return its UUID string."""
    r = client.post(
        "/courses",
        json={"code": code, "name": "Introduction to Computing"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


class TestStartSession:
    def test_start_session_returns_qr_image(self, client: TestClient, lecturer_token: str, admin_token: str):
        course_id = _create_course(client, admin_token, code="CS200")
        r = client.post(
            "/sessions/start",
            json={"course_id": course_id},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["is_active"] is True
        assert "qr_image_base64" in body
        # Validate it's valid base64-encoded data
        decoded = base64.b64decode(body["qr_image_base64"])
        # PNG magic bytes: \x89PNG
        assert decoded[:4] == b"\x89PNG"

    def test_start_session_student_forbidden(self, client: TestClient, student_token: str, admin_token: str):
        course_id = _create_course(client, admin_token, code="CS201")
        r = client.post(
            "/sessions/start",
            json={"course_id": course_id},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    def test_start_session_course_not_found(self, client: TestClient, lecturer_token: str):
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        r = client.post(
            "/sessions/start",
            json={"course_id": fake_uuid},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 404


class TestEndSession:
    def test_end_session(self, client: TestClient, lecturer_token: str, admin_token: str):
        course_id = _create_course(client, admin_token, code="CS202")
        # Start a session
        start_r = client.post(
            "/sessions/start",
            json={"course_id": course_id},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        session_id = start_r.json()["id"]

        # End it
        r = client.post(
            f"/sessions/end/{session_id}",
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 200
        assert r.json()["is_active"] is False
        assert r.json()["ended_at"] is not None

    def test_end_session_already_ended(self, client: TestClient, lecturer_token: str, admin_token: str):
        course_id = _create_course(client, admin_token, code="CS203")
        start_r = client.post(
            "/sessions/start",
            json={"course_id": course_id},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        session_id = start_r.json()["id"]
        client.post(f"/sessions/end/{session_id}", headers={"Authorization": f"Bearer {lecturer_token}"})
        # Try ending again
        r = client.post(f"/sessions/end/{session_id}", headers={"Authorization": f"Bearer {lecturer_token}"})
        assert r.status_code == 400


class TestActiveSessions:
    def test_list_active_sessions(self, client: TestClient, lecturer_token: str, admin_token: str):
        course_id = _create_course(client, admin_token, code="CS204")
        client.post(
            "/sessions/start",
            json={"course_id": course_id},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        r = client.get("/sessions/active", headers={"Authorization": f"Bearer {lecturer_token}"})
        assert r.status_code == 200
        assert len(r.json()) >= 1
