from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scenario import Scenario
from app.realtime.manager import manager
from app.schemas.scenario import ScenarioOut


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
