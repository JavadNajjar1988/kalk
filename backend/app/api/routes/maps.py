from fastapi import APIRouter, HTTPException, UploadFile, File, status, Form
from fastapi.responses import FileResponse
from sqlalchemy import select, update as sa_update, delete as sa_delete, func
from pathlib import Path
import shutil
import uuid

from app.core.config import settings
from app.deps import DbSession
from app.models.map import OfflineMap
from app.schemas.map import (
    OfflineMapUpdate,
    OfflineMapResponse,
    OfflineMapListResponse,
    OfflineMapFolderRegister,
    FilesystemFolderListResponse,
    FilesystemFolderInfo,
)


router = APIRouter(prefix="/maps", tags=["maps"])

# مسیر پوشه ذخیره فایل‌ها
MAPS_DIR = Path("backend/static/maps")
MAPS_DIR.mkdir(exist_ok=True, parents=True)


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
    filename = map_obj.filename
    return f"{base_url}/data/{filename}/{{z}}/{{x}}/{{y}}.png"


def _filesystem_base_root() -> Path:
    root = Path(settings.FILESYSTEM_TILE_ROOT)
    root = root if root.is_absolute() else (Path.cwd() / root)
    try:
        return root.resolve()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="U.O3UOO� U_OUOU� U+U,O'U� UOOU?O� U+O'O_")


def _resolve_filesystem_folder(folder_value: str, base_root: Path) -> Path:
    cleaned = folder_value.strip()
    if not cleaned:
        return base_root

    raw = Path(cleaned)
    candidates = []
    if raw.is_absolute():
        candidates.append(raw)
    candidates.append(base_root / raw)
    if raw.parts and raw.parts[0] == base_root.name:
        candidates.append(base_root.parent / raw)

    resolved_path = None
    outside_base = False
    seen = set()

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

        try:
            candidate_resolved.relative_to(base_root)
        except ValueError:
            outside_base = True
            continue

        resolved_path = candidate_resolved
        break

    if resolved_path is None:
        if outside_base:
            raise HTTPException(status_code=400, detail="O_O3O�O�O3UO O\"U� OUOU+ U.O3UOO� U.O�OO� U+UOO3O�")
        raise HTTPException(status_code=404, detail="U_U^O'U� U+U,O'U� UOOU?O� U+O'O_")

    return resolved_path


def _map_to_response(map_obj: OfflineMap) -> OfflineMapResponse:
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


