from __future__ import annotations

import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import delete as sa_delete
from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success
from app.db.session import get_session
from app.models.resource import Resource, ResourceMedia
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
        or_(
            Resource.name.ilike(like),
            Resource.code.ilike(like),
        )
    )
    if type:
        _validate_type(type)
        stmt = stmt.where(Resource.type == type)
    stmt = stmt.order_by(Resource.name.asc()).limit(limit)
    res = await session.execute(stmt)
    items = res.scalars().all()
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


@router.get("/{resource_id}")
async def get_resource(resource_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Resource).where(Resource.id == resource_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="منبع یافت نشد")
    return success(_resource_to_response(item).model_dump(mode="json"))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_resource(payload: ResourceCreate, session: AsyncSession = Depends(get_session)):
    _validate_type(payload.type)

    new_id = payload.id or f"{payload.type}-{uuid.uuid4().hex}"
    if payload.id:
        existing = await session.execute(select(Resource).where(Resource.id == new_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="شناسه منبع تکراری است")

    item = Resource(
        id=new_id,
        type=payload.type,
        name=payload.name,
        code=payload.code,
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
    return success(_resource_to_response(item).model_dump(mode="json"))


@router.put("/{resource_id}")
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
    return success(_resource_to_response(item).model_dump(mode="json"))


@router.delete("/{resource_id}")
async def delete_resource(resource_id: str, session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Resource).where(Resource.id == resource_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="منبع یافت نشد")

    media_files = list(item.media_files or [])

    await session.execute(sa_delete(Resource).where(Resource.id == resource_id))
    await session.commit()

    for m in media_files:
        try:
            p = Path(m.file_path)
            if p.exists() and _is_safe_media_path(p):
                p.unlink()
        except Exception:
            pass

    return success({"id": resource_id}, message="منبع حذف شد")


@router.post("/bulk-import")
async def bulk_import_resources(
    payload: ResourceBulkImportRequest,
    session: AsyncSession = Depends(get_session),
):
    """ایمپورت دسته‌ای منابع از خروجی parse_resources_workbook یا تب‌های داشبورد.

    اگر کد منبع از قبل موجود باشد، رکورد به‌روزرسانی می‌شود؛ در غیر این صورت ایجاد می‌شود.
    """

    created = 0
    updated = 0
    skipped = 0
    for raw in payload.items:
        if raw.type not in RESOURCE_TYPES:
            skipped += 1
            continue
        if not raw.name:
            skipped += 1
            continue

        existing = None
        if raw.code:
            r = await session.execute(
                select(Resource).where(
                    Resource.type == raw.type, Resource.code == raw.code
                )
            )
            existing = r.scalar_one_or_none()

        if existing:
            existing.name = raw.name
            existing.description = raw.description
            existing.status = raw.status
            if raw.metadata is not None:
                existing.metadata_ = {**(existing.metadata_ or {}), **raw.metadata}
            updated += 1
        else:
            new_id = f"{raw.type}-{uuid.uuid4().hex}"
            session.add(
                Resource(
                    id=new_id,
                    type=raw.type,
                    name=raw.name,
                    code=raw.code,
                    description=raw.description,
                    status=raw.status,
                    metadata_=raw.metadata,
                )
            )
            created += 1

    try:
        await session.commit()
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")
    return success(
        ResourceBulkImportResponse(
            created=created, updated=updated, skipped=skipped
        ).model_dump(mode="json")
    )


# ---- Media endpoints ---------------------------------------------------------


@router.post("/media/upload")
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


@router.put("/media/{media_id}")
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


@router.delete("/media/{media_id}")
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
