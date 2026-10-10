"""
Tests run against an isolated in-memory SQLite database, not the real
Postgres instance — fast, fully isolated per test, and the models are
written to be portable across both (JSON instead of native ARRAY,
native_enum=False, etc. — see app/models/scheme.py). Production and
local development still always use Postgres via DATABASE_URL.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.scheme import DataSourceRegistry


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # SQLite doesn't enforce foreign keys by default; enable it so
    # cascade/FK behaviour in tests matches Postgres.
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def anon_client(db_session):
    """A client with no signed-in user."""

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def register_user(client: TestClient, email: str, password: str = "correct-horse-battery") -> dict:
    """Registers an account and returns its Authorization header."""
    response = client.post("/api/auth/register", json={"email": email, "password": password})
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def client(anon_client):
    """A client signed in as a freshly registered user — profile
    endpoints all require authentication."""
    anon_client.headers.update(register_user(anon_client, "test-user@example.com"))
    return anon_client


@pytest.fixture()
def data_source(db_session) -> DataSourceRegistry:
    source = DataSourceRegistry(
        key="test-source",
        provider_name="Test Provider",
        dataset_name="Test Dataset",
        license="Test-License",
        source_url="https://example.org/dataset",
        attribution="Test attribution",
        notes="Synthetic test data — not real government data.",
        is_official_government_source=False,
    )
    db_session.add(source)
    db_session.commit()
    db_session.refresh(source)
    return source
