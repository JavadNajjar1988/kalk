from __future__ import annotations

import io
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from openpyxl import load_workbook

from app.core.config import settings
from app.core.response import success
from app.core.security import require_roles
from app.deps import DbSession
from app.models.scenario import Scenario
from app.realtime.manager import manager
from app.schemas.scenario import ScenarioOut
from app.services.excel_scenario_import import (
    build_template_workbook,
    parse_excel_workbook,
    parse_resources_workbook,
)

router = APIRouter(prefix="/data-import", tags=["data-import"])

MAX_EXCEL_BYTES = 25 * 1024 * 1024


async def _read_upload(file: UploadFile, max_size: int = MAX_EXCEL_BYTES) -> bytes:
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Only .xlsx / .xlsm files are allowed")
    data = await file.read()
    await file.close()
    if len(data) > max_size:
        raise HTTPException(status_code=400, detail="File too large")
    return data


@router.get(
    "/excel-template",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "VIEWER"))],
)
async def download_excel_template():
    wb = build_template_workbook()
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="scenario_import_template.xlsx"'},
    )


@router.get(
    "/ai-config",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "VIEWER"))],
)
async def ai_config():
    enabled = bool(getattr(settings, "INTERNAL_LLM_BASE_URL", None))
    return success({"enabled": enabled})


@router.post(
    "/scenario/preview",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def preview_scenario_excel(file: UploadFile = File(...)):
    raw = await _read_upload(file)
    try:
        wb = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e
    content, errors = parse_excel_workbook(wb)
    return success(
        {
            "errors": errors,
            "valid": len(errors) == 0,
            "preview": {
                "name": content.get("name"),
                "eventsCount": len(content.get("events") or []),
                "sidesCount": len(content.get("sides") or []),
                "equipmentCount": len(content.get("equipment") or []),
                "personnelCount": len(content.get("personnel") or []),
            },
            "content": content if content else None,
        }
    )


@router.post(
    "/scenario/import",
    status_code=status.HTTP_201_CREATED,
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def import_scenario_excel(db: DbSession, file: UploadFile = File(...)):
    raw = await _read_upload(file)
    try:
        wb = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e
    content, errors = parse_excel_workbook(wb)
    if errors:
        msg = "; ".join(
            f"{e.get('sheet', '?')} r{e.get('row', '?')}: {e.get('message', '')}" for e in errors[:30]
        )
        raise HTTPException(status_code=422, detail=msg[:4000] or "Validation failed")
    if not content or not content.get("name"):
        raise HTTPException(status_code=400, detail="Could not build scenario from file")

    now = datetime.now(timezone.utc)
    scenario_id = content.get("id") or str(uuid.uuid4())
    if len(scenario_id) > 36:
        scenario_id = str(uuid.uuid4())
    content["id"] = scenario_id

    name = (content.get("name") or "Imported")[:200]
    desc = content.get("description")
    if desc and len(str(desc)) > 2000:
        desc = str(desc)[:2000]
    image = content.get("image")
    if image and len(str(image)) > 500:
        image = str(image)[:500]

    obj = Scenario(
        id=scenario_id,
        name=name,
        description=desc,
        image=image,
        content=content,
        created=now,
        modified=now,
    )
    db.add(obj)
    try:
        await db.commit()
        await db.refresh(obj)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save scenario: {e}") from e

    await manager.broadcast(
        "scenarios",
        {"type": "scenario_created", "data": ScenarioOut.model_validate(obj).model_dump()},
    )
    return success(ScenarioOut.model_validate(obj).model_dump())


@router.post(
    "/resources/import",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def import_resources_excel(file: UploadFile = File(...)):
    raw = await _read_upload(file)
    try:
        wb = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e
    personnel, equipment, errors = parse_resources_workbook(wb)
    if errors and not personnel and not equipment:
        raise HTTPException(status_code=400, detail=errors[0].get("message", "Parse error"))
    return success({"personnel": personnel, "equipment": equipment, "errors": errors})


@router.post(
    "/ai/suggest-mapping",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def ai_suggest_mapping(file: UploadFile = File(...)):
    base = getattr(settings, "INTERNAL_LLM_BASE_URL", None) or ""
    if not base:
        raise HTTPException(status_code=503, detail="سرویس هوش مصنوعی داخلی پیکربندی نشده است")

    raw = await _read_upload(file)
    try:
        wb = load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e

    sheet_samples: list[dict[str, Any]] = []
    try:
        for name in wb.sheetnames[:12]:
            ws = wb[name]
            headers: list[str] = []
            sample_rows: list[list[str]] = []
            for i, row in enumerate(ws.iter_rows(min_row=1, max_row=6, values_only=True)):
                cells = [str(c) if c is not None else "" for c in row[:20]]
                if i == 0:
                    headers = cells
                else:
                    if any(x.strip() for x in cells):
                        sample_rows.append(cells)
            sheet_samples.append({"sheet": name, "headers": headers, "sampleRows": sample_rows[:5]})
    finally:
        wb.close()

    model = getattr(settings, "INTERNAL_LLM_MODEL", None) or "gpt-4o-mini"
    prompt = (
        "You map Excel sheets to our standard schema. Reply with JSON only, no markdown.\n"
        "Standard sheet names: سناریو|scenario, حوادث|events, یگان‌ها|units, تجهیزات|equipment, پرسنل|personnel.\n"
        "Output shape: {\"sheetMappings\":[{\"sourceSheet\":\"...\",\"targetSheet\":\"scenario|events|units|equipment|personnel\",\"confidence\":0-1}],"
        '"columnMaps":[{"targetSheet":"events","mappings":[{"fromHeader":"...","toField":"title|start_time|lon|lat|..."}]}]}\n'
        f"Input: {json.dumps(sheet_samples, ensure_ascii=False)[:12000]}"
    )

    url = base.rstrip("/") + "/v1/chat/completions"
    headers = {"Content-Type": "application/json"}
    key = getattr(settings, "INTERNAL_LLM_API_KEY", None)
    if key:
        headers["Authorization"] = f"Bearer {key}"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You only output valid JSON objects."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            body = resp.json()
        text = body["choices"][0]["message"]["content"]
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        parsed = json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e

    return success({"suggestion": parsed, "sheetSamples": sheet_samples})
