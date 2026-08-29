from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scenario import Scenario


def normalize_scenario_ids(values: list[str] | None) -> list[str]:
    """Return stable, unique, non-empty scenario identifiers."""
    normalized: list[str] = []
    seen: set[str] = set()
    for value in values or []:
        scenario_id = str(value).strip()
        if not scenario_id or scenario_id in seen:
            continue
        seen.add(scenario_id)
        normalized.append(scenario_id)
    return normalized


def filter_catalog_for_scenario(payload: dict, scenario_id: str | None) -> dict:
    if not scenario_id:
        return payload
    filtered_layers = []
    for layer in payload.get("layers") or []:
        if not isinstance(layer, dict):
            continue
        admin = layer.get("admin")
        assigned_ids = admin.get("scenario_ids") if isinstance(admin, dict) else []
        if isinstance(assigned_ids, list) and scenario_id in assigned_ids:
            filtered_layers.append(layer)
    return {**payload, "layers": filtered_layers}


async def validate_scenario_ids(
    session: AsyncSession,
    values: list[str] | None,
) -> list[str]:
    scenario_ids = normalize_scenario_ids(values)
    if not scenario_ids:
        return []

    result = await session.execute(
        select(Scenario.id).where(Scenario.id.in_(scenario_ids))
    )
    existing_ids = set(result.scalars().all())
    missing_ids = [scenario_id for scenario_id in scenario_ids if scenario_id not in existing_ids]
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=f"سناریوی انتخاب‌شده یافت نشد: {', '.join(missing_ids)}",
        )
    return scenario_ids
