"""
Pytest configuration and shared fixtures.

Uses an in-memory SQLite database so no real PostgreSQL is needed for tests.
The FastAPI app's `get_db` dependency is overridden to use the test session.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base, get_db
from app.main import app

# ---------------------------------------------------------------------------
# In-memory SQLite engine — isolated per-test-session
# ---------------------------------------------------------------------------
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all ORM tables once per test session, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Yield a fresh DB session per test, roll back on teardown."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db):
    """TestClient with get_db overridden to use the test session."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def _register_and_login(client: TestClient, email: str, password: str, full_name: str, role: str, **extra) -> str:
    payload = {"email": email, "password": password, "full_name": full_name, "role": role, **extra}
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


@pytest.fixture()
def admin_token(client: TestClient) -> str:
    return _register_and_login(client, "admin@test.com", "adminpass", "Admin User", "admin")


@pytest.fixture()
def lecturer_token(client: TestClient) -> str:
    return _register_and_login(client, "lecturer@test.com", "lecturerpass", "Lecturer User", "lecturer")


@pytest.fixture()
def student_token(client: TestClient) -> str:
    return _register_and_login(
        client,
        "student@test.com",
        "studentpass",
        "Student User",
        "student",
        student_number="STU001",
        department="Computer Science",
        year_level=2,
    )
