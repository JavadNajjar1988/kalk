from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select

from app.core.response import success
from app.core.security import get_current_user
from app.deps import DbSession
from app.models.notification import Notification, NotificationRecipient
from app.services.notifications import resolve_current_user, serialize_notification
from app.services.system_notification_monitor import collect_real_notifications


router = APIRouter(prefix="/notifications", tags=["notifications"])


class StarPayload(BaseModel):
    starred: bool


async def _user_or_401(db: DbSession, actor: dict[str, Any]):
    user = await resolve_current_user(db, actor)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def _recipient(db: DbSession, notification_id: str, user_id: str):
    row = (
        await db.execute(
            select(NotificationRecipient).where(
                NotificationRecipient.notification_id == notification_id,
                NotificationRecipient.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    return row


@router.get("", response_model=dict)
async def list_notifications(
    db: DbSession,
    actor: dict[str, Any] = Depends(get_current_user),
    archived: bool = Query(False),
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    conditions = [
        NotificationRecipient.user_id == user.id,
        NotificationRecipient.archived_at.is_not(None)
        if archived
        else NotificationRecipient.archived_at.is_(None),
        or_(
            Notification.expires_at.is_(None),
            Notification.expires_at > datetime.now(timezone.utc),
        ),
    ]
    if unread_only:
        conditions.append(NotificationRecipient.read_at.is_(None))
    base = (
        select(Notification, NotificationRecipient)
        .join(NotificationRecipient, NotificationRecipient.notification_id == Notification.id)
        .where(*conditions)
    )
    rows = (
        await db.execute(
            base.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        )
    ).all()
    total = (
        await db.execute(
            select(func.count())
            .select_from(NotificationRecipient)
            .join(Notification, Notification.id == NotificationRecipient.notification_id)
            .where(*conditions)
        )
    ).scalar_one()
    return success(
        {
            "items": [serialize_notification(notification, recipient) for notification, recipient in rows],
            "total": total,
        }
    )


@router.post("/refresh", response_model=dict)
async def refresh_notifications(
    db: DbSession, actor: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    await _user_or_401(db, actor)
    await collect_real_notifications()
    return success({"refreshed": True})


@router.get("/unread-count", response_model=dict)
async def unread_count(
    db: DbSession, actor: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    count = (
        await db.execute(
            select(func.count())
            .select_from(NotificationRecipient)
            .join(Notification, Notification.id == NotificationRecipient.notification_id)
            .where(
                NotificationRecipient.user_id == user.id,
                NotificationRecipient.read_at.is_(None),
                NotificationRecipient.archived_at.is_(None),
            )
        )
    ).scalar_one()
    return success({"count": count})


@router.patch("/{notification_id}/read", response_model=dict)
async def mark_read(
    notification_id: str,
    db: DbSession,
    actor: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    row = await _recipient(db, notification_id, user.id)
    row.read_at = row.read_at or datetime.now(timezone.utc)
    await db.commit()
    return success({"id": notification_id, "read": True})


@router.post("/read-all", response_model=dict)
async def mark_all_read(
    db: DbSession, actor: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    rows = list(
        (
            await db.execute(
                select(NotificationRecipient).where(
                    NotificationRecipient.user_id == user.id,
                    NotificationRecipient.read_at.is_(None),
                    NotificationRecipient.archived_at.is_(None),
                )
            )
        ).scalars()
    )
    now = datetime.now(timezone.utc)
    for row in rows:
        row.read_at = now
    await db.commit()
    return success({"updated": len(rows)})


@router.patch("/{notification_id}/archive", response_model=dict)
async def archive(
    notification_id: str,
    db: DbSession,
    actor: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    row = await _recipient(db, notification_id, user.id)
    row.archived_at = row.archived_at or datetime.now(timezone.utc)
    await db.commit()
    return success({"id": notification_id, "archived": True})


@router.patch("/{notification_id}/unarchive", response_model=dict)
async def unarchive(
    notification_id: str,
    db: DbSession,
    actor: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    row = await _recipient(db, notification_id, user.id)
    row.archived_at = None
    await db.commit()
    return success({"id": notification_id, "archived": False})


@router.patch("/{notification_id}/star", response_model=dict)
async def star(
    notification_id: str,
    payload: StarPayload,
    db: DbSession,
    actor: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    user = await _user_or_401(db, actor)
    row = await _recipient(db, notification_id, user.id)
    row.starred = payload.starred
    await db.commit()
    return success({"id": notification_id, "starred": row.starred})

