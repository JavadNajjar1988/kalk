from __future__ import annotations

import io
import json
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from openpyxl import load_workbook
from sqlalchemy import select

from app.core.config import settings
from app.core.response import success
from app.core.security import require_roles
from app.deps import DbSession
from app.models.scenario import Scenario
from app.models.resource import Resource
from app.services.excel_scenario_import import (
    BUNDLED_GRAPHIC_TEMPLATE,
    build_template_workbook,
    export_content_to_workbook,
    parse_excel_workbook,
    parse_resources_workbook,
    transform_workbook_with_mapping,
)
from app.services.scenario_import import (
    broadcast_scenario_import,
    merge_scenario_content,
    scenario_import_response_data,
    upsert_scenario_from_import,
)
from app.services.resource_import import (
    link_scenario_content_to_resources,
    scenario_units_to_bulk_items,
    upsert_resource_import_items,
    workbook_resources_to_bulk_items,
)
from app.services.scenario_import_impact import build_scenario_import_impact

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
    if BUNDLED_GRAPHIC_TEMPLATE.is_file():
        return FileResponse(
            BUNDLED_GRAPHIC_TEMPLATE,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="scenario_import_template_fa.xlsx",
        )
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
async def preview_scenario_excel(
    db: DbSession,
    file: UploadFile = File(...),
    target_scenario_id: str | None = Form(default=None),
    merge_mode: str = Form(default="merge"),
):
    raw = await _read_upload(file)
    try:
        wb = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e
    content, errors = parse_excel_workbook(wb)
    personnel, equipment, _, resource_errors = parse_resources_workbook(wb)
    unit_resources = scenario_units_to_bulk_items(content)
    if merge_mode not in {"merge", "replace"}:
        raise HTTPException(status_code=400, detail="merge_mode must be merge or replace")
    existing = None
    if target_scenario_id:
        existing = await db.get(Scenario, target_scenario_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Target scenario not found")
    impact = build_scenario_import_impact(
        existing.content if existing else None,
        content,
        merge_mode,
    )
    resource_items = [
        *workbook_resources_to_bulk_items(personnel, equipment),
        *unit_resources,
    ]
    keyed_resources = {
        (item.type, str(item.code)) for item in resource_items if item.code not in (None, "")
    }
    existing_resource_keys: set[tuple[str, str]] = set()
    if keyed_resources:
        result = await db.execute(
            select(Resource.type, Resource.code).where(
                Resource.type.in_({item[0] for item in keyed_resources}),
                Resource.code.in_({item[1] for item in keyed_resources}),
            )
        )
        existing_resource_keys = {
            (str(resource_type), str(code))
            for resource_type, code in result.all()
            if code not in (None, "")
        }
    unkeyed_count = sum(1 for item in resource_items if item.code in (None, ""))
    impact["resources"] = {
        "incoming": len(resource_items),
        "created": len(keyed_resources - existing_resource_keys) + unkeyed_count,
        "updated": len(keyed_resources & existing_resource_keys),
        "warnings": len(resource_errors),
    }
    return success(
        {
            "errors": errors,
            "resourceErrors": resource_errors,
            "valid": len(errors) == 0,
            "preview": {
                "name": content.get("name"),
                "eventsCount": len(content.get("events") or []),
                "sidesCount": len(content.get("sides") or []),
                "equipmentCount": len(content.get("equipment") or []),
                "personnelCount": len(content.get("personnel") or []),
                "featuresCount": sum(len(layer.get("features") or []) for layer in content.get("layers") or []),
                "storyboardScenesCount": len((content.get("storyboard") or {}).get("scenes") or []),
                "resourceEquipmentRowsCount": len(equipment),
                "resourcePersonnelRowsCount": len(personnel),
                "resourceUnitRowsCount": len(unit_resources),
                "equipmentQuantityTotal": sum(int(item.get("quantity") or 0) for item in equipment),
            },
            "content": content if content else None,
            "impact": impact,
        }
    )


@router.post(
    "/scenario/import",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def import_scenario_excel(
    db: DbSession,
    response: Response,
    file: UploadFile = File(...),
    target_scenario_id: str | None = Form(default=None),
    merge_mode: str = Form(default="merge"),
    import_resources: bool = Form(default=True),
):
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

    if merge_mode not in {"merge", "replace"}:
        raise HTTPException(status_code=400, detail="merge_mode must be merge or replace")

    personnel, equipment, _, resource_errors = parse_resources_workbook(wb)
    resource_items = [
        *workbook_resources_to_bulk_items(personnel, equipment),
        *scenario_units_to_bulk_items(content),
    ]
    unit_rows_count = len(scenario_units_to_bulk_items(content))

    existing = None
    if target_scenario_id:
        existing = await db.get(Scenario, target_scenario_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Target scenario not found")
        if merge_mode == "merge":
            content = merge_scenario_content(existing.content or {}, content)

    scenario_id = target_scenario_id or content.get("id") or str(uuid.uuid4())
    if len(scenario_id) > 36:
        scenario_id = str(uuid.uuid4())
    content["id"] = scenario_id

    name = (content.get("name") or (existing.name if existing else None) or "Imported")[:200]
    desc = content.get("description")
    if desc and len(str(desc)) > 2000:
        desc = str(desc)[:2000]
    image = content.get("image")
    if image and len(str(image)) > 500:
        image = str(image)[:500]

    try:
        resource_result: dict[str, Any] = {"created": 0, "updated": 0, "skipped": 0}
        if import_resources and resource_items:
            resource_result = await upsert_resource_import_items(
                db,
                resource_items,
                commit=False,
                include_resource_ids=True,
            )
            resource_ids = resource_result.pop("resourceIds", {})
            link_scenario_content_to_resources(
                content,
                personnel,
                equipment,
                resource_ids,
            )

        obj, created = await upsert_scenario_from_import(
            db,
            scenario_id=scenario_id,
            name=name,
            description=desc,
            image=image,
            content=content,
            commit=False,
        )
        await db.commit()
        await db.refresh(obj)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save scenario: {e}") from e

    await broadcast_scenario_import(obj, created)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return success(
        {
            **scenario_import_response_data(obj, created),
            "resourceImport": {
                "requested": import_resources,
                "persisted": bool(import_resources),
                "personnelRows": len(personnel),
                "equipmentRows": len(equipment),
                "unitRows": unit_rows_count,
                "equipmentQuantityTotal": sum(int(item.get("quantity") or 0) for item in equipment),
                "errors": resource_errors,
                **resource_result,
            },
        }
    )


@router.post(
    "/resources/import",
    response_model=dict,
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def import_resources_excel(db: DbSession, file: UploadFile = File(...)):
    raw = await _read_upload(file)
    try:
        wb = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e
    personnel, equipment, units, errors = parse_resources_workbook(wb)
    if errors and not personnel and not equipment and not units:
        raise HTTPException(status_code=400, detail=errors[0].get("message", "Parse error"))
    items = workbook_resources_to_bulk_items(personnel, equipment, units)
    keyed = {(item.type, str(item.code)) for item in items if item.code not in (None, "")}
    existing_keys: set[tuple[str, str]] = set()
    if keyed:
        result = await db.execute(
            select(Resource.type, Resource.code).where(
                Resource.type.in_({item[0] for item in keyed}),
                Resource.code.in_({item[1] for item in keyed}),
            )
        )
        existing_keys = {
            (str(resource_type), str(code))
            for resource_type, code in result.all()
            if code not in (None, "")
        }
    return success(
        {
            "personnel": personnel,
            "equipment": equipment,
            "units": [item.model_dump(mode="json") for item in items if item.type == "units"],
            "errors": errors,
            "impact": {
                "created": len(keyed - existing_keys)
                + sum(1 for item in items if item.code in (None, "")),
                "updated": len(keyed & existing_keys),
                "warnings": len(errors),
            },
        }
    )


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


# ---------------------------------------------------------------------------
# AI Auto-Import: upload any Excel → AI maps → transform → save scenario
# Query param: download_excel=true  → also return standardized .xlsx file
# ---------------------------------------------------------------------------

MIN_CONFIDENCE = 0.45


async def _call_llm_for_mapping(sheet_samples: list[dict[str, Any]], settings_obj: Any) -> dict[str, Any]:
    """Reusable helper: call LLM and return parsed mapping dict."""
    base = getattr(settings_obj, "INTERNAL_LLM_BASE_URL", None) or ""
    if not base:
        raise HTTPException(status_code=503, detail="سرویس هوش مصنوعی داخلی پیکربندی نشده است")

    model = getattr(settings_obj, "INTERNAL_LLM_MODEL", None) or "gpt-4o-mini"
    prompt = (
        "You map Excel sheets to our standard schema. Reply with JSON only, no markdown.\n"
        "Standard sheet names: سناریو|scenario, حوادث|events, یگان‌ها|units, تجهیزات|equipment, پرسنل|personnel.\n"
        "Output shape: {\"sheetMappings\":[{\"sourceSheet\":\"...\",\"targetSheet\":\"scenario|events|units|equipment|personnel\",\"confidence\":0-1}],"
        "\"columnMaps\":[{\"targetSheet\":\"events\",\"mappings\":[{\"fromHeader\":\"...\",\"toField\":\"title|start_time|lon|lat|...\"}]}]}\n"
        f"Input: {json.dumps(sheet_samples, ensure_ascii=False)[:12000]}"
    )

    url = base.rstrip("/") + "/v1/chat/completions"
    req_headers = {"Content-Type": "application/json"}
    key = getattr(settings_obj, "INTERNAL_LLM_API_KEY", None)
    if key:
        req_headers["Authorization"] = f"Bearer {key}"

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
            resp = await client.post(url, headers=req_headers, json=payload)
            resp.raise_for_status()
            body = resp.json()
        text = body["choices"][0]["message"]["content"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e


def _build_sheet_samples(wb) -> list[dict[str, Any]]:
    sheet_samples: list[dict[str, Any]] = []
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
    return sheet_samples


@router.post(
    "/scenario/ai-auto-import",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def ai_auto_import_scenario(
    db: DbSession,
    response: Response,
    file: UploadFile = File(...),
    download_excel: bool = False,
    min_confidence: float = MIN_CONFIDENCE,
):
    """
    Upload any (non-standard) Excel → AI detects sheet/column mapping →
    transforms to standard format → saves scenario in DB.

    If download_excel=true, returns the standardized .xlsx file instead of JSON.
    """
    raw = await _read_upload(file)

    try:
        wb_source = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e

    # Step 1 – Build sheet samples for AI
    sheet_samples = _build_sheet_samples(wb_source)
    wb_source.close()

    # Step 2 – Ask LLM for mapping
    mapping = await _call_llm_for_mapping(sheet_samples, settings)

    # Step 3 – Validate confidence
    sheet_mappings: list[dict[str, Any]] = mapping.get("sheetMappings") or []
    low_confidence = [
        sm for sm in sheet_mappings
        if float(sm.get("confidence") or 0) < min_confidence
    ]
    if len(low_confidence) == len(sheet_mappings) and sheet_mappings:
        raise HTTPException(
            status_code=422,
            detail=(
                "هوش مصنوعی نتوانست شیت‌ها را با اطمینان کافی شناسایی کند. "
                "لطفاً از قالب استاندارد استفاده کنید یا مپینگ را دستی انجام دهید."
            ),
        )

    # Step 4 – Re-open workbook and transform
    try:
        wb_source2 = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
        wb_standard = transform_workbook_with_mapping(wb_source2, mapping)
        wb_source2.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطا در تبدیل فرمت اکسل: {e}") from e

    # Step 5 – Parse standard workbook
    content, errors = parse_excel_workbook(wb_standard)
    if errors and not content.get("name"):
        msg = "; ".join(
            f"{e.get('sheet', '?')} r{e.get('row', '?')}: {e.get('message', '')}" for e in errors[:20]
        )
        raise HTTPException(status_code=422, detail=msg[:4000] or "Validation failed")

    # Step 6 – If only download requested, return standardized Excel
    if download_excel:
        wb_out = export_content_to_workbook(content)
        buf = io.BytesIO()
        wb_out.save(buf)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="standardized_scenario.xlsx"'},
        )

    # Step 7 – Save to DB (same logic as import_scenario_excel)
    scenario_id = content.get("id") or str(uuid.uuid4())
    if len(scenario_id) > 36:
        scenario_id = str(uuid.uuid4())
    content["id"] = scenario_id
    content.setdefault("metadata", {})["source"] = "ai-auto-import"
    content["metadata"]["aiMapping"] = {
        "sheetMappings": sheet_mappings,
        "lowConfidenceSheets": [sm["sourceSheet"] for sm in low_confidence],
    }

    name = (content.get("name") or "Imported")[:200]
    desc = content.get("description")
    if desc and len(str(desc)) > 2000:
        desc = str(desc)[:2000]

    try:
        obj, created = await upsert_scenario_from_import(
            db,
            scenario_id=scenario_id,
            name=name,
            description=desc,
            image=None,
            content=content,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save scenario: {e}") from e

    await broadcast_scenario_import(obj, created)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

    return success({
        **scenario_import_response_data(obj, created),
        "aiImportMeta": {
            "sheetMappings": sheet_mappings,
            "warnings": [
                f"شیت '{sm['sourceSheet']}' با اطمینان پایین مپ شد (confidence={sm.get('confidence', 0):.2f})"
                for sm in low_confidence
            ],
            "parseErrors": errors,
        },
    })
