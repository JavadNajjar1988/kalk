from __future__ import annotations

import asyncio
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import psutil
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.response import success
from app.core.security import get_current_user
from app.deps import DbSession
from app.models.resource import Resource
from app.models.scenario import Scenario
from app.models.scenario_audit_log import ScenarioAuditLog
from app.models.user import User
from app.models.user_audit_log import UserAuditLog


router = APIRouter(prefix="/dashboard", tags=["dashboard"])

ROLE_CARDS = {
    "SUPER_ADMIN": {
        "archived_scenarios", "available_forces", "ongoing_operations",
        "security_alerts", "recent_activities", "system_status",
        "important_notices", "active_users_24h", "failed_logins_24h",
        "storage_usage", "healthy_services", "user_activity_chart",
    },
    "COMMANDER": {"archived_scenarios", "available_forces", "ongoing_operations", "security_alerts", "recent_activities", "important_notices"},
    "OPERATOR": {"archived_scenarios", "available_forces", "ongoing_operations", "recent_activities"},
    "VIEWER": {"archived_scenarios", "available_forces", "recent_activities"},
}

WORKSPACE_WIDGETS = {
    "continue_latest_kalk", "scenario_overview", "recent_scenarios",
    "quick_access", "recent_activities", "archived_scenarios",
    "available_forces", "ongoing_operations", "security_alerts",
    "system_status", "important_notices", "active_users_24h",
    "failed_logins_24h", "storage_usage", "healthy_services",
    "user_activity_chart",
}
WORKSPACE_BREAKPOINTS = {"lg", "md", "sm", "xs", "xxs"}


class DashboardLayoutItem(BaseModel):
    i: str
    x: int = Field(ge=0, le=11)
    y: int = Field(ge=0, le=1000)
    w: int = Field(ge=1, le=12)
    h: int = Field(ge=1, le=30)
    minW: int | None = Field(default=None, ge=1, le=12)
    minH: int | None = Field(default=None, ge=1, le=30)


class DashboardWorkspacePayload(BaseModel):
    version: int = 1
    layouts: dict[str, list[DashboardLayoutItem]] = Field(default_factory=dict)
    hiddenWidgetIds: list[str] = Field(default_factory=list, max_length=32)


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


def _raw_scenario_status(item: Scenario) -> str:
    if item.archived_at:
        return "archived"
    content = item.content or {}
    return str(content.get("status") or content.get("workflowStatus") or "").strip().lower()


def _count_nested_units(value: Any) -> int:
    if not isinstance(value, list):
        return 0
    count = 0
    for item in value:
        if not isinstance(item, dict):
            continue
        count += 1
        count += _count_nested_units(item.get("subUnits"))
        count += _count_nested_units(item.get("units"))
        for group in item.get("groups") or []:
            if isinstance(group, dict):
                count += _count_nested_units(group.get("subUnits"))
    return count


def _tactical_preview_features(content: dict[str, Any]) -> list[dict[str, Any]]:
    metadata = content.get("metadata")
    metadata = metadata if isinstance(metadata, dict) else {}
    snapshot = metadata.get("tacticalSymbols")
    snapshot = snapshot if isinstance(snapshot, dict) else {}
    tuples = snapshot.get("tuples")
    if not isinstance(tuples, list):
        return []

    hidden_keys = {
        key.removeprefix("hidden+")
        for entry in tuples
        if (
            isinstance(entry, list)
            and len(entry) == 2
            and isinstance(entry[0], str)
            and entry[0].startswith("hidden+")
            and entry[1] is True
        )
        for key in [entry[0]]
    }
    features: list[dict[str, Any]] = []
    for entry in tuples:
        if not (
            isinstance(entry, list)
            and len(entry) == 2
            and isinstance(entry[0], str)
            and entry[0].startswith(("feature:", "marker:", "measure:"))
            and entry[0] not in hidden_keys
            and isinstance(entry[1], dict)
        ):
            continue
        feature = entry[1]
        if feature.get("type") != "Feature" or not isinstance(feature.get("geometry"), dict):
            continue
        properties = dict(feature.get("properties") or {})
        properties.update(
            {
                "__dashboardSource": "tactical",
                "__dashboardProjection": "EPSG:3857",
                "__dashboardKey": entry[0],
            }
        )
        features.append({**feature, "properties": properties})
    return features


