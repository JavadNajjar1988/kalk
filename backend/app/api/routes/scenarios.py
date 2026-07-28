from __future__ import annotations

from datetime import datetime, timezone
import json
import shutil
import uuid
from pathlib import Path
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.response import success
from app.core.security import get_current_user, require_roles
from app.deps import DbSession
from app.models.scenario import Scenario
from app.models.scenario_audit_log import ScenarioAuditLog
from app.models.scenario_intro_view import ScenarioIntroView
from app.models.user import User
from app.schemas.scenario import ScenarioCreate, ScenarioOut, ScenarioUpdate
from app.realtime.manager import manager
from app.services.scenario_import import (
    broadcast_scenario_import,
    scenario_import_response_data,
    upsert_scenario_from_import,
)
from app.services.notifications import publish_notification
from app.services.scenario_history import build_content_history_diff
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)


def _normalize_scenario_datetime(value: object, field_name: str) -> datetime | None:
    if value is None:
        return None
    try:
        if isinstance(value, bool):
            raise ValueError
        if isinstance(value, (int, float)):
            # ORBAT stores Unix time in milliseconds. Accept seconds as well for API compatibility.
            timestamp = float(value)
            if abs(timestamp) >= 100_000_000_000:
                timestamp /= 1000
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        if isinstance(value, str):
            parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
            if parsed.tzinfo is None or parsed.utcoffset() is None:
                raise ValueError
            return parsed.astimezone(timezone.utc)
    except (OverflowError, OSError, TypeError, ValueError):
        pass
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"{field_name} must be an ISO 8601 date with timezone or a Unix timestamp",
    )


def _schedule_from_content(content: object, key: str) -> datetime | None:
    if not isinstance(content, dict) or key not in content:
        return None
    return _normalize_scenario_datetime(content.get(key), key)


async def _audit(db: AsyncSession, scenario_id: str, actor: dict, action: str, diff: dict | None = None):
    user_id: str | None = actor.get("user_id") or None
    db.add(
        ScenarioAuditLog(
            scenario_id=scenario_id,
            actor_user_id=user_id,
            action=action,
            payload_diff=diff,
        )
    )


router = APIRouter(prefix="/scenarios", tags=["scenarios"])

SCENARIO_IMAGE_DIR = Path(settings.SCENARIO_IMAGE_DIR)
if not SCENARIO_IMAGE_DIR.is_absolute():
    SCENARIO_IMAGE_DIR = Path.cwd() / SCENARIO_IMAGE_DIR
SCENARIO_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

SCENARIO_INTRO_VIDEO_DIR = Path(settings.SCENARIO_INTRO_VIDEO_DIR)
if not SCENARIO_INTRO_VIDEO_DIR.is_absolute():
    SCENARIO_INTRO_VIDEO_DIR = Path.cwd() / SCENARIO_INTRO_VIDEO_DIR
SCENARIO_INTRO_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_INTRO_VIDEO_EXTENSIONS = {".mp4", ".webm"}
ALLOWED_INTRO_VIDEO_CONTENT_TYPES = {
    "application/octet-stream",
    "video/mp4",
    "video/webm",
}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_INTRO_VIDEO_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_SCENARIO_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
UPLOAD_CHUNK_SIZE_BYTES = 1024 * 1024


def _intro_video_signature_matches(extension: str, header: bytes) -> bool:
    if extension == ".mp4":
        return len(header) >= 12 and header[4:8] == b"ftyp"
    if extension == ".webm":
        return header.startswith(b"\x1aE\xdf\xa3")
    return False


def _managed_intro_video_filename(video_url: str | None) -> str | None:
    if not video_url:
        return None
    try:
        path = unquote(urlparse(video_url.strip()).path).replace("\\", "/")
    except ValueError:
        return None
    marker = "/scenarios/intro-videos/"
    if marker not in path:
        return None
    filename = path.rsplit(marker, 1)[-1]
    if not filename or "/" in filename or Path(filename).name != filename:
        return None
    if Path(filename).suffix.lower() not in ALLOWED_INTRO_VIDEO_EXTENSIONS:
        return None
    return filename


