from __future__ import annotations

import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import delete as sa_delete
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success
from app.core.security import require_roles
from app.db.session import get_session
from app.models.resource import Resource, ResourceMedia
from app.models.scenario import Scenario
from app.schemas.resource import (
    RESOURCE_TYPES,
    ResourceBulkImportRequest,
    ResourceBulkImportResponse,
    ResourceCreate,
    ResourceListResponse,
    ResourceMediaResponse,
    ResourceMediaUpdate,
    ResourceResponse,
    ResourceSearchResult,
    ResourceUpdate,
    LegacyResourceLinkRequest,
    UnitResourceLinkRequest,
)
from app.services.notifications import publish_notification
from app.services.resource_import import upsert_resource_import_items
from app.services.resource_codes import build_resource_reference_code
from app.services.resource_usage import build_resource_usage_graph
from app.services.unit_resource_reconciliation import (
    collect_unlinked_resource_occurrences,
    collect_unlinked_unit_occurrences,
    link_resource_occurrence,
    link_unit_occurrence,
)


router = APIRouter(prefix="/resources", tags=["resources"])


RESOURCE_MEDIA_DIR = Path("backend/static/resources/media")
RESOURCE_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _is_safe_media_path(p: Path) -> bool:
    try:
        p.resolve().relative_to(RESOURCE_MEDIA_DIR.resolve())
        return True
    except Exception:
        return False


def _build_media_url(media: ResourceMedia) -> str:
    return f"/api/resources/media/{media.id}/file"


def _media_to_response(media: ResourceMedia) -> ResourceMediaResponse:
    return ResourceMediaResponse(
        id=media.id,
        resource_id=media.resource_id,
        filename=media.filename,
        content_type=media.content_type,
        file_size=media.file_size,
        caption=media.caption,
        credits=media.credits,
        credits_url=media.credits_url,
        url=_build_media_url(media),
        created_at=media.created_at,
    )


def _resource_to_response(resource: Resource) -> ResourceResponse:
    return ResourceResponse(
        id=resource.id,
        type=resource.type,
        name=resource.name,
        code=resource.code,
        description=resource.description,
        status=resource.status,
        metadata=resource.metadata_,
        created_at=resource.created_at,
        updated_at=resource.updated_at,
        media_files=[_media_to_response(m) for m in (resource.media_files or [])],
    )


def _validate_type(resource_type: str) -> None:
    if resource_type not in RESOURCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"نوع منبع نامعتبر است؛ مقادیر مجاز: {', '.join(RESOURCE_TYPES)}",
        )


@router.get("")
async def list_resources(
    type: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_session),
):
    """فهرست منابع با فیلتر نوع/جستجو/وضعیت."""

    stmt = select(Resource)
    count_stmt = select(func.count(Resource.id))

    if type:
        _validate_type(type)
        stmt = stmt.where(Resource.type == type)
        count_stmt = count_stmt.where(Resource.type == type)

    if status_filter:
        stmt = stmt.where(Resource.status == status_filter)
        count_stmt = count_stmt.where(Resource.status == status_filter)

    if search:
        like = f"%{search}%"
        cond = or_(
            Resource.name.ilike(like),
            Resource.code.ilike(like),
            Resource.description.ilike(like),
            cast(Resource.metadata_["aliases"], String).ilike(like),
        )
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)

    total_res = await session.execute(count_stmt)
    total = total_res.scalar_one() or 0

    stmt = stmt.order_by(Resource.updated_at.desc()).offset(skip).limit(limit)
    res = await session.execute(stmt)
    items = res.scalars().all()
    payload = ResourceListResponse(
        items=[_resource_to_response(r) for r in items],
        total=total,
    )
    return success(payload.model_dump(mode="json"))


