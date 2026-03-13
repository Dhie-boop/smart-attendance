"""Tests for authentication endpoints."""
import pytest
from fastapi.testclient import TestClient


class TestRegister:
    def test_register_success(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"email": "newuser@test.com", "password": "secret123", "full_name": "New User", "role": "lecturer"},
        )
        assert r.status_code == 201
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_register_student_requires_student_number(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"email": "nostudent@test.com", "password": "pass", "full_name": "No Number", "role": "student"},
        )
        assert r.status_code == 400

    def test_register_duplicate_email(self, client: TestClient, admin_token: str):
        # admin_token fixture already registered admin@test.com
        r = client.post(
            "/auth/register",
            json={"email": "admin@test.com", "password": "other", "full_name": "Dup", "role": "admin"},
        )
        assert r.status_code == 409

    def test_register_invalid_role(self, client: TestClient):
        r = client.post(
            "/auth/register",
            json={"email": "bad@test.com", "password": "pass", "full_name": "Bad Role", "role": "superuser"},
        )
        assert r.status_code == 400


class TestLogin:
    def test_login_success(self, client: TestClient, admin_token: str):
        r = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpass"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client: TestClient, admin_token: str):
        r = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrongpass"})
        assert r.status_code == 401

    def test_login_unknown_email(self, client: TestClient):
        r = client.post("/auth/login", json={"email": "nobody@test.com", "password": "pass"})
        assert r.status_code == 401


class TestMe:
    def test_get_me(self, client: TestClient, lecturer_token: str):
        r = client.get("/auth/me", headers={"Authorization": f"Bearer {lecturer_token}"})
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == "lecturer@test.com"
        assert body["role"] == "lecturer"

    def test_get_me_unauthenticated(self, client: TestClient):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_get_me_invalid_token(self, client: TestClient):
        r = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
        assert r.status_code == 401