async def _delete_managed_intro_video_if_unreferenced(
    db: AsyncSession, video_url: str | None
) -> None:
    filename = _managed_intro_video_filename(video_url)
    if not filename:
        return
    referenced_urls = await db.scalars(
        select(Scenario.intro_video_url).where(
            Scenario.intro_video_url.is_not(None),
            Scenario.intro_video_url.like(f"%/{filename}"),
        )
    )
    if any(
        _managed_intro_video_filename(referenced_url) == filename
        for referenced_url in referenced_urls.all()
    ):
        return
    path = SCENARIO_INTRO_VIDEO_DIR / filename
    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.warning("Failed to delete scenario intro video %s", path, exc_info=True)


async def _resolve_user_id(db: AsyncSession, user: dict) -> str:
    uid = user.get("user_id")
    if uid:
        return str(uid)
    if settings.DISABLE_AUTH:
        r = await db.execute(select(User).where(User.username == "admin").limit(1))
        u = r.scalar_one_or_none()
        if u:
            return u.id
    username = user.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication",
        )
    r = await db.execute(select(User.id).where(User.username == username))
    row = r.scalar_one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return row


@router.get(
    "",
    response_model=dict,
    dependencies=[Depends(get_current_user)],
)
async def list_scenarios(db: DbSession, include_archived: bool = False):
    stmt = select(Scenario)
    if not include_archived:
        stmt = stmt.where(Scenario.archived_at.is_(None))
    stmt = stmt.order_by(Scenario.modified.desc())
    result = await db.execute(stmt)
    items = result.scalars().all()
    return success([ScenarioOut.model_validate(i).model_dump() for i in items])


@router.post(
    "/images",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def upload_scenario_image(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is required"
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type"
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = SCENARIO_IMAGE_DIR / unique_filename

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

    image_url = request.url_for("get_scenario_image", filename=unique_filename)
    return success({"filename": unique_filename, "url": str(image_url)})


@router.get("/images/{filename}", response_class=FileResponse)
async def get_scenario_image(filename: str):
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Image name is required"
        )

    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image name"
        )

    image_path = SCENARIO_IMAGE_DIR / safe_name
    if not image_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    return FileResponse(image_path)