@router.get("/search")
async def search_resources(
    q: str = Query(..., min_length=1),
    type: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    session: AsyncSession = Depends(get_session),
):
    """جستجوی سبک برای autocomplete (در ResourcePicker کالک‌نگار)."""

    like = f"%{q}%"
    stmt = select(Resource).where(
        or_(Resource.name.ilike(like), Resource.code.ilike(like))
    )
    if type:
        _validate_type(type)
        stmt = stmt.where(Resource.type == type)
    stmt = stmt.order_by(Resource.name.asc()).limit(limit)
    res = await session.execute(stmt)
    items = list(res.scalars().all())
    if len(items) < limit:
        alias_stmt = select(Resource).where(Resource.metadata_.is_not(None))
        if type:
            alias_stmt = alias_stmt.where(Resource.type == type)
        alias_result = await session.execute(
            alias_stmt.order_by(Resource.name.asc()).limit(1000)
        )
        existing_ids = {item.id for item in items}
        normalized_query = q.translate(str.maketrans({"ي": "ی", "ى": "ی", "ك": "ک"})).casefold()
        for candidate in alias_result.scalars().all():
            aliases = (candidate.metadata_ or {}).get("aliases") or []
            if candidate.id in existing_ids or not any(
                normalized_query in str(alias).translate(
                    str.maketrans({"ي": "ی", "ى": "ی", "ك": "ک"})
                ).casefold()
                for alias in aliases
            ):
                continue
            items.append(candidate)
            existing_ids.add(candidate.id)
            if len(items) >= limit:
                break
    payload = [
        ResourceSearchResult(
            id=r.id,
            type=r.type,
            name=r.name,
            code=r.code,
            description=r.description,
        ).model_dump(mode="json")
        for r in items
    ]
    return success(payload)


@router.get("/units/reconciliation")
async def preview_unit_resource_reconciliation(
    session: AsyncSession = Depends(get_session),
):
    scenario_result = await session.execute(
        select(Scenario).where(Scenario.archived_at.is_(None)).order_by(Scenario.name.asc())
    )
    occurrences: list[dict] = []
    for scenario in scenario_result.scalars().all():
        occurrences.extend(
            collect_unlinked_unit_occurrences(
                scenario.id,
                scenario.name,
                scenario.content or {},
            )
        )
    resource_result = await session.execute(
        select(Resource).where(Resource.type == "units").order_by(Resource.name.asc())
    )
    unit_resources = resource_result.scalars().all()
    return success(
        {
            "occurrences": occurrences,
            "resources": [
                {
                    "id": item.id,
                    "name": item.name,
                    "code": item.code,
                    "sidc": (item.metadata_ or {}).get("sidc"),
                }
                for item in unit_resources
            ],
            "summary": {
                "unlinkedOccurrences": len(occurrences),
                "canonicalUnits": len(unit_resources),
            },
        }
    )


@router.post(
    "/units/reconciliation",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))],
)
async def apply_unit_resource_reconciliation(
    payload: UnitResourceLinkRequest,
    session: AsyncSession = Depends(get_session),
):
    scenario_ids = {item.scenario_id for item in payload.assignments}
    resource_ids = {item.resource_id for item in payload.assignments}
    scenario_result = await session.execute(select(Scenario).where(Scenario.id.in_(scenario_ids)))
    scenarios = {item.id: item for item in scenario_result.scalars().all()}
    resource_result = await session.execute(
        select(Resource).where(Resource.id.in_(resource_ids), Resource.type == "units")
    )
    resources = {item.id: item for item in resource_result.scalars().all()}

    linked = 0
    skipped: list[dict[str, str]] = []
    for assignment in payload.assignments:
        scenario = scenarios.get(assignment.scenario_id)
        resource = resources.get(assignment.resource_id)
        if scenario is None or resource is None:
            skipped.append(assignment.model_dump())
            continue
        content = dict(scenario.content or {})
        if link_unit_occurrence(
            content,
            assignment.unit_id,
            resource.id,
            resource.name,
        ):
            scenario.content = content
            scenario.modified = datetime.now(timezone.utc)
            linked += 1
        else:
            skipped.append(assignment.model_dump())
    await session.commit()
    return success({"linked": linked, "skipped": skipped})


