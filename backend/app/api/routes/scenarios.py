from __future__ import annotations

from datetime import datetime, timezone
import json
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from app.core.config import settings
from app.core.response import success
from app.core.security import require_roles
from app.deps import DbSession
from app.models.scenario import Scenario
from app.schemas.scenario import ScenarioCreate, ScenarioOut, ScenarioUpdate
from app.realtime.manager import manager


router = APIRouter(prefix="/scenarios", tags=["scenarios"])

SCENARIO_IMAGE_DIR = Path(settings.SCENARIO_IMAGE_DIR)
if not SCENARIO_IMAGE_DIR.is_absolute():
    SCENARIO_IMAGE_DIR = Path.cwd() / SCENARIO_IMAGE_DIR
SCENARIO_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_SCENARIO_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.get("", response_model=dict)
async def list_scenarios(db: DbSession):
    result = await db.execute(select(Scenario).order_by(Scenario.modified.desc()))
    items = result.scalars().all()
    return success([ScenarioOut.model_validate(i).model_dump() for i in items])


@router.post(
    "/images",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def upload_scenario_image(request: Request, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Image file is required"
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type"
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = SCENARIO_IMAGE_DIR / unique_filename

    file_size: int | None = None
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception:
        file_size = None

    if file_size is not None and file_size > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file too large (max 5 MB)",
        )

    try:
        file.file.seek(0)
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {exc}",
        ) from exc
    finally:
        await file.close()

    image_url = request.url_for("get_scenario_image", filename=unique_filename)
    return success({"filename": unique_filename, "url": str(image_url)})


@router.get("/images/{filename}", response_class=FileResponse)
async def get_scenario_image(filename: str):
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Image name is required"
        )

    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image name"
        )

    image_path = SCENARIO_IMAGE_DIR / safe_name
    if not image_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    return FileResponse(image_path)


@router.post(
    "/import",
    status_code=status.HTTP_201_CREATED,
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def import_scenario(db: DbSession, file: UploadFile = File(...)):
    """
    Import a scenario from a JSON file (ORBAT-mapper format).
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File is required"
        )

    # Check file extension
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSON files are allowed",
        )

    # Check file size
    file_size: int | None = None
    try:
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
    except Exception:
        file_size = None

    if file_size is not None and file_size > MAX_SCENARIO_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {MAX_SCENARIO_FILE_SIZE_BYTES / 1024 / 1024} MB)",
        )

    # Read and parse JSON
    try:
        content = await file.read()
        scenario_data = json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON file: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}",
        )
    finally:
        await file.close()

    # Validate scenario structure
    if not isinstance(scenario_data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scenario file must contain a JSON object",
        )

    # Check if it's an ORBAT-mapper scenario
    scenario_type = scenario_data.get("type")
    if scenario_type and scenario_type != "ORBAT-mapper":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This file is not compatible with ORBAT-mapper structure",
        )

    # Extract scenario information
    meta = scenario_data.get("meta", {}) if isinstance(scenario_data.get("meta"), dict) else {}
    metadata = scenario_data.get("metadata", {}) if isinstance(scenario_data.get("metadata"), dict) else {}
    
    scenario_name = scenario_data.get("name") or meta.get("name")
    if not scenario_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scenario name is required",
        )

    scenario_description = scenario_data.get("description") or meta.get("description")
    scenario_image = scenario_data.get("image") or metadata.get("image")

    # Validate name length
    if len(scenario_name) > 200:
        scenario_name = scenario_name[:200]

    # Validate description length
    if scenario_description and len(scenario_description) > 2000:
        scenario_description = scenario_description[:2000]

    # Validate image URL length
    if scenario_image and len(scenario_image) > 500:
        scenario_image = scenario_image[:500]

    # Create scenario object
    now = datetime.now(timezone.utc)
    scenario_id = scenario_data.get("id")
    if not scenario_id or len(scenario_id) > 36:
        scenario_id = str(uuid.uuid4())

    obj = Scenario(
        id=scenario_id,
        name=scenario_name,
        description=scenario_description,
        image=scenario_image,
        content=scenario_data,  # Store the entire scenario data in content field
        created=now,
        modified=now,
    )

    db.add(obj)
    try:
        await db.commit()
        await db.refresh(obj)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save scenario: {str(e)}",
        )

    await manager.broadcast(
        "scenarios",
        {"type": "scenario_created", "data": ScenarioOut.model_validate(obj).model_dump()},
    )

    return success(ScenarioOut.model_validate(obj).model_dump())


@router.get("/{scenario_id}", response_model=dict)
async def get_scenario(scenario_id: str, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
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


@router.put("/{scenario_id}", response_model=dict, dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
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


@router.delete("/{scenario_id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_roles("SUPER_ADMIN"))])
async def delete_scenario(scenario_id: str, db: DbSession):
    obj = await db.get(Scenario, scenario_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    await db.delete(obj)
    await db.commit()
    await manager.broadcast("scenarios", {"type": "scenario_deleted", "data": {"id": scenario_id}})
    return success({"id": scenario_id}, message="Deleted")