@router.post(
    "/import",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def import_scenario(db: DbSession, response: Response, file: UploadFile = File(...)):
    """
    Import a scenario from a JSON file (ORBAT-mapper format).
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File is required"
        )

    # Check file extension
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON files are allowed",
        )

    # Check file size
    file_size: int | None = None
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception:
        file_size = None

    if file_size is not None and file_size > MAX_SCENARIO_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {MAX_SCENARIO_FILE_SIZE_BYTES / 1024 / 1024} MB)",
        )

    # Read and parse JSON
    try:
        content = await file.read()
        scenario_data = json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON file: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}",
        )
    finally:
        await file.close()

    # Validate scenario structure
    if not isinstance(scenario_data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scenario file must contain a JSON object",
        )

    # Check if it's an ORBAT-mapper scenario
    scenario_type = scenario_data.get("type")
    if scenario_type and scenario_type != "ORBAT-mapper":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This file is not compatible with ORBAT-mapper structure",
        )

    # Extract scenario information
    meta = scenario_data.get("meta", {}) if isinstance(scenario_data.get("meta"), dict) else {}
    metadata = scenario_data.get("metadata", {}) if isinstance(scenario_data.get("metadata"), dict) else {}
    
    scenario_name = scenario_data.get("name") or meta.get("name")
    if not scenario_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scenario name is required",
        )

    scenario_description = scenario_data.get("description") or meta.get("description")
    scenario_image = scenario_data.get("image") or metadata.get("image")

    # Validate name length
    if len(scenario_name) > 200:
        scenario_name = scenario_name[:200]

    # Validate description length
    if scenario_description and len(scenario_description) > 2000:
        scenario_description = scenario_description[:2000]

    # Validate image URL length
    if scenario_image and len(scenario_image) > 500:
        scenario_image = scenario_image[:500]

    scenario_id = scenario_data.get("id")
    if not scenario_id or len(scenario_id) > 36:
        scenario_id = str(uuid.uuid4())

    try:
        obj, created = await upsert_scenario_from_import(
            db,
            scenario_id=scenario_id,
            name=scenario_name,
            description=scenario_description,
            image=scenario_image,
            content=scenario_data,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save scenario: {str(e)}",
        ) from e

    await broadcast_scenario_import(obj, created)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return success(scenario_import_response_data(obj, created))


@router.post(
    "/intro-videos",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def upload_scenario_intro_video(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Video file is required"
        )
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_INTRO_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video type (use mp4 or webm)",
        )
    if (file.content_type or "").lower() not in ALLOWED_INTRO_VIDEO_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video content type",
        )
    header = await file.read(64)
    if not _intro_video_signature_matches(ext, header):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match its video extension",
        )
    await file.seek(0)

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = SCENARIO_INTRO_VIDEO_DIR / unique_filename
    total_bytes = 0
    try:
        with target_path.open("wb") as buffer:
            while chunk := await file.read(UPLOAD_CHUNK_SIZE_BYTES):
                total_bytes += len(chunk)
                if total_bytes > MAX_INTRO_VIDEO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Video file too large (max 50 MB)",
                    )
                buffer.write(chunk)
    except HTTPException:
        target_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        target_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video: {exc}",
        ) from exc
    finally:
        await file.close()
    video_url = request.url_for("get_scenario_intro_video", filename=unique_filename)
    return success({"filename": unique_filename, "url": str(video_url)})


@router.delete(
    "/intro-videos/{filename}",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def delete_scenario_intro_video(filename: str, db: DbSession):
    safe_name = Path(filename).name
    if (
        safe_name != filename
        or Path(safe_name).suffix.lower() not in ALLOWED_INTRO_VIDEO_EXTENSIONS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video name"
        )

    referenced_urls = await db.scalars(
        select(Scenario.intro_video_url).where(
            Scenario.intro_video_url.is_not(None),
            Scenario.intro_video_url.like(f"%/{safe_name}"),
        )
    )
    if any(
        _managed_intro_video_filename(video_url) == safe_name
        for video_url in referenced_urls.all()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Video is currently assigned to a scenario",
        )

    video_path = SCENARIO_INTRO_VIDEO_DIR / safe_name
    if not video_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    video_path.unlink()
    return success({"filename": safe_name, "deleted": True})


@router.get("/intro-videos/{filename}", response_class=FileResponse)
async def get_scenario_intro_video(filename: str):
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Video name is required"
        )
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid video name"
        )
    video_path = SCENARIO_INTRO_VIDEO_DIR / safe_name
    if not video_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    return FileResponse(
        video_path,
        media_type="video/mp4" if safe_name.lower().endswith(".mp4") else "video/webm",
    )


class ScenarioIntroStatusOut(BaseModel):
    should_show_intro: bool
    intro_replay_available: bool
    intro_video_url: str | None = None
    intro_title: str | None = None
    intro_summary: str | None = None


@router.get("/{scenario_id}/intro-status", response_model=dict)
async def get_scenario_intro_status(
    scenario_id: str,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    video = (obj.intro_video_url or "").strip()
    if not video:
        return success(
            ScenarioIntroStatusOut(
                should_show_intro=False,
                intro_replay_available=False,
                intro_video_url=None,
                intro_title=obj.intro_title,
                intro_summary=obj.intro_summary,
            ).model_dump()
        )
    user_id = await _resolve_user_id(db, user)
    r = await db.execute(
        select(ScenarioIntroView).where(
            ScenarioIntroView.user_id == user_id,
            ScenarioIntroView.scenario_id == scenario_id,
        )
    )
    view = r.scalar_one_or_none()
    has_seen = view is not None
    never = bool(view and view.never_show_again)
    should_show = not has_seen
    replay = has_seen and not never
    return success(
        ScenarioIntroStatusOut(
            should_show_intro=should_show,
            intro_replay_available=replay,
            intro_video_url=obj.intro_video_url,
            intro_title=obj.intro_title,
            intro_summary=obj.intro_summary,
        ).model_dump()
    )


class ScenarioIntroViewIn(BaseModel):
    never_show_again: bool = False


@router.post("/{scenario_id}/intro-view", response_model=dict)
async def record_scenario_intro_view(
    scenario_id: str,
    payload: ScenarioIntroViewIn,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    user_id = await _resolve_user_id(db, user)
    now = datetime.now(timezone.utc)
    r = await db.execute(
        select(ScenarioIntroView).where(
            ScenarioIntroView.user_id == user_id,
            ScenarioIntroView.scenario_id == scenario_id,
        )
    )
    existing = r.scalar_one_or_none()
    if existing:
        existing.seen_at = now
        if payload.never_show_again:
            existing.never_show_again = True
    else:
        db.add(
            ScenarioIntroView(
                user_id=user_id,
                scenario_id=scenario_id,
                seen_at=now,
                never_show_again=payload.never_show_again,
            )
        )
    await db.commit()
    return success({"scenario_id": scenario_id, "recorded": True})


@router.get(
    "/{scenario_id}",
    response_model=dict,
    dependencies=[Depends(get_current_user)],
)
async def get_scenario(scenario_id: str, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return success(ScenarioOut.model_validate(obj).model_dump())


class ScenarioBasemapUpdate(BaseModel):
    baseMapId: str = Field(min_length=1, max_length=200)


@router.post("/{scenario_id}/basemap", response_model=dict)
async def update_scenario_basemap(scenario_id: str, payload: ScenarioBasemapUpdate, db: DbSession):
    """
    Lightweight realtime-only update: broadcasts base map changes to websocket listeners.
    This does NOT persist the scenario content; KalkNegar persists via regular save/update flows.
    """
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    room = f"scenario:{scenario_id}"
    await manager.broadcast(
        room,
        {
            "type": "basemap_changed",
            "scenarioId": scenario_id,
            "baseMapId": payload.baseMapId,
        },
    )
    return success({"scenarioId": scenario_id, "baseMapId": payload.baseMapId})


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
async def create_scenario(
    payload: ScenarioCreate,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    obj = Scenario(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        image=payload.image,
        intro_video_url=payload.intro_video_url,
        intro_title=payload.intro_title,
        intro_summary=payload.intro_summary,
        content=getattr(payload, "content", None),
        start_time=payload.start_time or _schedule_from_content(payload.content, "startTime"),
        end_time=payload.end_time or _schedule_from_content(payload.content, "endTime"),
        created=now,
        modified=now,
    )
    db.add(obj)
    await _audit(db, obj.id, user, "create", {"name": obj.name})
    await db.commit()
    await db.refresh(obj)
    await manager.broadcast("scenarios", {"type": "scenario_created", "data": ScenarioOut.model_validate(obj).model_dump()})
    await publish_notification(
        db,
        event_type="scenario.created",
        severity="success",
        title="سناریوی جدید ایجاد شد",
        message=f"سناریوی «{obj.name}» توسط {user.get('username', 'system')} ایجاد شد.",
        roles=("SUPER_ADMIN", "COMMANDER", "OPERATOR", "VIEWER"),
        entity_type="scenario",
        entity_id=obj.id,
        action_url=f"/dashboard/scenarios/{obj.id}",
    )
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.put("/{scenario_id}", response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
async def update_scenario(
    scenario_id: str,
    payload: ScenarioUpdate,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    previous_intro_video_url = obj.intro_video_url
    previous_content = obj.content
    data = payload.model_dump(exclude_unset=True)
    if "content" in data:
        content = data["content"]
        if isinstance(content, dict) and isinstance(previous_content, dict):
            # Older KalkNegar clients did not serialize dashboard-owned fields.
            # Preserve them so an editor autosave cannot reset scenario status.
            content = dict(content)
            for dashboard_field in ("status", "objectives"):
                if (
                    dashboard_field not in content
                    and dashboard_field in previous_content
                ):
                    content[dashboard_field] = previous_content[dashboard_field]
            data["content"] = content
        if "start_time" not in data and isinstance(content, dict) and "startTime" in content:
            data["start_time"] = _schedule_from_content(content, "startTime")
        if "end_time" not in data and isinstance(content, dict) and "endTime" in content:
            data["end_time"] = _schedule_from_content(content, "endTime")
    changed_keys = {k for k, v in data.items() if getattr(obj, k, None) != v}
    intro_changed = bool(
        changed_keys & {"intro_video_url", "intro_title", "intro_summary"}
    )
    for k, v in data.items():
        setattr(obj, k, v)
    obj.modified = datetime.now(timezone.utc)
    if intro_changed:
        await db.execute(
            delete(ScenarioIntroView).where(
                ScenarioIntroView.scenario_id == scenario_id
            )
        )
    if changed_keys:
        audit_diff: dict = {"fields": sorted(changed_keys)}
        if "content" in changed_keys:
            audit_diff.update(
                build_content_history_diff(previous_content, data.get("content"))
            )
        await _audit(db, scenario_id, user, "update", audit_diff)
    await db.commit()
    await db.refresh(obj)
    if previous_intro_video_url != obj.intro_video_url:
        await _delete_managed_intro_video_if_unreferenced(
            db, previous_intro_video_url
        )
    await manager.broadcast("scenarios", {"type": "scenario_updated", "data": ScenarioOut.model_validate(obj).model_dump()})
    if changed_keys:
        await publish_notification(
            db,
            event_type="scenario.updated",
            severity="info",
            title="سناریو به‌روزرسانی شد",
            message=f"سناریوی «{obj.name}» به‌روزرسانی شد.",
            roles=("SUPER_ADMIN", "COMMANDER", "OPERATOR", "VIEWER"),
            entity_type="scenario",
            entity_id=obj.id,
            action_url=f"/dashboard/scenarios/{obj.id}",
            details={"fields": sorted(changed_keys)},
        )
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.delete("/{scenario_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_roles("SUPER_ADMIN"))])
async def delete_scenario(
    scenario_id: str,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    scenario_name = obj.name
    intro_video_url = obj.intro_video_url
    await _audit(db, scenario_id, user, "delete", {"name": scenario_name})
    await db.delete(obj)
    await db.commit()
    await _delete_managed_intro_video_if_unreferenced(db, intro_video_url)
    await manager.broadcast("scenarios", {"type": "scenario_deleted", "data": {"id": scenario_id}})
    await publish_notification(
        db,
        event_type="scenario.deleted",
        severity="warning",
        title="سناریو حذف شد",
        message=f"سناریوی «{scenario_name}» حذف شد.",
        roles=("SUPER_ADMIN", "COMMANDER"),
        entity_type="scenario",
        entity_id=scenario_id,
        action_url="/dashboard/scenarios",
    )
    return success({"id": scenario_id}, message="Deleted")


# --------------- Archive / Restore ---------------

@router.post(
    "/{scenario_id}/archive",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def archive_scenario(
    scenario_id: str,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    if obj.archived_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already archived")
    obj.archived_at = datetime.now(timezone.utc)
    obj.modified = obj.archived_at
    await _audit(db, scenario_id, user, "archive")
    await db.commit()
    await db.refresh(obj)
    await manager.broadcast("scenarios", {"type": "scenario_archived", "data": ScenarioOut.model_validate(obj).model_dump()})
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.post(
    "/{scenario_id}/restore",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def restore_scenario(
    scenario_id: str,
    db: DbSession,
    user: dict = Depends(get_current_user),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    if obj.archived_at is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Scenario is not archived")
    obj.archived_at = None
    obj.modified = datetime.now(timezone.utc)
    await _audit(db, scenario_id, user, "restore")
    await db.commit()
    await db.refresh(obj)
    await manager.broadcast("scenarios", {"type": "scenario_restored", "data": ScenarioOut.model_validate(obj).model_dump()})
    return success(ScenarioOut.model_validate(obj).model_dump())


# --------------- Duplicate ---------------

class ScenarioDuplicateIn(BaseModel):
    new_name: str | None = None


@router.post(
    "/{scenario_id}/duplicate",
    status_code=status.HTTP_201_CREATED,
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def duplicate_scenario(
    scenario_id: str,
    db: DbSession,
    user: dict = Depends(get_current_user),
    payload: ScenarioDuplicateIn | None = None,
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    now = datetime.now(timezone.utc)
    new_name = (payload.new_name if payload and payload.new_name else f"{obj.name} (Copy)")[:200]
    clone = Scenario(
        id=str(uuid.uuid4()),
        name=new_name,
        description=obj.description,
        image=obj.image,
        intro_video_url=obj.intro_video_url,
        intro_title=obj.intro_title,
        intro_summary=obj.intro_summary,
        content=obj.content,
        created=now,
        modified=now,
    )
    db.add(clone)
    await _audit(db, clone.id, user, "duplicate", {"source_id": scenario_id})
    await db.commit()
    await db.refresh(clone)
    await manager.broadcast("scenarios", {"type": "scenario_created", "data": ScenarioOut.model_validate(clone).model_dump()})
    return success(ScenarioOut.model_validate(clone).model_dump())


# --------------- Export (JSON) ---------------

@router.get(
    "/{scenario_id}/export",
    response_model=dict,
    dependencies=[Depends(get_current_user)],
)
async def export_scenario(scenario_id: str, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    payload = ScenarioOut.model_validate(obj).model_dump()
    payload["content"] = obj.content
    for k, v in payload.items():
        if isinstance(v, datetime):
            payload[k] = v.isoformat()
    return success(payload)


# --------------- Audit History ---------------

class AuditLogOut(BaseModel):
    id: str
    scenario_id: str
    actor_user_id: str | None = None
    actor_username: str | None = None
    actor_display_name: str | None = None
    actor_user_code: str | None = None
    action: str
    payload_diff: dict | None = None
    created_at: datetime


@router.get(
    "/{scenario_id}/history",
    response_model=dict,
    dependencies=[Depends(get_current_user)],
)
async def get_scenario_history(
    scenario_id: str,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    total = (
        await db.scalar(
            select(func.count())
            .select_from(ScenarioAuditLog)
            .where(ScenarioAuditLog.scenario_id == scenario_id)
        )
        or 0
    )
    stmt = (
        select(ScenarioAuditLog)
        .where(ScenarioAuditLog.scenario_id == scenario_id)
        .order_by(ScenarioAuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    items = result.scalars().all()
    actor_ids = {item.actor_user_id for item in items if item.actor_user_id}
    users_by_id: dict[str, User] = {}
    if actor_ids:
        users = (
            await db.execute(select(User).where(User.id.in_(actor_ids)))
        ).scalars().all()
        users_by_id = {user.id: user for user in users}

    history_items = []
    for item in items:
        actor = users_by_id.get(item.actor_user_id or "")
        actor_display_name = None
        if actor:
            actor_display_name = (
                (actor.personal_info or {}).get("fullName") or actor.username
            )
        history_items.append(
            AuditLogOut(
                id=item.id,
                scenario_id=item.scenario_id,
                actor_user_id=item.actor_user_id,
                actor_username=actor.username if actor else None,
                actor_display_name=actor_display_name,
                actor_user_code=actor.user_code if actor else None,
                action=item.action,
                payload_diff=item.payload_diff,
                created_at=item.created_at,
            ).model_dump()
        )

    return success(
        {
            "items": history_items,
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


