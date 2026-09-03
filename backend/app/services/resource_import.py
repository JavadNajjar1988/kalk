from __future__ import annotations

import uuid
from collections.abc import Mapping
from typing import Any, Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource import Resource
from app.schemas.resource import RESOURCE_TYPES, ResourceBulkImportItem


def workbook_resources_to_bulk_items(
    personnel: Iterable[dict[str, Any]],
    equipment: Iterable[dict[str, Any]],
    units: Iterable[dict[str, Any]] = (),
) -> list[ResourceBulkImportItem]:
    """Convert Excel resource rows to the shared resource persistence schema."""
    items: list[ResourceBulkImportItem] = []

    for row in personnel:
        name = f"{row.get('firstName') or ''} {row.get('lastName') or ''}".strip()
        metadata = {
            key: value
            for key, value in row.items()
            if key not in {"id", "personalCode", "status", "createdAt", "updatedAt"}
            and value is not None
        }
        items.append(
            ResourceBulkImportItem(
                type="personnel",
                name=name or str(row.get("personalCode") or "منبع"),
                code=row.get("personalCode"),
                status=row.get("status"),
                metadata=metadata,
            )
        )

    for row in equipment:
        metadata = {
            key: value
            for key, value in row.items()
            if key
            not in {
                "id",
                "equipmentCode",
                "name",
                "status",
                "createdAt",
                "updatedAt",
            }
            and value is not None
        }
        items.append(
            ResourceBulkImportItem(
                type="equipment",
                name=str(row.get("name") or row.get("equipmentCode") or "منبع"),
                code=row.get("equipmentCode"),
                status=row.get("status"),
                metadata=metadata,
            )
        )

    for row in units:
        metadata = {
            key: value
            for key, value in row.items()
            if key not in {"id", "unitCode", "name", "description", "status"}
            and value is not None
        }
        items.append(
            ResourceBulkImportItem(
                type="units",
                name=str(row.get("name") or row.get("unitCode") or "یگان"),
                code=row.get("unitCode") or row.get("id"),
                description=row.get("description"),
                status=row.get("status"),
                metadata=metadata,
            )
        )

    return items


def scenario_units_to_bulk_items(content: dict[str, Any]) -> list[ResourceBulkImportItem]:
    """Build canonical unit resources from a scenario hierarchy."""
    items: list[ResourceBulkImportItem] = []

    def visit(unit: dict[str, Any], side_name: str, parent_code: str | None) -> None:
        code = str(unit.get("resourceCode") or unit.get("id") or "").strip()
        name = str(unit.get("name") or code or "یگان").strip()
        if code:
            metadata = {
                "sidc": unit.get("sidc"),
                "shortName": unit.get("shortName"),
                "side": side_name,
                "parentCode": unit.get("parentCode") or parent_code,
                "parentName": unit.get("parentName"),
                "echelon": unit.get("echelon"),
                "unitType": unit.get("unitType"),
                "organizationalAffiliation": unit.get("organizationalAffiliation"),
                "formedOn": unit.get("formedOn"),
                "deactivatedOn": unit.get("deactivatedOn"),
                "province": unit.get("province"),
                "garrisonCity": unit.get("garrisonCity"),
                "baseName": unit.get("baseName"),
                "capabilities": unit.get("capabilities") or [],
                "nominalPersonnelStrength": unit.get("nominalPersonnelStrength"),
                "defaultReadiness": unit.get("defaultReadiness"),
                "areaOfOps": unit.get("areaOfOps"),
                "commanderName": unit.get("commanderName"),
                "contact": unit.get("contact"),
            }
            items.append(
                ResourceBulkImportItem(
                    type="units",
                    name=name,
                    code=code,
                    description=unit.get("description"),
                    status=unit.get("status"),
                    metadata={key: value for key, value in metadata.items() if value is not None},
                )
            )
        for child in unit.get("subUnits") or []:
            visit(child, side_name, code or parent_code)

    for side in content.get("sides") or []:
        side_name = str(side.get("name") or "")
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                visit(unit, side_name, None)
        for unit in side.get("subUnits") or []:
            visit(unit, side_name, None)

    return items


