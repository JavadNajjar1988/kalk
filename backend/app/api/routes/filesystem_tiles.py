from __future__ import annotations

from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy import select

from app.core.config import settings
from app.deps import DbSession
from app.models.map import OfflineMap
from app.services.filesystem_tiles import get_tile_service


router = APIRouter(prefix="/tile-cache", tags=["tile-cache"])


def _get_base_root() -> Path:
    root = Path(settings.FILESYSTEM_TILE_ROOT)
    root = root if root.is_absolute() else (Path.cwd() / root)
    try:
        return root.resolve()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="پوشه ریشه نقشه یافت نشد")


@router.get("/{map_id}/{z}/{x}/{y}")
async def get_filesystem_tile(
    map_id: int,
    z: int,
    x: int,
    y: int,
    session: DbSession = None,
):
    """
    سرو کاشی‌ها از پوشه‌های chunk شده SQLite (MapTiler) برای نقشه ثبت شده.
    """
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    offline_map = res.scalar_one_or_none()
    if offline_map is None or offline_map.storage_type != "filesystem":
        raise HTTPException(status_code=404, detail="نقشه مورد نظر یافت نشد")

    base_root = _get_base_root()
    tile_root = Path(offline_map.file_path)
    if not tile_root.exists():
        raise HTTPException(status_code=404, detail="پوشه نقشه در دسترس نیست")

    try:
        tile_root.resolve().relative_to(base_root)
    except ValueError:
        raise HTTPException(status_code=400, detail="مسیر نقشه معتبر نیست")

    service = get_tile_service(tile_root.resolve())
    payload, media_type = service.get_tile(z, x, y)
    return Response(content=payload, media_type=media_type)
