import asyncio
import json
import os
import pathlib

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from starlette.routing import Mount

TEST_ADMIN_PASSWORD = "Test-only-admin-password-2026"
os.environ.setdefault("ADMIN_BOOTSTRAP_PASSWORD", TEST_ADMIN_PASSWORD)

from app.main import app
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_session


TEST_DB_URL = os.getenv("TEST_DB_URL", "sqlite+aiosqlite:///./test_api.db")
test_engine = create_async_engine(TEST_DB_URL, future=True)
TestingSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)
asgi_transport = ASGITransport(app=app)
api_app = next(
    route.app
    for route in app.routes
    if isinstance(route, Mount) and route.path == settings.API_PREFIX
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()
    # Clean up sqlite file if created on disk
    if TEST_DB_URL.startswith("sqlite") and "memory" not in TEST_DB_URL:
        db_path = TEST_DB_URL.rsplit("///", 1)[-1]
        path = pathlib.Path(db_path)
        if path.exists():
            path.unlink()


@pytest.fixture(autouse=True)
async def override_session():
    async def _get_test_session():
        async with TestingSessionLocal() as session:
            yield session

    api_app.dependency_overrides[get_session] = _get_test_session
    try:
        yield
    finally:
        api_app.dependency_overrides.pop(get_session, None)


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=asgi_transport, base_url="http://test") as ac:
        resp = await ac.get(f"{settings.API_PREFIX}/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") is True
        assert data.get("data", {}).get("status") == "ok"


@pytest.mark.asyncio
async def test_auth_and_crud_scenarios():
    async with AsyncClient(transport=asgi_transport, base_url="http://test") as ac:
        # login
        resp = await ac.post(f"{settings.API_PREFIX}/auth/token", data={"username": "admin", "password": TEST_ADMIN_PASSWORD})
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # create
        payload = {"name": "سناریو تست", "description": "توضیح"}
        resp = await ac.post(f"{settings.API_PREFIX}/scenarios", json=payload, headers=headers)
        assert resp.status_code == 201
        created = resp.json()["data"]
        scn_id = created["id"]

        # list
        resp = await ac.get(f"{settings.API_PREFIX}/scenarios")
        assert resp.status_code == 200
        items = resp.json()["data"]
        assert any(i["id"] == scn_id for i in items)

        # get
        resp = await ac.get(f"{settings.API_PREFIX}/scenarios/{scn_id}")
        assert resp.status_code == 200

        # update
        resp = await ac.put(f"{settings.API_PREFIX}/scenarios/{scn_id}", json={"description": "جدید"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["data"]["description"] == "جدید"

        # delete
        resp = await ac.delete(f"{settings.API_PREFIX}/scenarios/{scn_id}", headers=headers)
        assert resp.status_code == 200 or resp.status_code == 204


@pytest.mark.asyncio
async def test_import_scenario_upsert():
    async with AsyncClient(transport=asgi_transport, base_url="http://test") as ac:
        resp = await ac.post(f"{settings.API_PREFIX}/auth/token", data={"username": "admin", "password": TEST_ADMIN_PASSWORD})
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        scenario_id = "upsert-test-scenario-id-001"
        payload = {
            "id": scenario_id,
            "type": "ORBAT-mapper",
            "name": "سناریو import اول",
        }
        files = {"file": ("scenario.json", json.dumps(payload, ensure_ascii=False), "application/json")}

        resp = await ac.post(f"{settings.API_PREFIX}/scenarios/import", headers=headers, files=files)
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["id"] == scenario_id
        assert data["importAction"] == "created"
        assert data["name"] == "سناریو import اول"

        payload["name"] = "سناریو import به‌روز"
        files = {"file": ("scenario.json", json.dumps(payload, ensure_ascii=False), "application/json")}
        resp = await ac.post(f"{settings.API_PREFIX}/scenarios/import", headers=headers, files=files)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["id"] == scenario_id
        assert data["importAction"] == "updated"
        assert data["name"] == "سناریو import به‌روز"

        await ac.delete(f"{settings.API_PREFIX}/scenarios/{scenario_id}", headers=headers)

