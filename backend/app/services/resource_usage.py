from __future__ import annotations

from typing import Any, Iterable

from app.models.resource import Resource
from app.models.scenario import Scenario


PARTICIPATION_STATUS_LABELS = {
    "planned": "برنامه‌ریزی‌شده",
    "deployed": "اعزام‌شده",
    "active": "فعال در عملیات",
    "completed": "پایان‌یافته",
    "cancelled": "لغوشده",
    "unavailable": "خارج از دسترس",
}


def _status_label(value: Any, fallback: str) -> str:
    if value is None or value == "":
        return fallback
    return PARTICIPATION_STATUS_LABELS.get(str(value), str(value))


def _iter_units(content: dict[str, Any]):
    def visit(unit: dict[str, Any], side_name: str, parent_name: str | None):
        yield unit, side_name, parent_name
        for child in unit.get("subUnits") or []:
            yield from visit(child, side_name, unit.get("name"))

    for side in content.get("sides") or []:
        side_name = str(side.get("name") or "")
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                yield from visit(unit, side_name, None)
        for unit in side.get("subUnits") or []:
            yield from visit(unit, side_name, None)


def _scenario_value(scenario: Scenario, content: dict[str, Any], key: str):
    value = getattr(scenario, key, None)
    return value if value is not None else content.get(key)


def build_resource_usage_graph(
    resource: Resource,
    scenarios: Iterable[Scenario],
) -> dict[str, Any]:
    """Build a read-only cross-scenario usage graph from persistent resource links."""
    operations: list[dict[str, Any]] = []

    for scenario in scenarios:
        content = scenario.content or {}
        assignments: list[dict[str, Any]] = []

        for unit, side_name, parent_name in _iter_units(content):
            unit_id = str(unit.get("id") or "")
            unit_name = str(unit.get("name") or unit_id or "یگان")
            unit_status = unit.get("status")

            if resource.type == "units" and (
                unit.get("linkedResourceId") == resource.id
                or unit.get("resourceId") == resource.id
            ):
                assignments.append(
                    {
                        "kind": "unit",
                        "unitId": unit_id,
                        "unitName": unit_name,
                        "parentUnitName": parent_name,
                        "sideName": side_name,
                        "status": _status_label(unit_status, "تخصیص‌یافته"),
                        "quantity": 1,
                        "onHand": 1,
                    }
                )

            allocation_key = "equipment" if resource.type == "equipment" else "personnel"
            if resource.type in {"equipment", "personnel"}:
                for item in unit.get(allocation_key) or []:
                    if item.get("resourceId") != resource.id:
                        continue
                    assignments.append(
                        {
                            "kind": resource.type,
                            "unitId": unit_id,
                            "unitName": unit_name,
                            "parentUnitName": parent_name,
                            "sideName": side_name,
                            "status": _status_label(
                                item.get("participationStatus") or unit_status,
                                "تخصیص‌یافته",
                            ),
                            "quantity": item.get("count"),
                            "onHand": item.get("onHand"),
                        }
                    )

        if resource.type == "equipment":
            for layer in content.get("layers") or []:
                for feature in layer.get("features") or []:
                    props = feature.get("properties") or {}
                    if props.get("resourceId") != resource.id:
                        continue
                    meta = feature.get("meta") or {}
                    geometry = feature.get("geometry") or {}
                    assignments.append(
                        {
                            "kind": "positioned-equipment",
                            "unitId": props.get("unitId"),
                            "unitName": props.get("unitName") or "موقعیت مستقل",
                            "sideName": None,
                            "status": _status_label(
                                props.get("participationStatus"), "مستقر"
                            ),
                            "quantity": props.get("quantity"),
                            "onHand": props.get("quantity"),
                            "location": geometry.get("coordinates"),
                            "startTime": meta.get("visibleFromT"),
                            "endTime": meta.get("visibleUntilT"),
                        }
                    )

        if not assignments:
            continue

        operations.append(
            {
                "scenarioId": scenario.id,
                "scenarioName": scenario.name,
                "scenarioStatus": content.get("status") or "برنامه‌ریزی‌شده",
                "startTime": _scenario_value(scenario, content, "start_time")
                or content.get("startTime"),
                "endTime": _scenario_value(scenario, content, "end_time")
                or content.get("endTime"),
                "assignments": assignments,
            }
        )

    operations.sort(key=lambda item: str(item.get("startTime") or ""))
    return {
        "resource": {
            "id": resource.id,
            "type": resource.type,
            "name": resource.name,
            "code": resource.code,
            "status": resource.status,
        },
        "summary": {
            "operationsCount": len(operations),
            "assignmentsCount": sum(len(item["assignments"]) for item in operations),
        },
        "operations": operations,
    }
