from fastapi import APIRouter, HTTPException, UploadFile, File, status, Form
from fastapi.responses import FileResponse
from sqlalchemy import select, delete as sa_delete, func
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
import logging
import shutil
import subprocess
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.deps import DbSession
from app.models.map import OfflineMap, TileRoot
from app.schemas.map import (
    OfflineMapUpdate,
    OfflineMapResponse,
    OfflineMapListResponse,
    OfflineMapFolderRegister,
    FilesystemFolderListResponse,
    FilesystemFolderInfo,
)
from app.services.sdi.harvest import harvest_offline_folder, harvest_offline_mbtiles


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maps", tags=["maps"])

MAPS_DIR = Path("backend/static/maps")
MAPS_DIR.mkdir(exist_ok=True, parents=True)


def _restart_tileserver() -> None:
    try:
        subprocess.Popen(
            ["docker", "restart", "tileserver"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        logger.info("tileserver restart triggered")
    except Exception as e:
        logger.warning("Could not restart tileserver: %s", e)


def _is_safe_map_path(p: Path) -> bool:
    try:
        p.resolve().relative_to(MAPS_DIR.resolve())
        return True
    except Exception:
        return False


def _build_url_template(map_obj: OfflineMap) -> str:
    if map_obj.storage_type == "filesystem":
        return f"/api/tile-cache/{map_obj.id}/{{z}}/{{x}}/{{y}}"
    base_url = settings.TILESERVER_URL.rstrip("/")
    tileset = Path(map_obj.filename or map_obj.file_path).name
    if tileset.lower().endswith(".mbtiles"):
        tileset = tileset[:-8]
    return f"{base_url}/data/{tileset}/{{z}}/{{x}}/{{-y}}.png"


def _filesystem_base_root() -> Path:
    root = Path(settings.FILESYSTEM_TILE_ROOT)
    root = root if root.is_absolute() else (Path.cwd() / root)
    try:
        return root.resolve()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="پوشه ریشه نقشه یافت نشد")


def _env_tile_roots() -> list[Path]:
    """Roots from FILESYSTEM_TILE_ROOT + FILESYSTEM_TILE_EXTRA_ROOTS (env / .env)."""
    roots: list[Path] = []
    try:
        roots.append(_filesystem_base_root())
    except HTTPException:
        pass

    extra = (settings.FILESYSTEM_TILE_EXTRA_ROOTS or "").strip()
    if extra:
        for raw in extra.split(","):
            raw = raw.strip()
            if not raw:
                continue
            p = Path(raw)
            p = p if p.is_absolute() else (Path.cwd() / p)
            try:
                resolved = p.resolve()
                if resolved.exists() and resolved.is_dir():
                    roots.append(resolved)
            except Exception:
                continue
    return roots


async def _all_tile_roots(session: AsyncSession) -> list[Path]:
    """Return roots from env + admin-managed roots in DB."""
    roots = _env_tile_roots()

    res = await session.execute(select(TileRoot).where(TileRoot.is_active == True))  # noqa: E712
    for row in res.scalars().all():
        p = Path(row.path)
        try:
            resolved = p.resolve()
            if resolved.exists() and resolved.is_dir() and resolved not in roots:
                roots.append(resolved)
        except Exception:
            continue
    return roots


def _is_under_allowed_roots(target: Path, roots: list[Path]) -> bool:
    """Check if target path is under any of the allowed tile roots."""
    resolved = target.resolve()
    for root in roots:
        try:
            resolved.relative_to(root)
            return True
        except ValueError:
            continue
    return False


async def _resolve_filesystem_folder(folder_value: str, session: AsyncSession) -> Path:
    """Resolve a folder path against all allowed tile roots.

    Accepts absolute paths (if they fall under an allowed root) and
    relative paths (resolved against each root in order).
    """
    cleaned = folder_value.strip()
    if not cleaned:
        roots = await _all_tile_roots(session)
        if roots:
            return roots[0]
        raise HTTPException(status_code=404, detail="پوشه ریشه نقشه یافت نشد")

    roots = await _all_tile_roots(session)
    raw = Path(cleaned)

    candidates: list[Path] = []
    if raw.is_absolute():
        candidates.append(raw)
    for root in roots:
        candidates.append(root / raw)
        if raw.parts and raw.parts[0] == root.name:
            candidates.append(root.parent / raw)

    seen: set[str] = set()
    for candidate in candidates:
        try:
            candidate_resolved = candidate.resolve()
        except FileNotFoundError:
            continue

        key = str(candidate_resolved)
        if key in seen:
            continue
        seen.add(key)

        if not candidate_resolved.exists() or not candidate_resolved.is_dir():
            continue

        if _is_under_allowed_roots(candidate_resolved, roots):
            return candidate_resolved

    raise HTTPException(
        status_code=400,
        detail="مسیر مورد نظر در محدوده مسیرهای مجاز قرار ندارد. "
               "مسیرهای مجاز را در تنظیمات FILESYSTEM_TILE_EXTRA_ROOTS اضافه کنید.",
    )


def _map_to_response(map_obj: OfflineMap) -> OfflineMapResponse:
    meta = (
        harvest_offline_folder(map_obj.file_path)
        if map_obj.storage_type == "filesystem"
        else harvest_offline_mbtiles(map_obj.file_path)
    )
    return OfflineMapResponse(
        id=map_obj.id,
        name=map_obj.name,
        description=map_obj.description,
        filename=map_obj.filename,
        file_path=map_obj.file_path,
        storage_type=map_obj.storage_type,
        is_active=map_obj.is_active,
        file_size=map_obj.file_size,
        created_at=map_obj.created_at,
        updated_at=map_obj.updated_at,
        url_template=_build_url_template(map_obj),
        minzoom=meta.get("minzoom"),
        maxzoom=meta.get("maxzoom"),
    )


@router.get("", response_model=OfflineMapListResponse)
async def get_offline_maps(
    skip: int = 0,
    limit: int = 100,
    session: DbSession = None,
):
    """دریافت لیست نقشه‌های آفلاین از DB"""
    total_res = await session.execute(select(func.count(OfflineMap.id)))
    total = total_res.scalar_one() or 0

    result = await session.execute(
        select(OfflineMap).order_by(OfflineMap.created_at.desc()).offset(skip).limit(limit)
    )
    maps = result.scalars().all()
    return OfflineMapListResponse(
        maps=[_map_to_response(m) for m in maps],
        total=total,
    )


def _scan_root_for_folders(root: Path) -> list[FilesystemFolderInfo]:
    """Scan a single root for tile folders containing .sqlitedb files."""
    tile_counts: dict[Path, int] = {}
    for tile_path in root.rglob("*.sqlitedb"):
        try:
            rel_parts = tile_path.relative_to(root).parts
        except ValueError:
            continue

        anchor_parts = []
        for part in rel_parts:
            lower = part.lower()
            if lower.startswith("z") and lower[1:].isdigit():
                break
            anchor_parts.append(part)

        anchor_path = root if not anchor_parts else root.joinpath(*anchor_parts)
        tile_counts[anchor_path] = tile_counts.get(anchor_path, 0) + 1

    entries: list[FilesystemFolderInfo] = []
    for folder_path, count in sorted(tile_counts.items(), key=lambda item: str(item[0])):
        try:
            relative = folder_path.relative_to(root)
            relative_str = relative.as_posix() if relative.parts else "."
        except ValueError:
            continue

        label = root.name if folder_path == root else f"{root.name}/{relative_str}"
        entries.append(
            FilesystemFolderInfo(
                label=label,
                folder=str(folder_path),
                relative_path=relative_str,
                approx_tile_count=count,
            )
        )

    if not entries and root.exists():
        entries.append(
            FilesystemFolderInfo(
                label=root.name,
                folder=str(root),
                relative_path=".",
                approx_tile_count=None,
            )
        )

    return entries


@router.get("/filesystem-folders", response_model=FilesystemFolderListResponse)
async def list_filesystem_folders(session: DbSession = None):
    """List tile folders from all allowed roots (primary + extra + DB)."""
    roots = await _all_tile_roots(session)

    all_entries: list[FilesystemFolderInfo] = []
    for root in roots:
        all_entries.extend(_scan_root_for_folders(root))

    primary_root = roots[0] if roots else Path(".")
    return FilesystemFolderListResponse(root=str(primary_root), entries=all_entries)


@router.post("/upload", response_model=OfflineMapResponse)
async def upload_offline_map(
    name: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    session: DbSession = None,
):
    """آپلود فایل نقشه آفلاین و ثبت در DB"""

    if not file.filename.lower().endswith(".mbtiles"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="فقط فایل‌های .mbtiles قابل آپلود هستند",
        )

    existing = await session.execute(select(OfflineMap).where(OfflineMap.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام نقشه تکراری است")

    ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = MAPS_DIR / unique_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"خطا در آپلود فایل: {e}")

    file_size = file_path.stat().st_size if file_path.exists() else None

    item = OfflineMap(
        name=name,
        filename=unique_filename,
        file_path=str(file_path),
        description=description or None,
        storage_type="mbtiles",
        is_active=False,
        file_size=file_size,
    )
    try:
        session.add(item)
        await session.commit()
        await session.refresh(item)
    except SQLAlchemyError as e:
        await session.rollback()
        try:
            if file_path.exists() and _is_safe_map_path(file_path):
                file_path.unlink()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Database error while saving map: {e}")

    _restart_tileserver()
    return _map_to_response(item)


@router.post("/register-folder", response_model=OfflineMapResponse)
async def register_folder_map(
    payload: OfflineMapFolderRegister,
    session: DbSession = None,
):
    """ثبت پوشه تایل‌ها (ساختار z/x/y) از هر مسیر مجاز."""

    existing = await session.execute(select(OfflineMap).where(OfflineMap.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام نقشه تکراری است")

    folder_path = await _resolve_filesystem_folder(payload.folder, session)

    if next(folder_path.rglob("*.sqlitedb"), None) is None:
        raise HTTPException(
            status_code=400,
            detail="هیچ فایل SQLite (.sqlitedb) در پوشه یافت نشد",
        )

    item = OfflineMap(
        name=payload.name,
        filename=folder_path.name,
        file_path=str(folder_path),
        description=payload.description or None,
        storage_type="filesystem",
        is_active=False,
        file_size=None,
    )
    try:
        session.add(item)
        await session.commit()
        await session.refresh(item)
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while registering folder map: {e}")
    return _map_to_response(item)


@router.put("/{map_id}", response_model=OfflineMapResponse)
async def update_offline_map(
    map_id: int,
    map_update: OfflineMapUpdate,
    session: DbSession = None,
):
    """ویرایش نقشه: نام/توضیح و فعال‌سازی/غیرفعال‌سازی"""

    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="نقشه یافت نشد")

    if map_update.name is not None:
        if map_update.name != item.name:
            dup = await session.execute(select(OfflineMap).where(OfflineMap.name == map_update.name))
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="نام نقشه تکراری است")
        item.name = map_update.name
    if map_update.description is not None:
        item.description = map_update.description

    if map_update.is_active is not None:
        item.is_active = bool(map_update.is_active)

    await session.commit()
    await session.refresh(item)
    return _map_to_response(item)


@router.delete("/{map_id}")
async def delete_offline_map(
    map_id: int,
    session: DbSession = None,
):
    """حذف نقشه آفلاین (DB و در صورت mbtiles فایل)"""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="نقشه یافت نشد")

    await session.execute(sa_delete(OfflineMap).where(OfflineMap.id == map_id))
    await session.commit()

    if item.storage_type == "mbtiles":
        try:
            p = Path(item.file_path)
            if p.exists() and _is_safe_map_path(p):
                p.unlink()
        except Exception:
            pass

    return {"message": "حذف شد", "id": map_id}


@router.get("/{map_id}/download")
async def download_offline_map(
    map_id: int,
    session: DbSession = None,
):
    """دانلود فایل .mbtiles"""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="یافت نشد")
    if item.storage_type != "mbtiles":
        raise HTTPException(status_code=400, detail="دانلود فقط برای نقشه‌های MBTiles در دسترس است")
    p = Path(item.file_path)
    if not p.exists() or not _is_safe_map_path(p):
        raise HTTPException(status_code=404, detail="فایل یافت نشد")
    return FileResponse(path=str(p), filename=item.filename, media_type="application/x-sqlite3")


@router.get("/active", response_model=OfflineMapListResponse)
async def get_active_maps(session: DbSession = None):
    """دریافت نقشه‌های فعال از DB"""
    res = await session.execute(
        select(OfflineMap).where(OfflineMap.is_active == True).order_by(OfflineMap.created_at.desc())  # noqa: E712
    )
    items = res.scalars().all()
    return OfflineMapListResponse(
        maps=[_map_to_response(item) for item in items],
        total=len(items),
    )


@router.get("/{map_id}", response_model=OfflineMapResponse)
async def get_offline_map_by_id(map_id: int, session: DbSession = None):
    """جزئیات یک نقشه آفلاین (برای شبیه‌ساز / Cesium — url_template)."""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="نقشه یافت نشد")
    return _map_to_response(item)