@router.get("/filesystem-folders", response_model=FilesystemFolderListResponse)
async def list_filesystem_folders():
    base_root = _filesystem_base_root()

    tile_counts: dict[Path, int] = {}
    for tile_path in base_root.rglob("*.sqlitedb"):
        try:
            rel_parts = tile_path.relative_to(base_root).parts
        except ValueError:
            continue

        anchor_parts = []
        for part in rel_parts:
            lower = part.lower()
            if lower.startswith("z") and lower[1:].isdigit():
                break
            anchor_parts.append(part)

        anchor_path = base_root if not anchor_parts else base_root.joinpath(*anchor_parts)
        tile_counts[anchor_path] = tile_counts.get(anchor_path, 0) + 1

    entries: list[FilesystemFolderInfo] = []
    for folder_path, count in sorted(tile_counts.items(), key=lambda item: str(item[0])):
        try:
            relative = folder_path.relative_to(base_root)
            relative_str = relative.as_posix() if relative.parts else "."
        except ValueError:
            continue

        label = base_root.name if folder_path == base_root else relative_str
        entries.append(
            FilesystemFolderInfo(
                label=label,
                folder=str(folder_path),
                relative_path=relative_str,
                approx_tile_count=count,
            )
        )

    if not entries and base_root.exists():
        entries.append(
            FilesystemFolderInfo(
                label=base_root.name,
                folder=str(base_root),
                relative_path=".",
                approx_tile_count=None,
            )
        )

    return FilesystemFolderListResponse(root=str(base_root), entries=entries)


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

    # جلوگیری از نام تکراری منطقی (ستون name یونیک است)
    existing = await session.execute(select(OfflineMap).where(OfflineMap.name == name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="نام نقشه تکراری است")

    ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = MAPS_DIR / unique_filename

    # ذخیره روی دیسک
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

    # ثبت در DB
    item = OfflineMap(
        name=name,
        filename=unique_filename,
        file_path=str(file_path),
        description=description or None,
        storage_type="mbtiles",
        is_active=False,
        file_size=file_size,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return _map_to_response(item)


@router.post("/register-folder", response_model=OfflineMapResponse)
async def register_folder_map(
    payload: OfflineMapFolderRegister,
    session: DbSession = None,
):
    """O�O"O� U_U^O'U� U+U,O'U� O"O O3OOrO�OO� z/x/y"""

    existing = await session.execute(select(OfflineMap).where(OfflineMap.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="U+OU. U+U,O'U� O�UcO�OO�UO OO3O�")

    base_root = _filesystem_base_root()
    folder_path = _resolve_filesystem_folder(payload.folder, base_root)

    # OO�U.UOU+OU+ OO� U^O�U^O_ O-O_OU,U, UOUc U?OUOU, chunk sqlite
    if next(folder_path.rglob("*.sqlitedb"), None) is None:
        raise HTTPException(status_code=400, detail="U�UOU+ UcOO'UO SQLite (.sqlitedb) O_O� OUOU+ U_U^O'U� U_UOO_O U+O'O_")

    item = OfflineMap(
        name=payload.name,
        filename=folder_path.name,
        file_path=str(folder_path),
        description=payload.description or None,
        storage_type="filesystem",
        is_active=False,
        file_size=None,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return _map_to_response(item)


@router.put("/{map_id}", response_model=OfflineMapResponse)
async def update_offline_map(
    map_id: int,
    map_update: OfflineMapUpdate,
    session: DbSession = None,
):
    """U^UOO�OUOO' U+U,O'U�: O�O�UOUOO� U+OU./O�U^OUOO- U^ U?O1OU,�?OO3OO�UO/O�UOO�U?O1OU,�?OO3OO�UO"""

    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="U+U,O'U� U.U^O�O_ U+O,O� UOOU?O� U+O'O_")

    # O�O�UOUOO� U+OU./O�U^OUOO-
    if map_update.name is not None:
        # OO�U.UOU+OU+ OO� O1O_U. O�UcO�OO�UO O"U^O_U+
        if map_update.name != item.name:
            dup = await session.execute(select(OfflineMap).where(OfflineMap.name == map_update.name))
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="U+OU. U+U,O'U� O�UcO�OO�UO OO3O�")
        item.name = map_update.name
    if map_update.description is not None:
        item.description = map_update.description

    # U?O1OU,�?OO3OO�UO/O�UOO�U?O1OU,�?OO3OO�UO
    if map_update.is_active is not None:
        if map_update.is_active:
            # U�U.U� O�O O�UOO�U?O1OU,OO OU+O�OrOO"UO O�O U?O1OU,
            await session.execute(sa_update(OfflineMap).values(is_active=False))
            item.is_active = True
        else:
            item.is_active = False

    await session.commit()
    await session.refresh(item)
    return _map_to_response(item)


@router.delete("/{map_id}")
async def delete_offline_map(
    map_id: int,
    session: DbSession = None,
):
    """O-O�U? U+U,O'U� O�U?U,OUOU+ (DB U^ O_O� O�U^O�O� OU.UcOU+ U?OUOU,)"""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="U+U,O'U� U_UOO_O U+O'O_")

    # O-O�U? O�UcU^O�O_
    await session.execute(sa_delete(OfflineMap).where(OfflineMap.id == map_id))
    await session.commit()

    if item.storage_type == "mbtiles":
        try:
            p = Path(item.file_path)
            if p.exists() and _is_safe_map_path(p):
                p.unlink()
        except Exception:
            pass

    return {"message": "O-O�U? O'O_", "id": map_id}


@router.get("/{map_id}/download")
async def download_offline_map(
    map_id: int,
    session: DbSession = None,
):
    """O_OU+U,U^O_ U?OUOU, .mbtiles U�U.OU+�?OO�U^O� UcU� O�U_U,U^O_ O'O_U� OO3O�"""
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == map_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="UOOU?O� U+O'O_")
    if item.storage_type != "mbtiles":
        raise HTTPException(status_code=400, detail="O_OU+U,U^O_ U?U,O� O\"O�OUO U+U,O'U؃?OU�OUO MBTiles O_O� O_O3O�O�O3 OO3O�")
    p = Path(item.file_path)
    if not p.exists() or not _is_safe_map_path(p):
        raise HTTPException(status_code=404, detail="U?OUOU, U.U^O�U^O_ U+UOO3O�")
    return FileResponse(path=str(p), filename=item.filename, media_type="application/x-sqlite3")


@router.get("/active", response_model=OfflineMapResponse)
async def get_active_map(session: DbSession = None):
    """O_O�UOOU?O� U+U,O'U� U?O1OU, OO� DB"""
    res = await session.execute(select(OfflineMap).where(OfflineMap.is_active == True))  # noqa: E712
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="U+U,O'U� U?O1OU,UO O�U+O,UOU. U+O'O_U� OO3O�")
    return _map_to_response(item)