@router.get("/reconciliation/{resource_type}")
async def preview_legacy_resource_reconciliation(
    resource_type: str,
    session: AsyncSession = Depends(get_session),
):
    if resource_type not in {"equipment", "personnel"}:
        raise HTTPException(status_code=400, detail="تطبیق فقط برای تجهیزات و پرسنل پشتیبانی می‌شود")
    scenario_result = await session.execute(
        select(Scenario).where(Scenario.archived_at.is_(None)).order_by(Scenario.name.asc())
    )
    occurrences: list[dict] = []
    for scenario in scenario_result.scalars().all():
        occurrences.extend(
            collect_unlinked_resource_occurrences(
                scenario.id,
                scenario.name,
                scenario.content or {},
                resource_type,
            )
        )
    resource_result = await session.execute(
        select(Resource).where(Resource.type == resource_type).order_by(Resource.name.asc())
    )
    resources = resource_result.scalars().all()
    return success(
        {
            "resourceType": resource_type,
            "occurrences": occurrences,
            "resources": [
                {"id": item.id, "name": item.name, "code": item.code}
                for item in resources
            ],
            "summary": {
                "unlinkedGroups": len(occurrences),
                "unlinkedReferences": sum(item["occurrenceCount"] for item in occurrences),
                "canonicalResources": len(resources),
            },
        }
    )


@router.post(
    "/reconciliation/{resource_type}",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))],
)
async def apply_legacy_resource_reconciliation(
    resource_type: str,
    payload: LegacyResourceLinkRequest,
    session: AsyncSession = Depends(get_session),
):
    if resource_type not in {"equipment", "personnel"}:
        raise HTTPException(status_code=400, detail="تطبیق فقط برای تجهیزات و پرسنل پشتیبانی می‌شود")
    scenario_ids = {item.scenario_id for item in payload.assignments}
    resource_ids = {item.resource_id for item in payload.assignments}
    scenario_result = await session.execute(select(Scenario).where(Scenario.id.in_(scenario_ids)))
    scenarios = {item.id: item for item in scenario_result.scalars().all()}
    resource_result = await session.execute(
        select(Resource).where(Resource.id.in_(resource_ids), Resource.type == resource_type)
    )
    resources = {item.id: item for item in resource_result.scalars().all()}

    linked_references = 0
    linked_groups = 0
    skipped: list[dict[str, str]] = []
    for assignment in payload.assignments:
        scenario = scenarios.get(assignment.scenario_id)
        resource = resources.get(assignment.resource_id)
        if scenario is None or resource is None:
            skipped.append(assignment.model_dump())
            continue
        content = dict(scenario.content or {})
        linked = link_resource_occurrence(
            content,
            resource_type,
            assignment.occurrence_key,
            resource.id,
        )
        if linked:
            scenario.content = content
            scenario.modified = datetime.now(timezone.utc)
            linked_groups += 1
            linked_references += linked
        else:
            skipped.append(assignment.model_dump())
    await session.commit()
    return success(
        {
            "linkedGroups": linked_groups,
            "linkedReferences": linked_references,
            "skipped": skipped,
        }
    )


@router.get("/{resource_id}")
async def get_resource(resource_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Resource).where(Resource.id == resource_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="منبع یافت نشد")
    return success(_resource_to_response(item).model_dump(mode="json"))


