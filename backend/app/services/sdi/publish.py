import json
import hashlib
import os
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.sdi import SDIMap


def _sha256_of_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


async def generate_layers_json(session: AsyncSession) -> dict[str, Any]:
    """Build layers.json payload from published SDI maps.

    Returns the in-memory dict; also writes atomically to disk.
    """
    res = await session.execute(select(SDIMap).where(SDIMap.status == "published"))
    items: list[SDIMap] = list(res.scalars().all() or [])

    layers: list[dict[str, Any]] = []
    for m in items:
        layers.append(
            {
                "id": f"{(m.title or '').lower().replace(' ', '-')}-{m.version or 'v1'}",
                "title": m.title,
                "category": m.category or None,
                "description": m.description or None,
                "type": ("raster-xyz" if m.source_type.startswith("xyz") else m.source_type),
                "source": m.source_type,
                "path": m.url_or_path,
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
                },
                "bbox": m.bbox,
            }
        )

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
    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    with open(tmp_path, "wb") as f:
        f.write(json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8"))
    os.replace(tmp_path, final_path)

    return payload
