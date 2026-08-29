from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scenario import Scenario
from app.realtime.manager import manager
from app.schemas.scenario import ScenarioOut


def _merge_units(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = deepcopy(existing or [])
    positions = {str(unit.get("id")): index for index, unit in enumerate(result) if unit.get("id")}
    for imported in incoming or []:
        key = str(imported.get("id") or "")
        if key and key in positions:
            index = positions[key]
            current = result[index]
            merged = {**current, **deepcopy(imported)}
            merged["subUnits"] = _merge_units(current.get("subUnits") or [], imported.get("subUnits") or [])
            result[index] = merged
        else:
            positions[key] = len(result)
            result.append(deepcopy(imported))
    return result


def _collect_unit_ids(units: list[dict[str, Any]]) -> set[str]:
    found: set[str] = set()
    for unit in units or []:
        if unit.get("id"):
            found.add(str(unit["id"]))
        found.update(_collect_unit_ids(unit.get("subUnits") or []))
    return found


def _merge_sides(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = deepcopy(existing or [])
    for imported_side in incoming or []:
        identity = str(imported_side.get("standardIdentity") or imported_side.get("id") or "")
        side_index = next(
            (
                index
                for index, side in enumerate(result)
                if str(side.get("standardIdentity") or side.get("id") or "") == identity
            ),
            None,
        )
        if side_index is None:
            result.append(deepcopy(imported_side))
            continue
        current_side = result[side_index]
        merged_side = {**current_side, **deepcopy(imported_side)}
        groups = deepcopy(current_side.get("groups") or [])
        for imported_group in imported_side.get("groups") or []:
            group_id = str(imported_group.get("id") or "")
            group_index = next((i for i, group in enumerate(groups) if str(group.get("id") or "") == group_id), None)
            if group_index is None:
                imported_ids = _collect_unit_ids(imported_group.get("subUnits") or [])
                group_index = next(
                    (
                        i
                        for i, group in enumerate(groups)
                        if imported_ids & _collect_unit_ids(group.get("subUnits") or [])
                    ),
                    None,
                )
            if group_index is None and groups:
                group_index = 0
            if group_index is None:
                groups.append(deepcopy(imported_group))
            else:
                current_group = groups[group_index]
                groups[group_index] = {
                    **current_group,
                    **deepcopy(imported_group),
                    "subUnits": _merge_units(
                        current_group.get("subUnits") or [], imported_group.get("subUnits") or []
                    ),
                }
        merged_side["groups"] = groups
        result[side_index] = merged_side
    return result


def _upsert_items(
    existing: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
    *,
    keys: tuple[str, ...],
) -> list[dict[str, Any]]:
    result = deepcopy(existing or [])

    def item_key(item: dict[str, Any]) -> str:
        for key in keys:
            value = item.get(key)
            if value not in (None, ""):
                return f"{key}:{value}"
        return ""

    positions = {item_key(item): index for index, item in enumerate(result) if item_key(item)}
    for imported in incoming or []:
        key = item_key(imported)
        if key and key in positions:
            index = positions[key]
            result[index] = {**result[index], **deepcopy(imported)}
        else:
            if key:
                positions[key] = len(result)
            result.append(deepcopy(imported))
    return result


def _merge_layers(existing: list[dict[str, Any]], incoming: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = deepcopy(existing or [])
    positions = {str(layer.get("id")): index for index, layer in enumerate(result) if layer.get("id")}
    for imported in incoming or []:
        layer_id = str(imported.get("id") or "")
        if layer_id and layer_id in positions:
            index = positions[layer_id]
            current = result[index]
            result[index] = {
                **current,
                **deepcopy(imported),
                "features": _upsert_items(
                    current.get("features") or [], imported.get("features") or [], keys=("id",)
                ),
            }
        else:
            positions[layer_id] = len(result)
            result.append(deepcopy(imported))
    return result


def merge_scenario_content(existing: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    """Add or update imported records while preserving records absent from the workbook."""
    merged = {**deepcopy(existing), **deepcopy(incoming)}
    merged["id"] = existing.get("id") or incoming.get("id")
    merged["sides"] = _merge_sides(existing.get("sides") or [], incoming.get("sides") or [])
    merged["events"] = _upsert_items(existing.get("events") or [], incoming.get("events") or [], keys=("id",))
    merged["layers"] = _merge_layers(existing.get("layers") or [], incoming.get("layers") or [])
    merged["equipment"] = _upsert_items(
        existing.get("equipment") or [], incoming.get("equipment") or [], keys=("sourceId", "name")
    )
    merged["personnel"] = _upsert_items(
        existing.get("personnel") or [], incoming.get("personnel") or [], keys=("sourceId", "name")
    )
    merged["mapLayers"] = deepcopy(existing.get("mapLayers") or incoming.get("mapLayers") or [])
    merged["settings"] = {**deepcopy(existing.get("settings") or {}), **deepcopy(incoming.get("settings") or {})}
    merged["metadata"] = {
        **deepcopy(existing.get("metadata") or {}),
        **deepcopy(incoming.get("metadata") or {}),
    }
    merged["meta"] = {**deepcopy(existing.get("meta") or {}), **deepcopy(incoming.get("meta") or {})}
    if (existing.get("meta") or {}).get("createdDate"):
        merged["meta"]["createdDate"] = existing["meta"]["createdDate"]

    existing_storyboard = existing.get("storyboard") or {}
    incoming_storyboard = incoming.get("storyboard") or {}
    merged["storyboard"] = {
        **deepcopy(existing_storyboard),
        **deepcopy(incoming_storyboard),
        "scenes": _upsert_items(
            existing_storyboard.get("scenes") or [], incoming_storyboard.get("scenes") or [], keys=("id",)
        ),
        "settings": {
            **deepcopy(existing_storyboard.get("settings") or {}),
            **deepcopy(incoming_storyboard.get("settings") or {}),
        },
    }
    return merged


async def upsert_scenario_from_import(
    db: AsyncSession,
    *,
    scenario_id: str,
    name: str,
    description: str | None,
    image: str | None,
    content: dict,
) -> tuple[Scenario, bool]:
    """
    Insert a new scenario or update an existing one by id.

    Returns (scenario, created) where created is True for INSERT and False for UPDATE.
    Preserves created, intro fields, and archived_at on update.
    """
    now = datetime.now(timezone.utc)
    content = {**content, "id": scenario_id}

    existing = await db.get(Scenario, scenario_id)

    if existing is None:
        obj = Scenario(
            id=scenario_id,
            name=name,
            description=description,
            image=image,
            content=content,
            created=now,
            modified=now,
        )
        db.add(obj)
        created = True
    else:
        existing.name = name
        existing.description = description
        existing.image = image
        existing.content = content
        existing.modified = now
        obj = existing
        created = False

    try:
        await db.commit()
        await db.refresh(obj)
    except Exception:
        await db.rollback()
        raise

    return obj, created


async def broadcast_scenario_import(obj: Scenario, created: bool) -> None:
    event_type = "scenario_created" if created else "scenario_updated"
    await manager.broadcast(
        "scenarios",
        {"type": event_type, "data": ScenarioOut.model_validate(obj).model_dump()},
    )


def scenario_import_response_data(obj: Scenario, created: bool) -> dict:
    return {
        **ScenarioOut.model_validate(obj).model_dump(),
        "importAction": "created" if created else "updated",
    }