@router.get("/{resource_id}/usage-graph")
async def get_resource_usage_graph(
    resource_id: str,
    session: AsyncSession = Depends(get_session),
):
    resource_result = await session.execute(select(Resource).where(Resource.id == resource_id))
    item = resource_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="منبع یافت نشد")

    scenario_result = await session.execute(
        select(Scenario).where(Scenario.archived_at.is_(None)).order_by(Scenario.start_time.asc())
    )
    graph = build_resource_usage_graph(item, scenario_result.scalars().all())
    return success(graph)


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def create_resource(payload: ResourceCreate, session: AsyncSession = Depends(get_session)):
    _validate_type(payload.type)

    new_id = payload.id or f"{payload.type}-{uuid.uuid4().hex}"
    if payload.id:
        existing = await session.execute(select(Resource).where(Resource.id == new_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="شناسه منبع تکراری است")

    code = str(payload.code or "").strip() or build_resource_reference_code(
        payload.type, new_id
    )
    if code:
        duplicate_code = await session.execute(
            select(Resource).where(Resource.type == payload.type, Resource.code == code)
        )
        if duplicate_code.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="کد مرجع این نوع منبع تکراری است")

    item = Resource(
        id=new_id,
        type=payload.type,
        name=payload.name,
        code=code,
        description=payload.description,
        status=payload.status,
        metadata_=payload.metadata,
    )
    session.add(item)
    try:
        await session.commit()
        await session.refresh(item)
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")
    await publish_notification(
        session,
        event_type="resource.created",
        severity="success",
        title="منبع جدید ثبت شد",
        message=f"منبع «{item.name}» در گروه {item.type} ثبت شد.",
        roles=("SUPER_ADMIN", "COMMANDER", "OPERATOR"),
        entity_type="resource",
        entity_id=item.id,
        action_url="/dashboard/resources",
    )
    return success(_resource_to_response(item).model_dump(mode="json"))


