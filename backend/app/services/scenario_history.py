from __future__ import annotations

import json
import math
from typing import Any, Callable


MAX_RECORDED_CHANGES = 50


def _same(left: Any, right: Any) -> bool:
    return json.dumps(left, sort_keys=True, ensure_ascii=False, default=str) == json.dumps(
        right, sort_keys=True, ensure_ascii=False, default=str
    )


def _position_from_geometry(geometry: Any) -> list[float] | None:
    if not isinstance(geometry, dict):
        return None
    value = geometry.get("coordinates")
    if value is None and geometry.get("type") == "GeometryCollection":
        for child in geometry.get("geometries") or []:
            position = _position_from_geometry(child)
            if position:
                return position
    while isinstance(value, list) and value and isinstance(value[0], list):
        value = value[0]
    if (
        isinstance(value, list)
        and len(value) >= 2
        and isinstance(value[0], (int, float))
        and isinstance(value[1], (int, float))
    ):
        return [float(value[0]), float(value[1])]
    return None


def _to_lon_lat(position: list[float] | None) -> list[float] | None:
    if not position:
        return None
    x, y = position[:2]
    if abs(x) <= 180 and abs(y) <= 90:
        return [round(x, 6), round(y, 6)]
    if abs(x) > 20_037_508.35 or abs(y) > 20_037_508.35:
        return None
    lon = x / 20_037_508.34 * 180
    lat = math.degrees(
        2 * math.atan(math.exp(y / 20_037_508.34 * math.pi)) - math.pi / 2
    )
    return [round(lon, 6), round(lat, 6)]


def _point_in_ring(point: list[float], ring: list[Any]) -> bool:
    x, y = point
    inside = False
    if len(ring) < 3:
        return False
    j = len(ring) - 1
    for i, raw in enumerate(ring):
        previous = ring[j]
        if (
            isinstance(raw, list)
            and len(raw) >= 2
            and isinstance(previous, list)
            and len(previous) >= 2
        ):
            xi, yi = raw[0], raw[1]
            xj, yj = previous[0], previous[1]
            if (yi > y) != (yj > y):
                crossing_x = (xj - xi) * (y - yi) / (yj - yi) + xi
                if x < crossing_x:
                    inside = not inside
        j = i
    return inside


def _geometry_contains(geometry: Any, point: list[float]) -> bool:
    if not isinstance(geometry, dict):
        return False
    coordinates = geometry.get("coordinates") or []
    if geometry.get("type") == "Polygon":
        return bool(coordinates and _point_in_ring(point, coordinates[0]))
    if geometry.get("type") == "MultiPolygon":
        return any(polygon and _point_in_ring(point, polygon[0]) for polygon in coordinates)
    return False


def _named_areas(content: dict[str, Any]) -> list[tuple[str, dict[str, Any]]]:
    areas: list[tuple[str, dict[str, Any]]] = []
    for layer in content.get("layers") or []:
        if not isinstance(layer, dict):
            continue
        for feature in layer.get("features") or []:
            if not isinstance(feature, dict):
                continue
            geometry = feature.get("geometry")
            if isinstance(geometry, dict) and geometry.get("type") in {
                "Polygon",
                "MultiPolygon",
            }:
                name = (feature.get("meta") or {}).get("name") or layer.get("name")
                if name:
                    areas.append((str(name), geometry))
    for condition in content.get("environmentalConditions") or []:
        if isinstance(condition, dict) and isinstance(condition.get("geometry"), dict):
            name = condition.get("name") or condition.get("title")
            if name:
                areas.append((str(name), condition["geometry"]))
    return areas


def _region_for(
    position: list[float] | None, areas: list[tuple[str, dict[str, Any]]]
) -> str | None:
    lon_lat = _to_lon_lat(position)
    if not lon_lat:
        return None
    for name, geometry in areas:
        if _geometry_contains(geometry, lon_lat):
            return name
    return None