async def upsert_resource_import_items(
    session: AsyncSession,
    items: Iterable[ResourceBulkImportItem],
    *,
    commit: bool = True,
    include_resource_ids: bool = False,
) -> dict[str, Any]:
    """Create or update resource rows using type and code as the stable identity."""
    created = 0
    updated = 0
    skipped = 0
    resource_ids: dict[str, dict[str, str]] = {
        "equipment": {},
        "personnel": {},
        "units": {},
    }

    for raw in items:
        if raw.type not in RESOURCE_TYPES or not raw.name:
            skipped += 1
            continue

        existing = None
        if raw.code:
            result = await session.execute(
                select(Resource).where(Resource.type == raw.type, Resource.code == raw.code)
            )
            existing = result.scalar_one_or_none()

        if existing:
            existing.name = raw.name
            existing.description = raw.description
            existing.status = raw.status
            if raw.metadata is not None:
                existing.metadata_ = {**(existing.metadata_ or {}), **raw.metadata}
            if raw.code and raw.type in resource_ids:
                resource_ids[raw.type][raw.code] = existing.id
            updated += 1
            continue

        resource = Resource(
            id=f"{raw.type}-{uuid.uuid4().hex}",
            type=raw.type,
            name=raw.name,
            code=raw.code,
            description=raw.description,
            status=raw.status,
            metadata_=raw.metadata,
        )
        session.add(resource)
        if raw.code and raw.type in resource_ids:
            resource_ids[raw.type][raw.code] = resource.id
        created += 1

    if commit:
        await session.commit()
    else:
        await session.flush()

    result: dict[str, Any] = {"created": created, "updated": updated, "skipped": skipped}
    if include_resource_ids:
        result["resourceIds"] = resource_ids
    return result


def link_scenario_content_to_resources(
    content: dict[str, Any],
    personnel_rows: Iterable[dict[str, Any]],
    equipment_rows: Iterable[dict[str, Any]],
    resource_ids: Mapping[str, Mapping[str, str]],
) -> None:
    """Attach persistent resource IDs to scenario catalog items and unit allocations."""
    equipment_by_source = {
        str(row.get("id")): resource_ids.get("equipment", {}).get(str(row.get("equipmentCode")))
        for row in equipment_rows
        if row.get("id") and row.get("equipmentCode")
    }
    personnel_by_source = {
        str(row.get("id")): resource_ids.get("personnel", {}).get(str(row.get("personalCode")))
        for row in personnel_rows
        if row.get("id") and row.get("personalCode")
    }
    units_by_code = resource_ids.get("units", {})

    equipment_by_name: dict[str, str] = {}
    for item in content.get("equipment") or []:
        source_id = str(item.get("sourceId") or "")
        resource_id = equipment_by_source.get(source_id)
        if resource_id:
            item["resourceId"] = resource_id
            if item.get("name"):
                equipment_by_name[str(item["name"])] = resource_id

    personnel_by_name: dict[str, str] = {}
    for item in content.get("personnel") or []:
        source_id = str(item.get("sourceId") or "")
        resource_id = personnel_by_source.get(source_id)
        if resource_id:
            item["resourceId"] = resource_id
            if item.get("name"):
                personnel_by_name[str(item["name"])] = resource_id

    def link_unit(unit: dict[str, Any]) -> None:
        unit_resource_id = units_by_code.get(
            str(unit.get("resourceCode") or unit.get("id") or "")
        )
        if unit_resource_id:
            unit["linkedResourceId"] = unit_resource_id
            unit["linkedResourceLabel"] = unit.get("name")
        for item in unit.get("equipment") or []:
            resource_id = equipment_by_source.get(str(item.get("sourceId") or ""))
            resource_id = resource_id or equipment_by_name.get(str(item.get("name") or ""))
            if resource_id:
                item["resourceId"] = resource_id
        for item in unit.get("personnel") or []:
            resource_id = personnel_by_source.get(str(item.get("sourceId") or ""))
            resource_id = resource_id or personnel_by_name.get(str(item.get("name") or ""))
            if resource_id:
                item["resourceId"] = resource_id
        for child in unit.get("subUnits") or []:
            link_unit(child)

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            for unit in group.get("subUnits") or []:
                link_unit(unit)
        for unit in side.get("subUnits") or []:
            link_unit(unit)

    for layer in content.get("layers") or []:
        for feature in layer.get("features") or []:
            props = feature.get("properties") or {}
            resource_id = equipment_by_source.get(str(props.get("equipmentId") or ""))
            if resource_id:
                props["resourceId"] = resource_id
