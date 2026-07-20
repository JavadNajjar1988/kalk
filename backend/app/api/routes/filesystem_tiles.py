from __future__ import annotations

from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy import select

from app.deps import DbSession
from app.models.map import OfflineMap
from app.api.routes.maps import _all_tile_roots, _is_under_allowed_roots, MAPS_DIR
from app.services.filesystem_tiles import get_tile_service
from app.services.mbtiles_tiles import get_mbtiles_service


router = APIRouter(prefix="/tile-cache", tags=["tile-cache"])


# NOTE: Static path "/mbtiles/..." MUST be defined BEFORE the dynamic
# "/{map_id}/..." route, otherwise FastAPI tries to parse "mbtiles" as int.

@router.get("/mbtiles/{map_id}/{z}/{x}/{y}")
async def get_mbtiles_tile(
    map_id: int,
    z: int,
    x: int,
    y: int,
    session: DbSession = None,
):
    """سرو کاشی‌ها مستقیم از فایل MBTiles — بدون نیاز به TileServer-GL."""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    offline_map = res.scalar_one_or_none()
    if offline_map is None or offline_map.storage_type != "mbtiles":
        raise HTTPException(status_code=404, detail="نقشه MBTiles یافت نشد")

    # Resolve file path — DB may store relative paths from project root
    file_path = Path(offline_map.file_path)
    if not file_path.exists():
        # Fallback: try resolving filename inside MAPS_DIR
        file_path = MAPS_DIR / offline_map.filename
    if not file_path.exists():
        # Fallback 2: try just the filename in static/maps/
        file_path = Path("static/maps") / offline_map.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="فایل MBTiles در دسترس نیست")

    service = get_mbtiles_service(file_path.resolve())
    payload, media_type = service.get_tile(z, x, y)
    return Response(
        content=payload,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{map_id}/{z}/{x}/{y}")
async def get_filesystem_tile(
    map_id: int,
    z: int,
    x: int,
    y: int,
    session: DbSession = None,
):
    """سرو کاشی‌ها از پوشه‌های chunk شده SQLite برای نقشه ثبت شده."""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    offline_map = res.scalar_one_or_none()
    if offline_map is None or offline_map.storage_type != "filesystem":
        raise HTTPException(status_code=404, detail="نقشه مورد نظر یافت نشد")

    tile_root = Path(offline_map.file_path)
    if not tile_root.exists():
        raise HTTPException(status_code=404, detail="پوشه نقشه در دسترس نیست")

    roots = await _all_tile_roots(session)
    if not _is_under_allowed_roots(tile_root, roots):
        raise HTTPException(status_code=400, detail="مسیر نقشه معتبر نیست")

    service = get_tile_service(tile_root.resolve())
    payload, media_type = service.get_tile(z, x, y)
    return Response(
        content=payload,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