@router.put("/{resource_id}", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def update_resource(
    resource_id: str,
    payload: ResourceUpdate,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(select(Resource).where(Resource.id == resource_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="منبع یافت نشد")

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data:
        requested_code = str(update_data["code"] or "").strip()
        update_data["code"] = requested_code or build_resource_reference_code(
            item.type, item.id
        )
        duplicate_code = await session.execute(
            select(Resource).where(
                Resource.type == item.type,
                Resource.code == update_data["code"],
                Resource.id != item.id,
            )
        )
        if duplicate_code.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="کد مرجع این نوع منبع تکراری است")
    if "metadata" in update_data:
        item.metadata_ = update_data.pop("metadata")
    for key, value in update_data.items():
        setattr(item, key, value)

    try:
        await session.commit()
        await session.refresh(item)
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")
    await publish_notification(
        session,
        event_type="resource.updated",
        severity="info",
        title="منبع به‌روزرسانی شد",
        message=f"اطلاعات منبع «{item.name}» به‌روزرسانی شد.",
        roles=("SUPER_ADMIN", "COMMANDER", "OPERATOR"),
        entity_type="resource",
        entity_id=item.id,
        action_url="/dashboard/resources",
    )
    return success(_resource_to_response(item).model_dump(mode="json"))


@router.delete("/{resource_id}", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def delete_resource(resource_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Resource).where(Resource.id == resource_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="منبع یافت نشد")

    media_files = list(item.media_files or [])
    resource_name = item.name

    await session.execute(sa_delete(Resource).where(Resource.id == resource_id))
    await session.commit()

    for m in media_files:
        try:
            p = Path(m.file_path)
            if p.exists() and _is_safe_media_path(p):
                p.unlink()
        except Exception:
            pass

    await publish_notification(
        session,
        event_type="resource.deleted",
        severity="warning",
        title="منبع حذف شد",
        message=f"منبع «{resource_name}» حذف شد.",
        roles=("SUPER_ADMIN", "COMMANDER", "OPERATOR"),
        entity_type="resource",
        entity_id=resource_id,
        action_url="/dashboard/resources",
    )

    return success({"id": resource_id}, message="منبع حذف شد")


@router.post("/bulk-import", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def bulk_import_resources(
    payload: ResourceBulkImportRequest,
    session: AsyncSession = Depends(get_session),
):
    """ایمپورت دسته‌ای منابع از خروجی parse_resources_workbook یا تب‌های داشبورد.

    اگر کد منبع از قبل موجود باشد، رکورد به‌روزرسانی می‌شود؛ در غیر این صورت ایجاد می‌شود.
    """

    try:
        result = await upsert_resource_import_items(session, payload.items)
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")
    return success(
        ResourceBulkImportResponse(**result).model_dump(mode="json")
    )


# ---- Media endpoints ---------------------------------------------------------


@router.post("/media/upload", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def upload_media(
    file: UploadFile = File(...),
    resource_id: Optional[str] = Form(default=None),
    caption: Optional[str] = Form(default=None),
    credits: Optional[str] = Form(default=None),
    credits_url: Optional[str] = Form(default=None),
    session: AsyncSession = Depends(get_session),
):
    """آپلود فایل تصویر/مدیا و بازگرداندن ارجاع داخلی برای استفاده در سناریو/واحد."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="فایل نامعتبر است")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_MEDIA_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"پسوند مجاز نیست؛ مجاز: {', '.join(sorted(ALLOWED_MEDIA_EXT))}",
        )

    if resource_id:
        rcheck = await session.execute(
            select(Resource).where(Resource.id == resource_id)
        )
        if not rcheck.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="منبع مرجع یافت نشد")

    media_id = uuid.uuid4().hex
    unique_filename = f"{media_id}{ext}"
    file_path = RESOURCE_MEDIA_DIR / unique_filename

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
    if file_size and file_size > MAX_MEDIA_SIZE_BYTES:
        try:
            file_path.unlink()
        except Exception:
            pass
        raise HTTPException(
            status_code=400,
            detail=f"حجم فایل بیش از حد مجاز ({MAX_MEDIA_SIZE_BYTES // (1024 * 1024)}MB) است",
        )

    media = ResourceMedia(
        id=media_id,
        resource_id=resource_id,
        filename=file.filename,
        file_path=str(file_path),
        content_type=file.content_type,
        file_size=file_size,
        caption=caption,
        credits=credits,
        credits_url=credits_url,
    )
    session.add(media)
    try:
        await session.commit()
        await session.refresh(media)
    except SQLAlchemyError as e:
        await session.rollback()
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")

    return success(_media_to_response(media).model_dump(mode="json"))


@router.get("/media/{media_id}")
async def get_media_meta(media_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(ResourceMedia).where(ResourceMedia.id == media_id)
    )
    media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="فایل یافت نشد")
    return success(_media_to_response(media).model_dump(mode="json"))


@router.get("/media/{media_id}/file")
async def download_media(media_id: str, session: AsyncSession = Depends(get_session)):
    """سرو فایل واقعی روی دیسک."""

    res = await session.execute(
        select(ResourceMedia).where(ResourceMedia.id == media_id)
    )
    media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="فایل یافت نشد")

    p = Path(media.file_path)
    if not p.exists() or not _is_safe_media_path(p):
        raise HTTPException(status_code=404, detail="فایل روی دیسک موجود نیست")
    return FileResponse(
        path=str(p),
        media_type=media.content_type or "application/octet-stream",
        filename=media.filename,
    )


@router.put("/media/{media_id}", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def update_media(
    media_id: str,
    payload: ResourceMediaUpdate,
    session: AsyncSession = Depends(get_session),
):
    res = await session.execute(
        select(ResourceMedia).where(ResourceMedia.id == media_id)
    )
    media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="فایل یافت نشد")

    data = payload.model_dump(exclude_unset=True)
    if "resource_id" in data and data["resource_id"]:
        rcheck = await session.execute(
            select(Resource).where(Resource.id == data["resource_id"])
        )
        if not rcheck.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="منبع مرجع یافت نشد")
    for key, value in data.items():
        setattr(media, key, value)
    try:
        await session.commit()
        await session.refresh(media)
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")
    return success(_media_to_response(media).model_dump(mode="json"))


@router.delete("/media/{media_id}", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "OPERATOR"))])
async def delete_media(media_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(
        select(ResourceMedia).where(ResourceMedia.id == media_id)
    )
    media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="فایل یافت نشد")

    file_path = Path(media.file_path)

    await session.execute(sa_delete(ResourceMedia).where(ResourceMedia.id == media_id))
    await session.commit()

    try:
        if file_path.exists() and _is_safe_media_path(file_path):
            file_path.unlink()
    except Exception:
        pass
    return success({"id": media_id}, message="فایل حذف شد")
