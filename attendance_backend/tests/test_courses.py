"""Tests for course and enrollment endpoints."""
from fastapi.testclient import TestClient


def _get_user_id(client: TestClient, token: str) -> str:
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _create_course(client: TestClient, admin_token: str, code: str, name: str = "Test Course") -> dict:
    r = client.post(
        "/courses",
        json={"code": code, "name": name},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 201, r.text
    return r.json()


class TestCreateCourse:
    def test_admin_can_create_course(self, client: TestClient, admin_token: str):
        r = client.post(
            "/courses",
            json={"code": "CS101", "name": "Intro to CS"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201
        body = r.json()
        assert body["code"] == "CS101"
        assert body["name"] == "Intro to CS"
        assert "id" in body
        assert "created_at" in body

    def test_lecturer_can_create_course(self, client: TestClient, lecturer_token: str):
        r = client.post(
            "/courses",
            json={"code": "CS102", "name": "Data Structures"},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 201
        body = r.json()
        assert body["code"] == "CS102"
        # Lecturer becomes the course lecturer
        lecturer_id = _get_user_id(client, lecturer_token)
        assert body["lecturer_id"] == lecturer_id

    def test_student_cannot_create_course(self, client: TestClient, student_token: str):
        r = client.post(
            "/courses",
            json={"code": "CS103", "name": "Algorithms"},
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    def test_duplicate_code_rejected(self, client: TestClient, admin_token: str):
        _create_course(client, admin_token, "CS201")
        r = client.post(
            "/courses",
            json={"code": "CS201", "name": "Duplicate"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 409

    def test_unauthenticated_rejected(self, client: TestClient):
        r = client.post("/courses", json={"code": "CS999", "name": "No Auth"})
        assert r.status_code == 401


class TestListCourses:
    def test_any_authenticated_user_can_list(self, client: TestClient, student_token: str, admin_token: str):
        _create_course(client, admin_token, "LST101")
        r = client.get("/courses", headers={"Authorization": f"Bearer {student_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_unauthenticated_rejected(self, client: TestClient):
        r = client.get("/courses")
        assert r.status_code == 401

    def test_pagination(self, client: TestClient, admin_token: str):
        _create_course(client, admin_token, "PG101")
        _create_course(client, admin_token, "PG102")
        r = client.get("/courses?skip=0&limit=1", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert len(r.json()) == 1


class TestEnrollStudent:
    def test_admin_can_enroll_student(self, client: TestClient, admin_token: str, student_token: str):
        course = _create_course(client, admin_token, "ENR101")
        student_id = _get_user_id(client, student_token)
        r = client.post(
            f"/courses/{course['id']}/enroll",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201
        body = r.json()
        assert body["student_id"] == student_id
        assert body["course_id"] == course["id"]
        assert "enrolled_at" in body

    def test_duplicate_enrollment_rejected(self, client: TestClient, admin_token: str, student_token: str):
        course = _create_course(client, admin_token, "ENR102")
        student_id = _get_user_id(client, student_token)
        payload = {"student_id": student_id}
        r1 = client.post(
            f"/courses/{course['id']}/enroll",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r1.status_code == 201
        r2 = client.post(
            f"/courses/{course['id']}/enroll",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r2.status_code == 409

    def test_lecturer_cannot_enroll(self, client: TestClient, admin_token: str, student_token: str, lecturer_token: str):
        course = _create_course(client, admin_token, "ENR103")
        student_id = _get_user_id(client, student_token)
        r = client.post(
            f"/courses/{course['id']}/enroll",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 403

    def test_enroll_nonexistent_course(self, client: TestClient, admin_token: str, student_token: str):
        student_id = _get_user_id(client, student_token)
        import uuid
        fake_id = str(uuid.uuid4())
        r = client.post(
            f"/courses/{fake_id}/enroll",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 404

    def test_enroll_nonexistent_student(self, client: TestClient, admin_token: str):
        course = _create_course(client, admin_token, "ENR104")
        import uuid
        fake_id = str(uuid.uuid4())
        r = client.post(
            f"/courses/{course['id']}/enroll",
            json={"student_id": fake_id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 404


class TestListEnrolledStudents:
    def test_admin_can_list_enrolled(self, client: TestClient, admin_token: str, student_token: str):
        course = _create_course(client, admin_token, "LSE101")
        student_id = _get_user_id(client, student_token)
        client.post(
            f"/courses/{course['id']}/enroll",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        r = client.get(
            f"/courses/{course['id']}/students",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        students = r.json()
        assert len(students) == 1
        assert students[0]["id"] == student_id

    def test_lecturer_can_list_enrolled(self, client: TestClient, admin_token: str, student_token: str, lecturer_token: str):
        course = _create_course(client, admin_token, "LSE102")
        student_id = _get_user_id(client, student_token)
        client.post(
            f"/courses/{course['id']}/enroll",
            json={"student_id": student_id},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        r = client.get(
            f"/courses/{course['id']}/students",
            headers={"Authorization": f"Bearer {lecturer_token}"},
        )
        assert r.status_code == 200

    def test_student_cannot_list_enrolled(self, client: TestClient, admin_token: str, student_token: str):
        course = _create_course(client, admin_token, "LSE103")
        r = client.get(
            f"/courses/{course['id']}/students",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert r.status_code == 403

    def test_nonexistent_course_returns_404(self, client: TestClient, admin_token: str):
        import uuid
        r = client.get(
            f"/courses/{uuid.uuid4()}/students",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 404