def _scenario_content_stats(item: Scenario) -> dict[str, int]:
    content = item.content or {}
    sides = content.get("sides")
    if not isinstance(sides, list):
        sides = (content.get("metadata") or {}).get("sides") or []
    unit_map = content.get("unitMap")
    units = len(unit_map) if isinstance(unit_map, dict) else sum(
        _count_nested_units(side.get("subUnits"))
        + _count_nested_units(side.get("units"))
        + sum(
            _count_nested_units(group.get("subUnits"))
            for group in side.get("groups") or []
            if isinstance(group, dict)
        )
        for side in sides
        if isinstance(side, dict)
    )
    layers = content.get("layers") if isinstance(content.get("layers"), list) else []
    layer_features = sum(
        len(layer.get("features") or [])
        for layer in layers
        if isinstance(layer, dict) and isinstance(layer.get("features"), list)
    )
    tactical_features = _tactical_preview_features(content)
    storyboard = content.get("storyboard") or {}
    scenes = storyboard.get("scenes") if isinstance(storyboard, dict) else []
    return {
        "units": units,
        "events": len(content.get("events") or []),
        "features": layer_features + len(tactical_features),
        "layers": len(layers),
        "conditions": len(
            content.get("environmentalConditions")
            or content.get("environmental_conditions")
            or []
        ),
        "storyboardScenes": len(scenes or []),
    }


def _scenario_card(item: Scenario) -> dict[str, Any]:
    content = item.content or {}
    settings = content.get("settings") or {}
    map_settings = settings.get("map") if isinstance(settings, dict) else {}
    map_settings = map_settings if isinstance(map_settings, dict) else {}
    map_view = content.get("mapView") or map_settings.get("view") or {}
    map_view = map_view if isinstance(map_view, dict) else {}
    center = map_view.get("center")
    if not (
        isinstance(center, list)
        and len(center) == 2
        and all(isinstance(value, (int, float)) for value in center)
    ):
        center = [53.6880, 32.4279]
    zoom = map_view.get("zoom")
    if not isinstance(zoom, (int, float)):
        zoom = 6
    preview_features: list[dict[str, Any]] = []
    total_layer_preview_features = 0
    for layer in content.get("layers") or []:
        if not isinstance(layer, dict):
            continue
        for feature in layer.get("features") or []:
            if (
                isinstance(feature, dict)
                and feature.get("type") == "Feature"
                and isinstance(feature.get("geometry"), dict)
            ):
                total_layer_preview_features += 1
                if len(preview_features) >= 250:
                    continue
                properties = dict(feature.get("properties") or {})
                properties.update(
                    {
                        "__dashboardSource": "layer",
                        "__dashboardProjection": "EPSG:4326",
                    }
                )
                preview_features.append({**feature, "properties": properties})
    all_tactical_features = _tactical_preview_features(content)
    remaining = max(0, 250 - len(preview_features))
    preview_features.extend(all_tactical_features[:remaining])
    total_preview_features = total_layer_preview_features + len(all_tactical_features)
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description or content.get("description") or "",
        "image": item.image or content.get("image") or (content.get("metadata") or {}).get("image"),
        "status": _raw_scenario_status(item) or "draft",
        "modifiedAt": item.modified.isoformat(),
        "archivedAt": item.archived_at.isoformat() if item.archived_at else None,
        "contentStats": _scenario_content_stats(item),
        "mapPreview": {
            "baseMapId": str(map_settings.get("baseMapId") or "osm"),
            "center": center,
            "zoom": max(1, min(float(zoom), 20)),
            "features": preview_features,
            "truncated": total_preview_features > 250,
        },
    }


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


def _storage_usage() -> dict[str, Any]:
    disk = psutil.disk_usage("/")
    return {
        "usedBytes": disk.used,
        "totalBytes": disk.total,
        "freeBytes": disk.free,
        "percent": round(disk.percent, 1),
    }


async def _service_health() -> list[dict[str, Any]]:
    targets = (
        ("api", "رابط برنامه‌نویسی", "http://127.0.0.1:8000/api/health"),
        ("kalknegar", "کالک‌نگار", "http://kalknegar/"),
        ("dashboard", "داشبورد", "http://dashboard/"),
        ("simulator", "شبیه‌ساز", "http://simulator/"),
        ("tileserver", "سرویس نقشه", "http://tileserver:8080/"),
    )

    async def probe(client: httpx.AsyncClient, item: tuple[str, str, str]) -> dict[str, Any]:
        key, name, url = item
        started = time.perf_counter()
        try:
            response = await client.get(url)
            healthy = response.status_code < 500
            latency = round((time.perf_counter() - started) * 1000)
        except httpx.HTTPError:
            healthy = False
            latency = None
        return {"key": key, "name": name, "healthy": healthy, "latencyMs": latency}

    async with httpx.AsyncClient(timeout=1.5, follow_redirects=True) as client:
        services = await asyncio.gather(*(probe(client, target) for target in targets))
    services.insert(0, {"key": "database", "name": "پایگاه داده", "healthy": True, "latencyMs": None})
    return services


def _workspace_payload(user: User) -> dict[str, Any]:
    stored = (user.system_info or {}).get("dashboardWorkspace")
    if not isinstance(stored, dict):
        return {"version": 1, "layouts": {}, "hiddenWidgetIds": []}
    return {
        "version": stored.get("version") if isinstance(stored.get("version"), int) else 1,
        "layouts": stored.get("layouts") if isinstance(stored.get("layouts"), dict) else {},
        "hiddenWidgetIds": stored.get("hiddenWidgetIds")
        if isinstance(stored.get("hiddenWidgetIds"), list)
        else [],
    }