def _tactical_items(content: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    tuples = (
        ((content.get("metadata") or {}).get("tacticalSymbols") or {}).get("tuples")
        or []
    )
    for item in tuples:
        if (
            isinstance(item, list)
            and len(item) >= 2
            and isinstance(item[0], str)
            and item[0].startswith("feature:")
            and isinstance(item[1], dict)
        ):
            result[item[0]] = item[1]
    return result


def _map_features(content: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for layer in content.get("layers") or []:
        if not isinstance(layer, dict):
            continue
        layer_id = str(layer.get("id") or "")
        layer_name = str(layer.get("name") or "لایه بدون نام")
        for feature in layer.get("features") or []:
            if isinstance(feature, dict) and feature.get("id") is not None:
                result[f"{layer_id}/{feature['id']}"] = {
                    **feature,
                    "_history_layer_name": layer_name,
                }
    return result


def _units(content: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}

    def visit(items: Any, side_name: str | None = None) -> None:
        for unit in items or []:
            if not isinstance(unit, dict):
                continue
            if unit.get("id") is not None:
                result[str(unit["id"])] = {**unit, "_history_side_name": side_name}
            visit(unit.get("subUnits"), side_name)

    for side in content.get("sides") or []:
        if not isinstance(side, dict):
            continue
        side_name = str(side.get("name") or "") or None
        for group in side.get("groups") or []:
            if isinstance(group, dict):
                visit(group.get("subUnits"), side_name)
        visit(side.get("subUnits"), side_name)
    return result


def _unit_position(unit: dict[str, Any]) -> list[float] | None:
    states = unit.get("state") or []
    if states and isinstance(states[-1], dict):
        location = states[-1].get("location")
        if isinstance(location, list) and len(location) >= 2:
            return location
    location = unit.get("location")
    return location if isinstance(location, list) and len(location) >= 2 else None


def _change(
    category: str,
    operation: str,
    item: dict[str, Any],
    *,
    layer: str | None = None,
    side: str | None = None,
    position: list[float] | None = None,
    previous_position: list[float] | None = None,
    areas: list[tuple[str, dict[str, Any]]] | None = None,
    previous_areas: list[tuple[str, dict[str, Any]]] | None = None,
    changed_fields: list[str] | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "category": category,
        "operation": operation,
        "name": str(
            item.get("name") or (item.get("meta") or {}).get("name") or "بدون نام"
        ),
    }
    if layer:
        result["layer"] = layer
    if side:
        result["side"] = side
    if changed_fields:
        result["changed_fields"] = changed_fields
    location = _to_lon_lat(position)
    previous_location = _to_lon_lat(previous_position)
    if location:
        result["location"] = {"lon": location[0], "lat": location[1]}
    if previous_location:
        result["previous_location"] = {
            "lon": previous_location[0],
            "lat": previous_location[1],
        }
    region = _region_for(position, areas or [])
    previous_region = _region_for(previous_position, previous_areas or [])
    if region:
        result["region"] = region
    if previous_region:
        result["previous_region"] = previous_region
    return result


def _diff_collection(
    previous: dict[str, dict[str, Any]],
    current: dict[str, dict[str, Any]],
    *,
    category: str,
    areas: list[tuple[str, dict[str, Any]]],
    previous_areas: list[tuple[str, dict[str, Any]]],
    position_getter: Callable[[dict[str, Any]], list[float] | None],
    layer_getter: Callable[[dict[str, Any]], str | None] = lambda item: None,
    side_getter: Callable[[dict[str, Any]], str | None] = lambda item: None,
) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    for item_id in sorted(current.keys() - previous.keys()):
        item = current[item_id]
        changes.append(
            _change(
                category,
                "added",
                item,
                layer=layer_getter(item),
                side=side_getter(item),
                position=position_getter(item),
                areas=areas,
            )
        )
    for item_id in sorted(previous.keys() - current.keys()):
        item = previous[item_id]
        changes.append(
            _change(
                category,
                "removed",
                item,
                layer=layer_getter(item),
                side=side_getter(item),
                previous_position=position_getter(item),
                previous_areas=previous_areas,
            )
        )
    for item_id in sorted(current.keys() & previous.keys()):
        before, after = previous[item_id], current[item_id]
        if _same(before, after):
            continue
        before_position = position_getter(before)
        after_position = position_getter(after)
        moved = not _same(before_position, after_position)
        ignored = {
            "geometry",
            "location",
            "state",
            "_history_layer_name",
            "_history_side_name",
        }
        changed_fields = sorted(
            key
            for key in set(before) | set(after)
            if key not in ignored and not _same(before.get(key), after.get(key))
        )
        changes.append(
            _change(
                category,
                "moved" if moved and not changed_fields else "edited",
                after,
                layer=layer_getter(after),
                side=side_getter(after),
                position=after_position,
                previous_position=before_position if moved else None,
                areas=areas,
                previous_areas=previous_areas,
                changed_fields=(["position", *changed_fields] if moved else changed_fields),
            )
        )
    return changes


def build_content_history_diff(
    previous_content: Any, current_content: Any
) -> dict[str, Any]:
    previous = previous_content if isinstance(previous_content, dict) else {}
    current = current_content if isinstance(current_content, dict) else {}
    previous_areas = _named_areas(previous)
    areas = _named_areas(current)

    changes: list[dict[str, Any]] = []
    changes.extend(
        _diff_collection(
            _tactical_items(previous),
            _tactical_items(current),
            category="tactical_symbol",
            areas=areas,
            previous_areas=previous_areas,
            position_getter=lambda item: _position_from_geometry(item.get("geometry")),
        )
    )
    changes.extend(
        _diff_collection(
            _units(previous),
            _units(current),
            category="unit",
            areas=areas,
            previous_areas=previous_areas,
            position_getter=_unit_position,
            side_getter=lambda item: item.get("_history_side_name"),
        )
    )
    changes.extend(
        _diff_collection(
            _map_features(previous),
            _map_features(current),
            category="map_feature",
            areas=areas,
            previous_areas=previous_areas,
            position_getter=lambda item: _position_from_geometry(item.get("geometry")),
            layer_getter=lambda item: item.get("_history_layer_name"),
        )
    )

    summary = {
        operation: sum(1 for change in changes if change["operation"] == operation)
        for operation in ("added", "removed", "moved", "edited")
    }
    summary["total"] = len(changes)
    return {
        "summary": summary,
        "changes": changes[:MAX_RECORDED_CHANGES],
        "truncated": len(changes) > MAX_RECORDED_CHANGES,
    }
