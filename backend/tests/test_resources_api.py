"""تست‌های پایه برای API منابع (فاز ۱ پلن UnitDetails Resource Integration)."""

import io
import os
import pathlib

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_session
from app.main import app


@pytest_asyncio.fixture
async def client(tmp_path):
    """کلاینت ASGI با دیتابیس sqlite موقتی per-test."""
    db_path = tmp_path / "resources.db"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_path.as_posix()}", future=True
    )
    TestingSessionLocal = async_sessionmaker(
        test_engine, expire_on_commit=False, class_=AsyncSession
    )

    # ساخت فقط جداول منابع (سایر مدل‌های پروژه روی sqlite قابل ساخت نیستند)
    from app.models.resource import Resource, ResourceMedia  # noqa: F401

    tables = [Resource.__table__, ResourceMedia.__table__]
    async with test_engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, tables=tables))

    async def _get_test_session():
        async with TestingSessionLocal() as session:
            yield session

    # mounted /api کاربرد override جداگانه دارد
    from starlette.routing import Mount

    api_apps = [r.app for r in app.routes if isinstance(r, Mount)]

    app.dependency_overrides[get_session] = _get_test_session
    for sub in api_apps:
        sub.dependency_overrides[get_session] = _get_test_session
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            yield ac
    finally:
        app.dependency_overrides.pop(get_session, None)
        for sub in api_apps:
            sub.dependency_overrides.pop(get_session, None)
        await test_engine.dispose()


@pytest.mark.asyncio
async def test_resource_crud_flow(client: AsyncClient):
    payload = {
        "type": "equipment",
        "name": "تانک M1A1",
        "code": "EQ-M1A1",
        "description": "نمونه تستی",
        "status": "available",
        "metadata": {"manufacturer": "تستی", "type": "armor"},
    }
    resp = await client.post(f"{settings.API_PREFIX}/resources", json=payload)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["success"] is True
    created = body["data"]
    resource_id = created["id"]
    assert created["type"] == "equipment"
    assert created["metadata"]["manufacturer"] == "تستی"

    resp = await client.get(f"{settings.API_PREFIX}/resources/{resource_id}")
    assert resp.status_code == 200
    got = resp.json()["data"]
    assert got["id"] == resource_id

    resp = await client.get(
        f"{settings.API_PREFIX}/resources/search",
        params={"q": "M1A1", "type": "equipment"},
    )
    assert resp.status_code == 200
    results = resp.json()["data"]
    assert any(r["id"] == resource_id for r in results)

    resp = await client.put(
        f"{settings.API_PREFIX}/resources/{resource_id}",
        json={"metadata": {"manufacturer": "جدید"}, "status": "assigned"},
    )
    assert resp.status_code == 200
    updated = resp.json()["data"]
    assert updated["status"] == "assigned"
    assert updated["metadata"]["manufacturer"] == "جدید"

    resp = await client.get(
        f"{settings.API_PREFIX}/resources",
        params={"type": "equipment", "limit": 10},
    )
    assert resp.status_code == 200
    listing = resp.json()["data"]
    assert listing["total"] >= 1
    assert any(r["id"] == resource_id for r in listing["items"])

    resp = await client.delete(f"{settings.API_PREFIX}/resources/{resource_id}")
    assert resp.status_code in (200, 204)


@pytest.mark.asyncio
async def test_resource_bulk_import(client: AsyncClient):
    items = [
        {
            "type": "personnel",
            "name": "علی رضایی",
            "code": "P-001",
            "metadata": {"firstName": "علی", "lastName": "رضایی"},
        },
        {
            "type": "equipment",
            "name": "خودرو زرهی",
            "code": "EQ-A1",
            "metadata": {"type": "armor"},
        },
        {
            "type": "invalid_type",
            "name": "نامعتبر",
        },
    ]
    resp = await client.post(
        f"{settings.API_PREFIX}/resources/bulk-import",
        json={"items": items},
    )
    assert resp.status_code == 200, resp.text
    result = resp.json()["data"]
    assert result["created"] == 2
    assert result["skipped"] >= 1


@pytest.mark.asyncio
async def test_resource_media_upload_and_serve(client: AsyncClient):
    resp = await client.post(
        f"{settings.API_PREFIX}/resources",
        json={"type": "equipment", "name": "تجهیز با تصویر"},
    )
    assert resp.status_code == 201, resp.text
    rid = resp.json()["data"]["id"]

    png_bytes = (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
        b"\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
    resp = await client.post(
        f"{settings.API_PREFIX}/resources/media/upload",
        files=files,
        data={"resource_id": rid, "caption": "تصویر تست"},
    )
    assert resp.status_code == 200, resp.text
    media = resp.json()["data"]
    assert media["resource_id"] == rid
    assert media["caption"] == "تصویر تست"
    assert media["url"].endswith(f"/{media['id']}/file")

    resp = await client.get(
        f"{settings.API_PREFIX}/resources/media/{media['id']}/file"
    )
    assert resp.status_code == 200
    assert resp.content == png_bytes

    resp = await client.delete(
        f"{settings.API_PREFIX}/resources/media/{media['id']}"
    )
    assert resp.status_code in (200, 204)