async def _current_user(db: DbSession, actor: dict[str, Any]) -> User:
    user_id = actor.get("user_id")
    user = await db.get(User, user_id) if user_id else None
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="حساب کاربری یافت نشد")
    return user


@router.get("/workspace", response_model=dict)
async def get_workspace(
    db: DbSession, actor: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    return success(_workspace_payload(await _current_user(db, actor)))


@router.put("/workspace", response_model=dict)
async def save_workspace(
    payload: DashboardWorkspacePayload,
    db: DbSession,
    actor: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if set(payload.layouts) - WORKSPACE_BREAKPOINTS:
        raise HTTPException(status_code=422, detail="اندازه صفحه نامعتبر است")
    for items in payload.layouts.values():
        if len(items) > len(WORKSPACE_WIDGETS) or any(item.i not in WORKSPACE_WIDGETS for item in items):
            raise HTTPException(status_code=422, detail="چیدمان داشبورد نامعتبر است")
        if len({item.i for item in items}) != len(items):
            raise HTTPException(status_code=422, detail="ویجت تکراری در چیدمان وجود دارد")
    if any(item not in WORKSPACE_WIDGETS for item in payload.hiddenWidgetIds):
        raise HTTPException(status_code=422, detail="شناسه ویجت نامعتبر است")

    user = await _current_user(db, actor)
    workspace = payload.model_dump(exclude_none=True)
    system_info = dict(user.system_info or {})
    system_info["dashboardWorkspace"] = workspace
    user.system_info = system_info
    user.touch()
    await db.commit()
    return success(workspace)


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
    since_24h = now - timedelta(hours=24)
    since_7d = now - timedelta(days=7)
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
    storage_data = await asyncio.to_thread(_storage_usage) if "storage_usage" in visible else None
    services = await _service_health() if "healthy_services" in visible else []
    login_logs = list(
        (
            await db.execute(
                select(UserAuditLog).where(UserAuditLog.created_at >= since_24h)
            )
        ).scalars()
    ) if role == "SUPER_ADMIN" else []
    active_user_ids = {
        item.actor_user_id
        for item in login_logs
        if item.action == "login_succeeded" and item.actor_user_id
    }
    failed_24h = sum(item.action in {"login_failed", "account_locked"} for item in login_logs)

    user_activity: list[dict[str, Any]] = []
    if role == "SUPER_ADMIN":
        scenario_logs = list(
            (
                await db.execute(
                    select(ScenarioAuditLog).where(ScenarioAuditLog.created_at >= since_7d)
                )
            ).scalars()
        )
        users_by_id = {item.id: item for item in users}
        activity_by_user: dict[str, dict[str, int]] = {}
        for item in scenario_logs:
            if not item.actor_user_id:
                continue
            bucket = activity_by_user.setdefault(item.actor_user_id, {"created": 0, "changed": 0})
            if item.action == "create":
                bucket["created"] += 1
            else:
                bucket["changed"] += 1
        ranked_users = sorted(
            (item for item in users if item.is_active and not item.deleted_at),
            key=lambda item: sum(activity_by_user.get(item.id, {}).values()),
            reverse=True,
        )[:10]
        for user in ranked_users:
            counts = activity_by_user.get(user.id, {"created": 0, "changed": 0})
            personal = user.personal_info or {}
            user_activity.append({
                "userId": user.id,
                "name": personal.get("fullName") or user.username,
                **counts,
            })
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
    ordered_scenarios = sorted(scenarios, key=lambda item: item.modified, reverse=True)
    latest_scenario = next((item for item in ordered_scenarios if not item.archived_at), None)
    raw_statuses = [_raw_scenario_status(item) for item in scenarios]
    draft_statuses = {"draft", "pending", "not_started"}
    review_statuses = {"ready", "review", "under_review", "awaiting_review", "ready_for_review"}
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
        "scenarioOverview": {
            "total": len(scenarios),
            "draft": sum(status in draft_statuses for status in raw_statuses),
            "readyForReview": sum(status in review_statuses for status in raw_statuses),
            "archived": sum(item.archived_at is not None for item in scenarios),
        },
        "latestScenario": _scenario_card(latest_scenario) if latest_scenario else None,
        "recentScenarios": [_scenario_card(item) for item in ordered_scenarios[:4]],
        "managementMetrics": {
            "activeUsers24h": len(active_user_ids),
            "failedLogins24h": failed_24h,
            "storage": storage_data,
            "services": {
                "healthy": sum(item["healthy"] for item in services),
                "total": len(services),
                "items": services,
            },
            "userActivity": user_activity,
            "activityWindowDays": 7,
        } if role == "SUPER_ADMIN" else None,
    })

