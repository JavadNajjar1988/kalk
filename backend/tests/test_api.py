import asyncio
import os

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.config import settings
from app.db.session import AsyncSessionLocal, engine
from app.db.base import Base


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True, scope="session")
async def setup_db():
    # Create tables in test session (for simple tests; in real-world use migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get(f"{settings.API_PREFIX}/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") is True
        assert data.get("data", {}).get("status") == "ok"


@pytest.mark.asyncio
async def test_auth_and_crud_scenarios():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # login
        resp = await ac.post(f"{settings.API_PREFIX}/auth/token", data={"username": "admin", "password": "admin123"})
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


