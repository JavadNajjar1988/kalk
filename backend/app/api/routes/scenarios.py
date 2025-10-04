from __future__ import annotations

from datetime import datetime, timezone
import uuid
from typing import List

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.response import success
from app.core.security import require_roles
from app.deps import DbSession
from app.models.scenario import Scenario
from app.schemas.scenario import ScenarioCreate, ScenarioOut, ScenarioUpdate
from app.realtime.manager import manager


router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("", response_model=dict)
async def list_scenarios(db: DbSession):
    result = await db.execute(select(Scenario).order_by(Scenario.modified.desc()))
    items = result.scalars().all()
    return success([ScenarioOut.model_validate(i).model_dump() for i in items])


@router.get("/{scenario_id}", response_model=dict)
async def get_scenario(scenario_id: str, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict, dependencies=[Depends(require_roles("ADMIN", "OPERATOR"))])
async def create_scenario(payload: ScenarioCreate, db: DbSession):
    now = datetime.now(timezone.utc)
    obj = Scenario(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        image=payload.image,
        content=getattr(payload, "content", None),
        created=now,
        modified=now,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    await manager.broadcast("scenarios", {"type": "scenario_created", "data": ScenarioOut.model_validate(obj).model_dump()})
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.put("/{scenario_id}", response_model=dict, dependencies=[Depends(require_roles("ADMIN", "OPERATOR"))])
async def update_scenario(scenario_id: str, payload: ScenarioUpdate, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.modified = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(obj)
    await manager.broadcast("scenarios", {"type": "scenario_updated", "data": ScenarioOut.model_validate(obj).model_dump()})
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.delete("/{scenario_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_roles("ADMIN"))])
async def delete_scenario(scenario_id: str, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    await db.delete(obj)
    await db.commit()
    await manager.broadcast("scenarios", {"type": "scenario_deleted", "data": {"id": scenario_id}})
    return success({"id": scenario_id}, message="Deleted")


