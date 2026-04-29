from app.api.routes.maps import _build_url_template
from app.api.routes.sdi import _build_tiles_url_template
from app.core.config import settings
from app.models.map import OfflineMap


def _offline_map(storage_type: str = "mbtiles") -> OfflineMap:
    return OfflineMap(
        id=42,
        name="Local MBTiles",
        filename="local-map.mbtiles",
        file_path="backend/static/maps/local-map.mbtiles",
        storage_type=storage_type,
        is_active=True,
    )


def test_active_mbtiles_url_uses_openlayers_tms_y_when_tileserver_url_is_external(monkeypatch):
    monkeypatch.setattr(settings, "TILESERVER_URL", "http://127.0.0.1:8480")

    assert (
        _build_url_template(_offline_map())
        == "http://127.0.0.1:8480/data/local-map/{z}/{x}/{-y}.png"
    )


def test_sdi_mbtiles_url_uses_same_origin_tileserver_and_openlayers_tms_y(monkeypatch):
    monkeypatch.setattr(settings, "TILESERVER_URL", "/tiles")

    assert _build_tiles_url_template(_offline_map()) == "/tiles/data/local-map/{z}/{x}/{-y}.png"


def test_filesystem_tile_url_stays_on_filesystem_cache(monkeypatch):
    monkeypatch.setattr(settings, "TILESERVER_URL", "http://127.0.0.1:8480")

    assert _build_url_template(_offline_map("filesystem")) == "/api/tile-cache/42/{z}/{x}/{y}"
    assert _build_tiles_url_template(_offline_map("filesystem")) == "/api/tile-cache/42/{z}/{x}/{y}"
