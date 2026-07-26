from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Any

import psutil
from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.response import success
from app.core.security import get_current_user
from app.deps import DbSession
from app.models.resource import Resource
from app.models.scenario import Scenario
from app.models.user import User


router = APIRouter(prefix="/dashboard", tags=["dashboard"])

ROLE_CARDS = {
    "SUPER_ADMIN": {"archived_scenarios", "available_forces", "ongoing_operations", "security_alerts", "recent_activities", "system_status", "important_notices"},
    "COMMANDER": {"archived_scenarios", "available_forces", "ongoing_operations", "security_alerts", "recent_activities", "important_notices"},
    "OPERATOR": {"archived_scenarios", "available_forces", "ongoing_operations", "recent_activities"},
    "VIEWER": {"archived_scenarios", "available_forces", "recent_activities"},
}


def _role(actor: dict[str, Any]) -> str:
    roles = {str(item).upper() for item in actor.get("roles", [])}
    if "ADMIN" in roles:
        roles.add("SUPER_ADMIN")
    return next((item for item in ("SUPER_ADMIN", "COMMANDER", "OPERATOR", "VIEWER") if item in roles), "VIEWER")


def _scenario_status(item: Scenario) -> str:
    content = item.content or {}
    raw = str(content.get("executionStatus") or content.get("execution_status") or content.get("status") or "").lower()
    if raw in {"running", "active", "in_progress", "executing"}:
        return "active"
    if raw in {"ready", "pending", "draft", "not_started"}:
        return "ready"
    if raw in {"completed", "finished", "success"}:
        return "completed"
    return "archived" if item.archived_at else "ready"


def _is_iranian(item: Resource) -> bool:
    data = item.metadata_ or {}
    value = str(data.get("nationality") or data.get("country") or "").strip().lower()
    return value in {"iran", "iranian", "ir", "ایران", "ایرانی"} or "ایران" in value


def _color(value: float) -> str:
    return "error" if value >= 85 else "warning" if value >= 65 else "success"


def _system_status() -> list[dict[str, Any]]:
    cpu = round(psutil.cpu_percent(interval=0.1), 1)
    ram = round(psutil.virtual_memory().percent, 1)
    disk = round(psutil.disk_usage("/").percent, 1)
    before = psutil.net_io_counters()
    time.sleep(0.1)
    after = psutil.net_io_counters()
    delta = max(0, after.bytes_recv + after.bytes_sent - before.bytes_recv - before.bytes_sent)
    network = round(min(100, delta / 125_000_000 * 10 * 100), 1)
    values = (("cpu", "CPU", cpu), ("ram", "RAM", ram), ("disk", "دیسک", disk), ("network", "شبکه", network))
    return [{"key": key, "name": name, "value": value, "color": _color(value)} for key, name, value in values]


@router.get("/summary", response_model=dict)
async def summary(
    db: DbSession, actor: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    role = _role(actor)
    visible = ROLE_CARDS[role]
    scenarios = list((await db.execute(select(Scenario))).scalars())
    resources = list((await db.execute(select(Resource))).scalars())
    users = list((await db.execute(select(User))).scalars())
    personnel = [item for item in resources if item.type in {"personnel", "human", "human_resource"}]
    statuses = [_scenario_status(item) for item in scenarios]
    now = datetime.now(timezone.utc)
    failed = sum(max(item.failed_login_count, 0) for item in users)
    locked = sum(1 for item in users if item.locked_until and item.locked_until > now)
    inactive = sum(1 for item in users if not item.is_active)

    activities: list[dict[str, Any]] = []
    for item in scenarios:
        activities.append({"id": f"scenario:{item.id}", "kind": "scenario", "title": "سناریو به‌روزرسانی شد", "description": item.name, "occurredAt": item.modified.isoformat()})
    if role != "VIEWER":
        for item in resources:
            activities.append({"id": f"resource:{item.id}", "kind": "resource", "title": "منبع به‌روزرسانی شد", "description": item.name, "occurredAt": item.updated_at.isoformat()})
    if role == "SUPER_ADMIN":
        for item in users:
            activities.append({"id": f"user:{item.id}", "kind": "user", "title": "کاربر به‌روزرسانی شد", "description": item.username, "occurredAt": item.updated_at.isoformat()})
    activities.sort(key=lambda item: item["occurredAt"], reverse=True)

    status_data = await asyncio.to_thread(_system_status) if "system_status" in visible else []
    notices = []
    if failed or locked:
        notices.append({"severity": "warning", "message": f"{failed} تلاش ورود ناموفق و {locked} حساب قفل‌شده ثبت شده است."})
    for metric in status_data:
        if metric["value"] >= 85:
            notices.append({"severity": "error", "message": f"مصرف {metric['name']} سرور به {metric['value']} درصد رسیده است."})
    if not notices:
        notices.append({"severity": "success", "message": "در حال حاضر هشدار مهمی ثبت نشده است."})

    active = statuses.count("active")
    ready = statuses.count("ready")
    completed = statuses.count("completed")
    return success({
        "generatedAt": now.isoformat(),
        "role": role,
        "visibleCards": sorted(visible),
        "scenarioStats": {"total": len(scenarios), "active": active, "archived": statuses.count("archived"), "ready": ready, "completed": completed},
        "forceStats": {"total": len(personnel), "iranian": sum(_is_iranian(item) for item in personnel), "foreign": sum(not _is_iranian(item) for item in personnel)},
        "operationStats": {"total": active + ready + completed, "active": active, "ready": ready, "completed": completed},
        "alertStats": {"total": failed + locked + inactive, "failedLogins": failed, "lockedAccounts": locked, "inactiveAccounts": inactive},
        "resourceStats": {"total": len(resources), "byType": {kind: sum(item.type == kind for item in resources) for kind in sorted({item.type for item in resources})}},
        "activities": activities[:12],
        "systemStatus": status_data,
        "notices": notices,
    })

