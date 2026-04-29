"""CRUD endpoints for admin-managed tile root paths."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.exc import SQLAlchemyError

from app.core.security import require_roles
from app.deps import DbSession
from app.models.map import TileRoot
from app.schemas.map import TileRootCreate, TileRootListResponse, TileRootResponse

router = APIRouter(prefix="/tile-roots", tags=["tile-roots"])


def _root_to_response(root: TileRoot) -> TileRootResponse:
    p = Path(root.path)
    return TileRootResponse(
        id=root.id,
        label=root.label,
        path=root.path,
        is_active=root.is_active,
        valid=p.exists() and p.is_dir(),
        created_at=root.created_at,
    )


@router.get("", response_model=TileRootListResponse)
async def list_tile_roots(
    session: DbSession = None,
    _user=Depends(require_roles("SUPER_ADMIN", "COMMANDER")),
):
    """لیست تمام مسیرهای ریشه تایل (ادمین)."""
    res = await session.execute(select(TileRoot).order_by(TileRoot.created_at.desc()))
    items = res.scalars().all()
    return TileRootListResponse(items=[_root_to_response(r) for r in items])


@router.post("", response_model=TileRootResponse, status_code=status.HTTP_201_CREATED)
async def add_tile_root(
    payload: TileRootCreate,
    session: DbSession = None,
    _user=Depends(require_roles("SUPER_ADMIN")),
):
    """افزودن مسیر ریشه تایل جدید (فقط SUPER_ADMIN)."""
    cleaned = payload.path.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="مسیر نمی‌تواند خالی باشد")

    p = Path(cleaned)
    if not p.is_absolute():
        raise HTTPException(status_code=400, detail="مسیر باید مطلق (absolute) باشد")
    if not p.exists() or not p.is_dir():
        raise HTTPException(status_code=400, detail="مسیر وجود ندارد یا پوشه نیست")

    existing = await session.execute(select(TileRoot).where(TileRoot.path == cleaned))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="این مسیر قبلاً ثبت شده است")

    item = TileRoot(label=payload.label.strip(), path=cleaned, is_active=True)
    session.add(item)
    try:
        await session.commit()
        await session.refresh(item)
    except SQLAlchemyError as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"خطای پایگاه داده: {e}")
    return _root_to_response(item)


@router.put("/{root_id}/toggle", response_model=TileRootResponse)
async def toggle_tile_root(
    root_id: int,
    session: DbSession = None,
    _user=Depends(require_roles("SUPER_ADMIN")),
):
    """فعال/غیرفعال‌سازی یک مسیر ریشه."""
    res = await session.execute(select(TileRoot).where(TileRoot.id == root_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="مسیر یافت نشد")
    item.is_active = not item.is_active
    await session.commit()
    await session.refresh(item)
    return _root_to_response(item)


@router.delete("/{root_id}")
async def delete_tile_root(
    root_id: int,
    session: DbSession = None,
    _user=Depends(require_roles("SUPER_ADMIN")),
):
    """حذف مسیر ریشه تایل."""
    res = await session.execute(select(TileRoot).where(TileRoot.id == root_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="مسیر یافت نشد")

    await session.execute(sa_delete(TileRoot).where(TileRoot.id == root_id))
    await session.commit()
    return {"message": "حذف شد", "id": root_id}
