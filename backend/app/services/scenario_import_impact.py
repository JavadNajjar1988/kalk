from __future__ import annotations

from typing import Any, Iterable


def _item_keys(items: Iterable[dict[str, Any]], fields: tuple[str, ...]) -> set[str]:
    keys: set[str] = set()
    for item in items or []:
        for field in fields:
            value = item.get(field)
            if value not in (None, ""):
                keys.add(f"{field}:{value}")
                break
    return keys


def _unit_keys(content: dict[str, Any]) -> set[str]:
    keys: set[str] = set()

    def visit(unit: dict[str, Any]) -> None:
        value = unit.get("id") or unit.get("name")
        if value not in (None, ""):
            keys.add(str(value))
        for child in unit.get("subUnits") or []:
            visit(child)

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                visit(unit)
        for unit in side.get("subUnits") or []:
            visit(unit)
    return keys


def _feature_keys(content: dict[str, Any]) -> set[str]:
    keys: set[str] = set()
    for layer in content.get("layers") or []:
        layer_id = str(layer.get("id") or layer.get("name") or "layer")
        for index, feature in enumerate(layer.get("features") or []):
            feature_id = feature.get("id") or (feature.get("properties") or {}).get("id")
            keys.add(f"{layer_id}:{feature_id or index}")
    return keys


def _storyboard_keys(content: dict[str, Any]) -> set[str]:
    return _item_keys((content.get("storyboard") or {}).get("scenes") or [], ("id", "title"))


def _collection_impact(current: set[str], incoming: set[str], merge_mode: str) -> dict[str, int]:
    added = incoming - current
    updated = incoming & current
    absent = current - incoming
    return {
        "current": len(current),
        "incoming": len(incoming),
        "added": len(added),
        "updated": len(updated),
        "removed": len(absent) if merge_mode == "replace" else 0,
        "preserved": len(absent) if merge_mode == "merge" else 0,
        "result": len(current | incoming) if merge_mode == "merge" else len(incoming),
    }


def build_scenario_import_impact(
    existing: dict[str, Any] | None,
    incoming: dict[str, Any],
    merge_mode: str,
) -> dict[str, Any]:
    current = existing or {}
    collectors = {
        "events": lambda value: _item_keys(value.get("events") or [], ("id", "title")),
        "units": _unit_keys,
        "equipmentCatalog": lambda value: _item_keys(
            value.get("equipment") or [], ("sourceId", "resourceId", "name")
        ),
        "personnelCatalog": lambda value: _item_keys(
            value.get("personnel") or [], ("sourceId", "resourceId", "name")
        ),
        "features": _feature_keys,
        "storyboardScenes": _storyboard_keys,
    }
    collections = {
        name: _collection_impact(collector(current), collector(incoming), merge_mode)
        for name, collector in collectors.items()
    }
    return {
        "scenarioAction": "updated" if existing is not None else "created",
        "mergeMode": merge_mode,
        "collections": collections,
        "totals": {
            field: sum(item[field] for item in collections.values())
            for field in ("added", "updated", "removed", "preserved")
        },
    }
