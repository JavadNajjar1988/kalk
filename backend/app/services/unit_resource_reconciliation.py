from __future__ import annotations

from typing import Any


def _occurrence_key(item: dict[str, Any], resource_type: str) -> str:
    source_id = item.get("sourceId") or item.get("source_id")
    if source_id:
        return f"source:{source_id}"
    item_id = item.get("equipmentId") if resource_type == "equipment" else item.get("personnelId")
    if item_id:
        return f"source:{item_id}"
    name = str(item.get("name") or item.get("unitName") or "").strip().casefold()
    return f"name:{name}"


def collect_unlinked_unit_occurrences(
    scenario_id: str,
    scenario_name: str,
    content: dict[str, Any],
) -> list[dict[str, Any]]:
    occurrences: list[dict[str, Any]] = []

    def visit(unit: dict[str, Any], side_name: str, parent_name: str | None) -> None:
        unit_id = str(unit.get("id") or "")
        if unit_id and not (unit.get("linkedResourceId") or unit.get("resourceId")):
            occurrences.append(
                {
                    "scenarioId": scenario_id,
                    "scenarioName": scenario_name,
                    "unitId": unit_id,
                    "unitName": str(unit.get("name") or unit_id),
                    "sidc": unit.get("sidc"),
                    "sideName": side_name,
                    "parentUnitName": parent_name,
                }
            )
        for child in unit.get("subUnits") or []:
            visit(child, side_name, str(unit.get("name") or "") or parent_name)

    for side in content.get("sides") or []:
        side_name = str(side.get("name") or "")
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                visit(unit, side_name, None)
        for unit in side.get("subUnits") or []:
            visit(unit, side_name, None)
    return occurrences


def link_unit_occurrence(
    content: dict[str, Any],
    unit_id: str,
    resource_id: str,
    resource_name: str,
) -> bool:
    linked = False

    def visit(unit: dict[str, Any]) -> None:
        nonlocal linked
        if not linked and str(unit.get("id") or "") == unit_id:
            unit["linkedResourceId"] = resource_id
            unit["linkedResourceLabel"] = resource_name
            linked = True
            return
        for child in unit.get("subUnits") or []:
            visit(child)

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                visit(unit)
        for unit in side.get("subUnits") or []:
            visit(unit)
    return linked


def collect_unlinked_resource_occurrences(
    scenario_id: str,
    scenario_name: str,
    content: dict[str, Any],
    resource_type: str,
) -> list[dict[str, Any]]:
    """Group old unlinked equipment/personnel references into confirmable rows."""
    if resource_type not in {"equipment", "personnel"}:
        return []

    grouped: dict[str, dict[str, Any]] = {}

    def add(item: dict[str, Any], unit_name: str | None = None) -> None:
        if item.get("resourceId"):
            return
        key = _occurrence_key(item, resource_type)
        if key == "name:":
            return
        name = str(item.get("name") or item.get("equipmentType") or key.removeprefix("source:"))
        row = grouped.setdefault(
            key,
            {
                "scenarioId": scenario_id,
                "scenarioName": scenario_name,
                "occurrenceKey": key,
                "resourceType": resource_type,
                "itemName": name,
                "sourceCode": key.removeprefix("source:") if key.startswith("source:") else None,
                "unitNames": [],
                "occurrenceCount": 0,
            },
        )
        row["occurrenceCount"] += 1
        if unit_name and unit_name not in row["unitNames"]:
            row["unitNames"].append(unit_name)

    for item in content.get(resource_type) or []:
        add(item)

    allocation_key = resource_type

    def visit(unit: dict[str, Any]) -> None:
        unit_name = str(unit.get("name") or unit.get("id") or "یگان")
        for item in unit.get(allocation_key) or []:
            add(item, unit_name)
        for child in unit.get("subUnits") or []:
            visit(child)

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                visit(unit)
        for unit in side.get("subUnits") or []:
            visit(unit)

    if resource_type == "equipment":
        for layer in content.get("layers") or []:
            for feature in layer.get("features") or []:
                props = feature.get("properties") or {}
                if props.get("resourceId"):
                    continue
                if props.get("equipmentId") or props.get("equipmentType"):
                    feature_item = {
                        "equipmentId": props.get("equipmentId"),
                        "name": props.get("equipmentType") or (feature.get("meta") or {}).get("name"),
                    }
                    add(feature_item, props.get("unitName") or "موقعیت مستقل")

    return sorted(grouped.values(), key=lambda item: (item["scenarioName"], item["itemName"]))


def link_resource_occurrence(
    content: dict[str, Any],
    resource_type: str,
    occurrence_key: str,
    resource_id: str,
) -> int:
    """Link only references represented by one user-confirmed grouped occurrence."""
    if resource_type not in {"equipment", "personnel"}:
        return 0
    linked = 0

    def apply(item: dict[str, Any]) -> None:
        nonlocal linked
        if not item.get("resourceId") and _occurrence_key(item, resource_type) == occurrence_key:
            item["resourceId"] = resource_id
            linked += 1

    for item in content.get(resource_type) or []:
        apply(item)

    def visit(unit: dict[str, Any]) -> None:
        for item in unit.get(resource_type) or []:
            apply(item)
        for child in unit.get("subUnits") or []:
            visit(child)

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                visit(unit)
        for unit in side.get("subUnits") or []:
            visit(unit)

    if resource_type == "equipment":
        for layer in content.get("layers") or []:
            for feature in layer.get("features") or []:
                props = feature.get("properties") or {}
                feature_item = {
                    "equipmentId": props.get("equipmentId"),
                    "name": props.get("equipmentType") or (feature.get("meta") or {}).get("name"),
                }
                if (
                    not props.get("resourceId")
                    and (props.get("equipmentId") or props.get("equipmentType"))
                    and _occurrence_key(feature_item, resource_type) == occurrence_key
                ):
                    props["resourceId"] = resource_id
                    linked += 1

    return linked
