from __future__ import annotations

import asyncio
from datetime import timedelta

import psutil
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.services.notifications import publish_notification


async def collect_real_notifications() -> None:
    async with AsyncSessionLocal() as db:
        metrics = {
            "CPU": await asyncio.to_thread(psutil.cpu_percent, 0.1),
            "RAM": psutil.virtual_memory().percent,
            "Disk": psutil.disk_usage("/").percent,
        }
        for name, value in metrics.items():
            if value >= 85:
                await publish_notification(
                    db,
                    event_type="system.resource.high",
                    severity="error" if value >= 95 else "warning",
                    title=f"High {name} usage",
                    message=f"Server {name} usage reached {value:.1f} percent.",
                    roles=("SUPER_ADMIN",),
                    details={"metric": name.lower(), "value": round(value, 1)},
                    dedupe_key=f"system:{name.lower()}:high",
                    dedupe_for=timedelta(minutes=30),
                )

        locked = list(
            (
                await db.execute(
                    select(User).where(
                        (User.failed_login_count > 0) | (User.locked_until.is_not(None))
                    )
                )
            ).scalars()
        )
        for user in locked:
            await publish_notification(
                db,
                event_type="security.login.failed",
                severity="warning",
                title="Failed login activity",
                message=f"{user.failed_login_count} failed login attempts recorded for {user.username}.",
                roles=("SUPER_ADMIN", "COMMANDER"),
                entity_type="user",
                entity_id=user.id,
                action_url="/dashboard/users",
                details={"username": user.username, "attempts": user.failed_login_count},
                dedupe_key=f"security:login:{user.id}:{user.failed_login_count}",
                dedupe_for=timedelta(hours=6),
            )


async def notification_monitor_loop() -> None:
    while True:
        try:
            await collect_real_notifications()
        except asyncio.CancelledError:
            raise
        except Exception:
            pass
        await asyncio.sleep(60)

