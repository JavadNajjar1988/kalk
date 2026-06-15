import pytest

from app.api.routes.maps import _build_url_template
from app.api.routes.sdi import _build_tiles_url_template
from app.core.config import settings
from app.models.map import OfflineMap
from app.models.sdi import SDIMap
from app.services.sdi.publish import _public_catalog_path, generate_layers_json


def _offline_map(storage_type: str = "mbtiles") -> OfflineMap:
    return OfflineMap(
        id=42,
        name="Local MBTiles",
        filename="local-map.mbtiles",
        file_path="backend/static/maps/local-map.mbtiles",
        storage_type=storage_type,
        is_active=True,
    )


def test_active_mbtiles_url_uses_internal_mbtiles_tile_cache(monkeypatch):
    monkeypatch.setattr(settings, "TILESERVER_URL", "http://127.0.0.1:8480")

    assert (
        _build_url_template(_offline_map())
        == "/api/tile-cache/mbtiles/42/{z}/{x}/{y}"
    )


def test_sdi_mbtiles_url_uses_internal_mbtiles_tile_cache(monkeypatch):
    monkeypatch.setattr(settings, "TILESERVER_URL", "/tiles")

    assert _build_tiles_url_template(_offline_map()) == "/api/tile-cache/mbtiles/42/{z}/{x}/{y}"


def test_filesystem_tile_url_stays_on_filesystem_cache(monkeypatch):
    monkeypatch.setattr(settings, "TILESERVER_URL", "http://127.0.0.1:8480")

    assert _build_url_template(_offline_map("filesystem")) == "/api/tile-cache/42/{z}/{x}/{y}"
    assert _build_tiles_url_template(_offline_map("filesystem")) == "/api/tile-cache/42/{z}/{x}/{y}"


def test_catalog_rewrites_legacy_localhost_tileserver_urls_to_same_origin_tiles():
    legacy_path = "http://127.0.0.1:8480/data/local-map/{z}/{x}/{-y}.png"
    localhost_path = "http://localhost:8480/data/local-map/{z}/{x}/{-y}.png"

    assert _public_catalog_path(legacy_path) == "/tiles/data/local-map/{z}/{x}/{-y}.png"
    assert _public_catalog_path(localhost_path) == "/tiles/data/local-map/{z}/{x}/{-y}.png"
    assert _public_catalog_path("/tiles/data/local-map/{z}/{x}/{-y}.png") == "/tiles/data/local-map/{z}/{x}/{-y}.png"


class _FakeResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return self

    def all(self):
        return self._items


class _FakeSession:
    def __init__(self, items):
        self._items = items

    async def execute(self, _stmt):
        return _FakeResult(self._items)


@pytest.mark.asyncio
async def test_catalog_published_mbtiles_uses_internal_tile_cache(monkeypatch, tmp_path):
    catalog = tmp_path / "layers.json"
    monkeypatch.setattr(settings, "CATALOG_PATH", str(catalog))
    monkeypatch.setattr(settings, "CATALOG_TMP_PATH", str(tmp_path / "layers.tmp.json"))
    monkeypatch.setattr(settings, "CATALOG_BACKUP_PATH", str(tmp_path / "layers.bak.json"))

    sdi_map = SDIMap(
        id=7,
        title="Local MBTiles",
        source_type="xyz_mbtiles",
        url_or_path="http://127.0.0.1:8480/data/local-map/{z}/{x}/{-y}.png",
        status="published",
        extra_metadata={"offline_map_id": 42},
        version="v1",
    )

    payload = await generate_layers_json(_FakeSession([sdi_map]))

    assert payload["layers"][0]["path"] == "/api/tile-cache/mbtiles/42/{z}/{x}/{y}"
