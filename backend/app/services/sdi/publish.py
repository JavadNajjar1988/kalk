import json
import hashlib
import os
from typing import Any
from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.sdi import SDIMap

LEGACY_LOCAL_TILESERVER_NETLOCS = {"127.0.0.1:8480", "localhost:8480"}


def _sha256_of_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _public_catalog_path(path: str) -> str:
    parsed = urlsplit(path)
    if parsed.scheme in {"http", "https"} and parsed.netloc in LEGACY_LOCAL_TILESERVER_NETLOCS:
        if parsed.path.startswith("/data/"):
            suffix = parsed.path
            if parsed.query:
                suffix = f"{suffix}?{parsed.query}"
            return f"/tiles{suffix}"
    return path


def _catalog_path_for_map(m: SDIMap) -> str:
    extra = m.extra_metadata if isinstance(m.extra_metadata, dict) else {}
    offline_map_id = extra.get("offline_map_id")
    if m.source_type == "xyz_mbtiles" and offline_map_id:
        api_prefix = settings.API_PREFIX.rstrip("/")
        return f"{api_prefix}/tile-cache/mbtiles/{offline_map_id}/{{z}}/{{x}}/{{y}}"
    return _public_catalog_path(m.url_or_path)


async def generate_layers_json(session: AsyncSession) -> dict[str, Any]:
    """Build layers.json payload from published SDI maps.

    Returns the in-memory dict; also writes atomically to disk.
    """
    res = await session.execute(select(SDIMap).where(SDIMap.status == "published"))
    items: list[SDIMap] = list(res.scalars().all() or [])

    layers: list[dict[str, Any]] = []
    for m in items:
        entry: dict[str, Any] = {
            "id": f"{(m.title or '').lower().replace(' ', '-')}-{m.version or 'v1'}",
            "title": m.title,
            "category": m.category or None,
            "description": m.description or None,
            "type": ("raster-xyz" if m.source_type.startswith("xyz") else m.source_type),
            "source": m.source_type,
            "path": _catalog_path_for_map(m),
            "srs": m.srs or None,
            "minzoom": m.minzoom,
            "maxzoom": m.maxzoom,
            "updated": (m.updated_at.isoformat() if m.updated_at else None),
            "status": "published",
            "ui": {
                "defaultOpacity": 1.0,
                "visibleByDefault": False,
                "tags": [],
            },
            "admin": {
                "map_id": m.id,
                "version": m.version or "v1",
                "checksum": m.hash or None,
                "roles": m.roles or settings.DEFAULT_ROLES,
                "scenario_ids": m.scenario_ids or [],
            },
            "bbox": m.bbox,
        }
        # WMS/WMTS clients need the OGC layer name (stored on SDIMap, omitted before).
        if m.layer_name:
            entry["layer_name"] = m.layer_name
        if m.format:
            entry["format"] = m.format
        layers.append(entry)

    payload: dict[str, Any] = {
        "schema_version": 1,
        "catalog_version": None,  # filled after hashing
        "layers": layers,
    }

    # compute version from content
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    version = _sha256_of_bytes(raw)
    payload["catalog_version"] = version

    # write atomically
    tmp_path = settings.CATALOG_TMP_PATH
    final_path = settings.CATALOG_PATH
    bak_path = settings.CATALOG_BACKUP_PATH
    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    with open(tmp_path, "wb") as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8"))

    # keep last known-good catalog for rollback
    try:
        if os.path.exists(final_path):
            os.replace(final_path, bak_path)
    except Exception:
        # best-effort backup; don't fail publish if backup can't be written
        pass
    os.replace(tmp_path, final_path)

    return payload
