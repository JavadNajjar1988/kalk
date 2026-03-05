from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select

from app.core.config import settings
from app.core.response import success
from app.core.security import get_current_user
from app.deps import DbSession
from app.models.dashboard_header import DashboardHeaderConfig, DashboardHeaderEntry
from app.schemas.dashboard_header import (
    DashboardHeaderEntryCreate,
    DashboardHeaderEntryUpdate,
    DashboardHeaderSettingsUpdate,
)


router = APIRouter(prefix="/dashboard-header", tags=["dashboard-header"])

HEADER_IMAGE_DIR = Path(settings.SCENARIO_IMAGE_DIR)
if not HEADER_IMAGE_DIR.is_absolute():
    HEADER_IMAGE_DIR = Path.cwd() / HEADER_IMAGE_DIR
HEADER_IMAGE_DIR = HEADER_IMAGE_DIR / "dashboard-header"
HEADER_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def _serialize_entry(entry: DashboardHeaderEntry | None) -> dict | None:
    if entry is None:
        return None
    return {
        "id": entry.id,
        "quoteText": entry.quote_text,
        "personName": entry.person_name,
        "personPosition": entry.person_position,
        "personImage": entry.person_image,
        "createdAt": entry.created_at.isoformat() if entry.created_at else None,
        "updatedAt": entry.updated_at.isoformat() if entry.updated_at else None,
    }


async def _get_or_create_config(db: DbSession) -> DashboardHeaderConfig:
    config = await db.get(DashboardHeaderConfig, 1)
    if config is not None:
        return config

    config = DashboardHeaderConfig(id=1, enabled=True, active_entry_id=None)
    db.add(config)
    await db.flush()
    return config


async def _get_active_entry(db: DbSession, config: DashboardHeaderConfig) -> DashboardHeaderEntry | None:
    if config.active_entry_id is None:
        return None
    return await db.get(DashboardHeaderEntry, config.active_entry_id)


def _settings_payload(
    config: DashboardHeaderConfig,
    active_entry: DashboardHeaderEntry | None,
) -> dict:
    return {
        "enabled": config.enabled,
        "activeEntryId": config.active_entry_id,
        "activeEntry": _serialize_entry(active_entry),
    }


@router.get("/entries", response_model=dict, dependencies=[Depends(get_current_user)])
async def list_dashboard_header_entries(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=10, ge=1, le=50),
):
    config = await _get_or_create_config(db)
    active_entry = await _get_active_entry(db, config)

    total_stmt = select(func.count()).select_from(DashboardHeaderEntry)
    total = (await db.execute(total_stmt)).scalar_one()

    offset = (page - 1) * pageSize
    entries_stmt = (
        select(DashboardHeaderEntry)
        .order_by(DashboardHeaderEntry.updated_at.desc(), DashboardHeaderEntry.id.desc())
        .offset(offset)
        .limit(pageSize)
    )
    items = (await db.execute(entries_stmt)).scalars().all()

    payload = {
        "items": [_serialize_entry(item) for item in items],
        "total": total,
        "page": page,
        "pageSize": pageSize,
        **_settings_payload(config, active_entry),
    }
    return success(payload)


@router.get("/active", response_model=dict, dependencies=[Depends(get_current_user)])
async def get_active_dashboard_header(db: DbSession):
    config = await _get_or_create_config(db)
    active_entry = await _get_active_entry(db, config)
    return success(_settings_payload(config, active_entry))


@router.post("/entries", response_model=dict, dependencies=[Depends(get_current_user)])
async def create_dashboard_header_entry(payload: DashboardHeaderEntryCreate, db: DbSession):
    now = datetime.now(timezone.utc)
    config = await _get_or_create_config(db)

    entry = DashboardHeaderEntry(
        quote_text=payload.quoteText.strip(),
        person_name=payload.personName.strip(),
        person_position=payload.personPosition.strip(),
        person_image=payload.personImage.strip() if payload.personImage else None,
        created_at=now,
        updated_at=now,
    )
    db.add(entry)
    await db.flush()

    config.active_entry_id = entry.id
    config.enabled = payload.enabled if payload.enabled is not None else True
    config.updated_at = now

    await db.commit()
    await db.refresh(entry)

    return success(
        {
            "entry": _serialize_entry(entry),
            **_settings_payload(config, entry),
        }
    )


@router.put("/entries/{entry_id}", response_model=dict, dependencies=[Depends(get_current_user)])
async def update_dashboard_header_entry(
    entry_id: int,
    payload: DashboardHeaderEntryUpdate,
    db: DbSession,
):
    entry = await db.get(DashboardHeaderEntry, entry_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Header entry not found")

    config = await _get_or_create_config(db)
    data = payload.model_dump(exclude_unset=True)

    if "quoteText" in data and data["quoteText"] is not None:
        entry.quote_text = data["quoteText"].strip()
    if "personName" in data and data["personName"] is not None:
        entry.person_name = data["personName"].strip()
    if "personPosition" in data and data["personPosition"] is not None:
        entry.person_position = data["personPosition"].strip()
    if "personImage" in data:
        entry.person_image = data["personImage"].strip() if data["personImage"] else None

    now = datetime.now(timezone.utc)
    entry.updated_at = now
    config.active_entry_id = entry.id
    if payload.enabled is not None:
        config.enabled = payload.enabled
    config.updated_at = now

    await db.commit()
    await db.refresh(entry)

    return success(
        {
            "entry": _serialize_entry(entry),
            **_settings_payload(config, entry),
        }
    )


@router.patch("/settings", response_model=dict, dependencies=[Depends(get_current_user)])
async def update_dashboard_header_settings(payload: DashboardHeaderSettingsUpdate, db: DbSession):
    config = await _get_or_create_config(db)
    data = payload.model_dump(exclude_unset=True)

    if "activeEntryId" in data and data["activeEntryId"] is not None:
        active_entry = await db.get(DashboardHeaderEntry, data["activeEntryId"])
        if active_entry is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Header entry not found")
        config.active_entry_id = active_entry.id
    elif "activeEntryId" in data:
        config.active_entry_id = None

    if "enabled" in data and data["enabled"] is not None:
        config.enabled = data["enabled"]

    config.updated_at = datetime.now(timezone.utc)
    await db.commit()

    active_entry = await _get_active_entry(db, config)
    return success(_settings_payload(config, active_entry))


@router.post("/images", response_model=dict, dependencies=[Depends(get_current_user)])
async def upload_dashboard_header_image(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is required")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = HEADER_IMAGE_DIR / unique_filename

    file_size: int | None = None
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception:
        file_size = None

    if file_size is not None and file_size > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file too large (max 5 MB)",
        )

    try:
        file.file.seek(0)
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {exc}",
        ) from exc
    finally:
        await file.close()

    image_url = request.url_for("get_dashboard_header_image", filename=unique_filename)
    return success({"filename": unique_filename, "url": str(image_url)})


@router.get("/images/{filename}", response_class=FileResponse)
async def get_dashboard_header_image(filename: str):
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image name is required")

    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image name")

    image_path = HEADER_IMAGE_DIR / safe_name
    if not image_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    return FileResponse(image_path)
