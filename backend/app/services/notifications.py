from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationRecipient
from app.models.user import User
from app.realtime.manager import manager


def normalized_roles(value: str | None) -> set[str]:
    roles = {part.strip().upper() for part in (value or "").split(",") if part.strip()}
    if "ADMIN" in roles:
        roles.add("SUPER_ADMIN")
    return roles


async def resolve_current_user(db: AsyncSession, actor: dict[str, Any]) -> User | None:
    user_id = actor.get("user_id")
    if user_id:
        user = await db.get(User, str(user_id))
        if user:
            return user
    username = actor.get("username")
    if username:
        return (
            await db.execute(select(User).where(User.username == str(username)).limit(1))
        ).scalar_one_or_none()
    return None


def serialize_notification(
    notification: Notification, recipient: NotificationRecipient
) -> dict[str, Any]:
    created_at = notification.created_at.isoformat()
    return {
        "id": notification.id,
        "eventType": notification.event_type,
        "severity": notification.severity,
        "type": notification.severity,
        "title": notification.title,
        "message": notification.message,
        "entityType": notification.entity_type,
        "entityId": notification.entity_id,
        "actionUrl": notification.action_url,
        "details": notification.details or {},
        "createdAt": created_at,
        "timestamp": created_at,
        "expiresAt": notification.expires_at.isoformat() if notification.expires_at else None,
        "read": recipient.read_at is not None,
        "readAt": recipient.read_at.isoformat() if recipient.read_at else None,
        "archived": recipient.archived_at is not None,
        "archivedAt": recipient.archived_at.isoformat() if recipient.archived_at else None,
        "starred": recipient.starred,
    }


async def publish_notification(
    db: AsyncSession,
    *,
    event_type: str,
    severity: str,
    title: str,
    message: str,
    roles: Iterable[str] = (),
    user_ids: Iterable[str] = (),
    entity_type: str | None = None,
    entity_id: str | None = None,
    action_url: str | None = None,
    details: dict[str, Any] | None = None,
    dedupe_key: str | None = None,
    dedupe_for: timedelta = timedelta(minutes=30),
) -> Notification | None:
    if dedupe_key:
        threshold = datetime.now(timezone.utc) - dedupe_for
        existing = (
            await db.execute(
                select(Notification.id).where(
                    Notification.dedupe_key == dedupe_key,
                    Notification.created_at >= threshold,
                )
            )
        ).scalar_one_or_none()
        if existing:
            return None

    target_roles = {role.upper() for role in roles}
    users = list((await db.execute(select(User).where(User.is_active.is_(True)))).scalars())
    explicit = {str(user_id) for user_id in user_ids}
    recipients = [
        user
        for user in users
        if user.id in explicit or bool(normalized_roles(user.roles) & target_roles)
    ]
    if not recipients:
        return None

    notification = Notification(
        event_type=event_type,
        severity=severity,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url,
        details=details or {},
        dedupe_key=dedupe_key,
    )
    db.add(notification)
    await db.flush()
    rows = [
        NotificationRecipient(notification_id=notification.id, user_id=user.id)
        for user in recipients
    ]
    db.add_all(rows)
    await db.commit()

    for user, row in zip(recipients, rows):
        await manager.broadcast(
            f"notifications:{user.id}",
            {"event": "notification.created", "data": serialize_notification(notification, row)},
        )
    return notification

