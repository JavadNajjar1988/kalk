from __future__ import annotations

import io
import json
import math
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from openpyxl import load_workbook
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.config import settings
from app.core.response import success
from app.core.security import require_roles
from app.deps import DbSession
from app.models.scenario import Scenario
from app.models.scenario_audit_log import ScenarioAuditLog
from app.models.resource import Resource
from app.services.excel_scenario_import import (
    BUNDLED_COMPLETE_EXAMPLE,
    BUNDLED_GRAPHIC_TEMPLATE,
    build_template_workbook,
    export_content_to_workbook,
    inspect_source_table_layout,
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
from starlette.concurrency import run_in_threadpool
from app.services.document_extraction import (
    build_document_review_workbook,
    document_model_status,
    document_page_count,
    extract_page,
    read_page,
    stream_document,
)
from app.services.document_jobs import (
    create_job,
    detect_map_pages,
    get_job,
    get_job_page,
    get_map_page_path,
    list_jobs,
    public_job,
    request_cancel,
    resume_job,
    set_map_page_decision,
)

router = APIRouter(prefix="/data-import", tags=["data-import"])

MAX_EXCEL_BYTES = 25 * 1024 * 1024


def _scenario_unit_movement_counts(content: dict[str, Any]) -> tuple[int, int]:
    moving_units = 0
    movement_states = 0

    def visit(units: list[dict[str, Any]]) -> None:
        nonlocal moving_units, movement_states
        for unit in units or []:
            states = unit.get("state") or []
            imported_movements = [
                state
                for state in states
                if str(state.get("id") or "").startswith("excel-state-")
                and not str(state.get("id") or "").endswith("-initial")
            ]
            if imported_movements:
                moving_units += 1
                movement_states += len(imported_movements)
            visit(unit.get("subUnits") or [])

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            visit(group.get("subUnits") or [])
    return moving_units, movement_states


class DocumentWorkbookProposal(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    kind: Literal['scenario', 'person', 'unit', 'equipment', 'place', 'event']
    name: str = Field(min_length=1, max_length=300)
    evidence: str = Field(min_length=3, max_length=2000)
    sourcePage: int = Field(ge=1, le=2000)
    sourceMethod: str = Field(min_length=1, max_length=50)
    documentId: str = Field(min_length=1, max_length=128)
    reviewStatus: Literal['pending', 'accepted', 'rejected']
    startTime: str | None = Field(default=None, max_length=80)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    side: str | None = Field(default=None, max_length=50)
    unitType: str | None = Field(default=None, max_length=100)
    echelon: str | None = Field(default=None, max_length=100)
    parentUnitId: str | None = Field(default=None, max_length=100)
    equipmentType: str | None = Field(default=None, max_length=150)
    quantity: int | None = Field(default=None, ge=0, le=1_000_000)
    unitId: str | None = Field(default=None, max_length=100)
    rank: str | None = Field(default=None, max_length=100)
    specialty: str | None = Field(default=None, max_length=150)
    placeType: str | None = Field(default=None, max_length=100)
    radiusMeters: float | None = Field(default=None, ge=0, le=10_000_000)
    resourceCode: str | None = Field(default=None, max_length=150)
    matchedResourceId: str | None = Field(default=None, max_length=150)
    matchedResourceName: str | None = Field(default=None, max_length=300)
    canonicalName: str | None = Field(default=None, max_length=300)
    entityDraftId: str | None = Field(default=None, min_length=8, max_length=100)


class DocumentPageCoverage(BaseModel):
    page: int = Field(ge=1, le=2000)
    pageKinds: list[Literal['text', 'image', 'table', 'military-map']] = Field(default_factory=list, max_length=4)
    status: Literal['pending_review', 'reviewed', 'no_relevant_data', 'error']
    itemCount: int = Field(default=0, ge=0, le=6000)
    acceptedCount: int = Field(default=0, ge=0, le=6000)
    rejectedCount: int = Field(default=0, ge=0, le=6000)
    pendingCount: int = Field(default=0, ge=0, le=6000)
    mapStatus: Literal['needs_placement', 'attached', 'ignored'] | None = None
    warnings: list[str] = Field(default_factory=list, max_length=20)


class DocumentWorkbookRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    documentId: str = Field(min_length=1, max_length=128)
    pageCount: int = Field(ge=1, le=2000)
    mainScenarioId: str = Field(min_length=1, max_length=100)
    items: list[DocumentWorkbookProposal] = Field(max_length=6000)
    coverage: list[DocumentPageCoverage] = Field(default_factory=list, max_length=2000)
    finalized: bool = False


class DocumentMapLayerRequest(BaseModel):
    scenarioId: str = Field(min_length=1, max_length=128)
    layerName: str = Field(min_length=1, max_length=200)
    rotationDegrees: Literal[0, 90, 180, 270] = 0


class DocumentMapDecisionRequest(BaseModel):
    decision: Literal['ignored', 'needs_placement']


@router.get('/document/status', dependencies=[Depends(require_roles('SUPER_ADMIN', 'COMMANDER'))])
async def document_status():
    return success(await document_model_status(settings))


def _document_owner(user: dict[str, Any]) -> str:
    return str(user.get("user_id") or user.get("username") or "local")


@router.post('/document/jobs')
async def create_document_job(
    file: UploadFile = File(...),
    force_ocr: bool = Form(False),
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    filename = file.filename or ''
    try:
        raw = await file.read(MAX_EXCEL_BYTES + 1)
    finally:
        await file.close()
    if not raw or len(raw) > MAX_EXCEL_BYTES:
        raise HTTPException(400, 'فایل خالی یا بزرگ‌تر از ۲۵ مگابایت است.')
    if not (settings.DOCUMENT_LLM_BASE_URL or settings.INTERNAL_LLM_BASE_URL):
        raise HTTPException(503, 'سرویس هوش مصنوعی داخلی پیکربندی نشده است.')
    try:
        job = await run_in_threadpool(
            create_job, raw, filename, _document_owner(user), force_ocr
        )
        return success(public_job(job))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.get('/document/jobs')
async def document_jobs(
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    return success(await run_in_threadpool(list_jobs, _document_owner(user)))


@router.get('/document/jobs/{job_id}')
async def document_job(
    job_id: str,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        return success(public_job(await run_in_threadpool(get_job, job_id, _document_owner(user))))
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.get('/document/jobs/{job_id}/pages/{page}')
async def document_job_page(
    job_id: str,
    page: int,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        return success(
            await run_in_threadpool(get_job_page, job_id, page, _document_owner(user))
        )
    except FileNotFoundError as exc:
        raise HTTPException(404, 'نتیجه این صفحه هنوز آماده نیست.') from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post('/document/jobs/{job_id}/cancel')
async def cancel_document_job(
    job_id: str,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        job = await run_in_threadpool(request_cancel, job_id, _document_owner(user))
        return success(public_job(job))
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post('/document/jobs/{job_id}/resume')
async def resume_document_job(
    job_id: str,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        job = await run_in_threadpool(resume_job, job_id, _document_owner(user))
        return success(public_job(job))
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post('/document/jobs/{job_id}/map-pages/detect')
async def detect_document_map_pages(
    job_id: str,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        job = await run_in_threadpool(
            detect_map_pages, job_id, _document_owner(user)
        )
        return success(public_job(job))
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.get('/document/jobs/{job_id}/map-pages/{page}/image')
async def document_map_page_image(
    job_id: str,
    page: int,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        path = await run_in_threadpool(
            get_map_page_path, job_id, page, _document_owner(user)
        )
        return FileResponse(path, media_type='image/webp', filename=path.name)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post('/document/jobs/{job_id}/map-pages/{page}/attach')
async def attach_document_map_page(
    job_id: str,
    page: int,
    payload: DocumentMapLayerRequest,
    db: DbSession,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    """Persist a reviewed page image and stage it for manual placement in KalkNegar."""
    try:
        job = await run_in_threadpool(get_job, job_id, _document_owner(user))
        map_page = (job.get('mapPages') or {}).get(str(page))
        if not isinstance(map_page, dict):
            raise FileNotFoundError('کالک این صفحه ثبت نشده است.')
        if map_page.get('status') != 'needs_placement':
            raise ValueError('برای افزودن دوباره کالک، ابتدا تصمیم قبلی را بازگشایی کنید.')
        source = await run_in_threadpool(
            get_map_page_path, job_id, page, _document_owner(user)
        )
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

    scenario = await db.get(Scenario, payload.scenarioId)
    if scenario is None or scenario.archived_at is not None:
        raise HTTPException(404, 'سناریوی مقصد پیدا نشد.')

    images_dir = Path(settings.SCENARIO_IMAGE_DIR)
    if not images_dir.is_absolute():
        images_dir = Path.cwd() / images_dir
    images_dir.mkdir(parents=True, exist_ok=True)
    digest = str(job['documentId'])[:16]
    filename = f"document-map-{digest}-{page}.webp"
    target = images_dir / filename
    temporary = images_dir / f".{filename}.{uuid.uuid4().hex}.tmp"
    await run_in_threadpool(shutil.copyfile, source, temporary)
    temporary.replace(target)

    content = dict(scenario.content or {})
    layers = list(content.get('mapLayers') or [])
    layer_id = f"document-map-{digest}-{page}"
    layer = {
        'id': layer_id,
        'type': 'ImageLayer',
        'name': payload.layerName.strip(),
        'url': f"/api/scenarios/images/{filename}",
        'opacity': 0.7,
        'imageRotate': math.radians(payload.rotationDegrees),
        'requiresPlacement': True,
        'sourceDocumentId': job['documentId'],
        'sourcePage': page,
        '_status': 'uninitialized',
        '_isNew': True,
    }
    existing_index = next(
        (index for index, item in enumerate(layers) if isinstance(item, dict) and item.get('id') == layer_id),
        None,
    )
    if existing_index is None:
        layers.append(layer)
    else:
        layers[existing_index] = {**layers[existing_index], **layer}
    content['mapLayers'] = layers
    scenario.content = content
    scenario.modified = datetime.now(timezone.utc)
    db.add(
        ScenarioAuditLog(
            scenario_id=scenario.id,
            actor_user_id=user.get('user_id') or None,
            action='document_map_layer_attached',
            payload_diff={
                'layerId': layer_id,
                'documentId': job['documentId'],
                'sourcePage': page,
                'requiresPlacement': True,
            },
        )
    )
    await db.commit()
    await run_in_threadpool(
        set_map_page_decision,
        job_id,
        page,
        _document_owner(user),
        "attached",
        scenario_id=str(scenario.id),
        layer_id=layer_id,
    )
    return success(
        {
            'scenarioId': scenario.id,
            'layerId': layer_id,
            'imageUrl': layer['url'],
            'requiresPlacement': True,
            'kalknegarUrl': f"/kalknegar/scenario/{scenario.id}?integration=react",
        }
    )


@router.post('/document/jobs/{job_id}/map-pages/{page}/decision')
async def decide_document_map_page(
    job_id: str,
    page: int,
    payload: DocumentMapDecisionRequest,
    user: dict[str, Any] = Depends(require_roles('SUPER_ADMIN', 'COMMANDER')),
):
    try:
        job = await run_in_threadpool(
            set_map_page_decision,
            job_id,
            page,
            _document_owner(user),
            payload.decision,
        )
        return success(public_job(job))
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(403, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


def _validate_final_document_coverage(payload: DocumentWorkbookRequest) -> None:
    if not payload.finalized:
        return
    if len(payload.coverage) != payload.pageCount:
        raise ValueError("گزارش پوشش باید برای تمام صفحه‌های سند تکمیل شود.")
    pages = [entry.page for entry in payload.coverage]
    if len(set(pages)) != payload.pageCount or set(pages) != set(range(1, payload.pageCount + 1)):
        raise ValueError("شماره صفحه‌های گزارش پوشش کامل یا یکتا نیست.")
    unresolved = [
        entry.page
        for entry in payload.coverage
        if entry.status not in {"reviewed", "no_relevant_data"}
        or entry.pendingCount
        or entry.mapStatus == "needs_placement"
    ]
    if unresolved:
        raise ValueError(
            "پیش از ساخت اکسل نهایی، صفحه‌های تعیین‌تکلیف‌نشده را بررسی کنید: "
            + "، ".join(map(str, unresolved[:30]))
        )
    if any(item.reviewStatus == "pending" for item in payload.items):
        raise ValueError("همه پیشنهادها باید تأیید یا کنار گذاشته شوند.")
    item_counts: dict[int, dict[str, int]] = {}
    for item in payload.items:
        counts = item_counts.setdefault(item.sourcePage, {"all": 0, "accepted": 0, "rejected": 0, "pending": 0})
        counts["all"] += 1
        counts[item.reviewStatus] += 1
    for entry in payload.coverage:
        counts = item_counts.get(entry.page, {"all": 0, "accepted": 0, "rejected": 0, "pending": 0})
        if (
            entry.itemCount != counts["all"]
            or entry.acceptedCount != counts["accepted"]
            or entry.rejectedCount != counts["rejected"]
            or entry.pendingCount != counts["pending"]
        ):
            raise ValueError(f"شمارش پیشنهادهای صفحه {entry.page} با گزارش پوشش سازگار نیست.")


@router.post('/document/workbook', dependencies=[Depends(require_roles('SUPER_ADMIN', 'COMMANDER'))])
async def document_workbook(payload: DocumentWorkbookRequest):
    try:
        _validate_final_document_coverage(payload)
        workbook = await run_in_threadpool(
            build_document_review_workbook,
            filename=payload.filename,
            document_id=payload.documentId,
            page_count=payload.pageCount,
            main_scenario_id=payload.mainScenarioId,
            items=[item.model_dump() for item in payload.items],
            coverage=[entry.model_dump() for entry in payload.coverage],
            finalized=payload.finalized,
        )
        if payload.finalized:
            _, validation_errors = await run_in_threadpool(parse_excel_workbook, workbook)
            if validation_errors:
                messages = list(dict.fromkeys(
                    str(error.get("message") or "خطای ساختاری") for error in validation_errors
                ))
                raise ValueError(
                    "اکسل هنوز از کنترل ورود استاندارد عبور نمی‌کند: "
                    + " | ".join(messages[:10])
                )
        output = io.BytesIO()
        await run_in_threadpool(workbook.save, output)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': 'attachment; filename="document_import_final.xlsx"'
            if payload.finalized
            else 'attachment; filename="document_review_draft.xlsx"'
        },
    )


@router.post('/document/preview-all', dependencies=[Depends(require_roles('SUPER_ADMIN', 'COMMANDER'))])
async def preview_whole_document(file: UploadFile = File(...), force_ocr: bool = Form(False), skip_pages: str = Form('[]')):
    try:
        raw = await file.read(MAX_EXCEL_BYTES + 1)
    finally:
        await file.close()
    if not raw or len(raw) > MAX_EXCEL_BYTES:
        raise HTTPException(400, 'فایل خالی یا بزرگ‌تر از ۲۵ مگابایت است.')
    if not (settings.DOCUMENT_LLM_BASE_URL or settings.INTERNAL_LLM_BASE_URL):
        raise HTTPException(503, 'سرویس هوش مصنوعی داخلی پیکربندی نشده است.')
    try:
        total = await run_in_threadpool(document_page_count, raw, file.filename or '')
        skip = json.loads(skip_pages)
        if not isinstance(skip, list) or len(skip) > total or any(type(n) is not int or n < 1 or n > total for n in skip):
            raise ValueError('فهرست صفحه‌های پردازش‌شده معتبر نیست.')
    except Exception as exc:
        raise HTTPException(422, str(exc) if isinstance(exc, ValueError) else 'ساختار سند قابل خواندن نیست.') from exc

    async def events():
        async for event in stream_document(raw, file.filename or '', total, set(skip), force_ocr, settings):
            yield json.dumps(event, ensure_ascii=False) + '\n'
    return StreamingResponse(events(), media_type='application/x-ndjson',
                             headers={'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no'})


@router.post("/document/preview", dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))])
async def preview_document(file: UploadFile = File(...), page: int = Form(1), force_ocr: bool = Form(False)):
    """Extract one page into evidence-backed proposals, without database writes."""
    try:
        raw = await file.read(MAX_EXCEL_BYTES + 1)
    finally:
        await file.close()
    if not raw or len(raw) > MAX_EXCEL_BYTES:
        raise HTTPException(400, "فایل خالی یا بزرگ‌تر از ۲۵ مگابایت است.")
    if not (settings.DOCUMENT_LLM_BASE_URL or settings.INTERNAL_LLM_BASE_URL):
        raise HTTPException(503, "سرویس هوش مصنوعی داخلی پیکربندی نشده است.")
    try:
        page_data = await run_in_threadpool(read_page, raw, file.filename or "", page, force_ocr)
        return success(await extract_page(page_data, raw, file.filename or "", settings))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(502, "ارتباط با مدل محلی ناموفق بود؛ بارگذاری مدل و پشتیبانی تصویر را بررسی کنید.") from exc
    except Exception as exc:
        raise HTTPException(422, "پردازش سند ناموفق بود؛ ساختار فایل یا پاسخ مدل قابل خواندن نیست.") from exc


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
async def download_excel_template(variant: Literal["blank", "example"] = "blank"):
    source = (
        BUNDLED_COMPLETE_EXAMPLE if variant == "example" else BUNDLED_GRAPHIC_TEMPLATE
    )
    filename = (
        "scenario_import_example_complete_fa.xlsx"
        if variant == "example"
        else "scenario_import_template_blank_fa.xlsx"
    )
    if source.is_file():
        return FileResponse(
            source,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename,
        )
    wb = build_template_workbook(include_example=variant == "example")
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/ai-config",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER", "VIEWER"))],
)
async def ai_config():
    base = (getattr(settings, "INTERNAL_LLM_BASE_URL", None) or "").rstrip("/")
    model = getattr(settings, "INTERNAL_LLM_MODEL", None) or "gpt-4o-mini"
    if not base:
        return success(
            {
                "enabled": False,
                "configured": False,
                "reachable": False,
                "modelAvailable": False,
                "model": model,
                "message": "سرویس استانداردسازی اکسل پیکربندی نشده است.",
            }
        )

    reachable = False
    model_available = False
    message = "ارتباط با مدل محلی برقرار نشد."
    try:
        headers: dict[str, str] = {}
        key = getattr(settings, "INTERNAL_LLM_API_KEY", None)
        if key:
            headers["Authorization"] = f"Bearer {key}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{base}/v1/models", headers=headers)
            response.raise_for_status()
            body = response.json()
        reachable = True
        available_models = {
            str(item.get("id"))
            for item in body.get("data", [])
            if isinstance(item, dict) and item.get("id")
        }
        model_available = model in available_models
        message = (
            "مدل استانداردسازی در دسترس است؛ آمادگی نهایی هنگام تحلیل فایل بررسی می‌شود."
            if model_available
            else "سرویس در دسترس است، اما مدل انتخاب‌شده بارگذاری نشده است."
        )
    except (httpx.HTTPError, ValueError, TypeError):
        pass

    return success(
        {
            "enabled": reachable and model_available,
            "configured": True,
            "reachable": reachable,
            "modelAvailable": model_available,
            "model": model,
            "message": message,
        }
    )


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
    moving_units_count, unit_movement_states_count = _scenario_unit_movement_counts(
        content
    )
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
                "movingUnitsCount": moving_units_count,
                "unitMovementStatesCount": unit_movement_states_count,
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
        wb = load_workbook(io.BytesIO(raw), read_only=False, data_only=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel file: {e}") from e

    try:
        sheet_samples = _build_sheet_samples(wb)
    finally:
        wb.close()

    model = getattr(settings, "INTERNAL_LLM_MODEL", None) or "gpt-4o-mini"
    standard_schema = {
        key: sorted(fields) for key, fields in AI_STANDARD_FIELDS.items()
    }
    prompt = (
        "You map Excel sheets to our standard schema. Reply with JSON only, no markdown.\n"
        f"Allowed target sheets and fields: {json.dumps(standard_schema, ensure_ascii=False)}\n"
        "Output shape: {\"sheetMappings\":[{\"sourceSheet\":\"...\",\"targetSheet\":\"scenario|events|units|unit_states|equipment|personnel|features\",\"confidence\":0-1}],"
        '"columnMaps":[{"targetSheet":"events","mappings":[{"fromHeader":"...","toField":"one allowed field"}]}]}\n'
        "Use source headers exactly as provided. Do not invent sheets, headers, or target fields.\n"
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
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            body = resp.json()
        text = body["choices"][0]["message"]["content"]
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        parsed = json.loads(text)
    except httpx.TimeoutException as e:
        raise HTTPException(
            status_code=504,
            detail="مدل محلی در زمان مقرر پاسخ نداد؛ ممکن است درگیر پردازش دیگری باشد.",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e

    return success(
        {
            "suggestion": _validate_ai_mapping(parsed, sheet_samples),
            "sheetSamples": sheet_samples,
        }
    )


# ---------------------------------------------------------------------------
# AI Auto-Import: upload any Excel → AI maps → transform → save scenario
# Query param: download_excel=true  → also return standardized .xlsx file
# ---------------------------------------------------------------------------

MIN_CONFIDENCE = 0.45

AI_STANDARD_FIELDS: dict[str, set[str]] = {
    "scenario": {"name", "description", "start_time", "time_zone", "symbology_standard"},
    "events": {"id", "title", "subtitle", "start_time", "end_time", "side", "unit_ids", "equipment_ids", "lon", "lat"},
    "units": {"id", "name", "parent_id", "side", "symbol_type", "echelon", "symbol_status", "advanced_sidc", "time", "lon", "lat", "resource_code"},
    "unit_states": {"id", "unit_id", "time", "lon", "lat", "transfer_mode", "path_mode", "movement_start_time"},
    "equipment": {"id", "name", "type", "quantity", "unit_id", "start_time", "lon", "lat", "side", "advanced_sidc"},
    "personnel": {"id", "first_name", "last_name", "rank", "specialty", "national_id", "unit_id"},
    "features": {"id", "name", "type", "lon", "lat", "radius_m", "start_time", "end_time", "event_id"},
}


def _validate_ai_mapping(mapping: Any, sheet_samples: list[dict[str, Any]]) -> dict[str, Any]:
    if not isinstance(mapping, dict):
        raise HTTPException(status_code=422, detail="ساختار نگاشت معتبر نیست.")
    raw_sheet_mappings = mapping.get("sheetMappings")
    raw_column_maps = mapping.get("columnMaps")
    if not isinstance(raw_sheet_mappings, list) or not raw_sheet_mappings:
        raise HTTPException(status_code=422, detail="حداقل یک برگه باید نگاشت شود.")
    if len(raw_sheet_mappings) > 20 or not isinstance(raw_column_maps, list) or len(raw_column_maps) > 20:
        raise HTTPException(status_code=422, detail="تعداد نگاشت‌های فایل از حد مجاز بیشتر است.")

    source_headers_by_sheet = {
        str(sample.get("sheet") or ""): {
            str(header)
            for header in sample.get("headers", [])
            if str(header).strip()
        }
        for sample in sheet_samples
    }
    source_sheets = set(source_headers_by_sheet)
    clean_sheet_mappings: list[dict[str, Any]] = []
    mapped_targets: set[str] = set()
    mapped_sources: set[str] = set()
    source_for_target: dict[str, str] = {}
    for item in raw_sheet_mappings:
        if not isinstance(item, dict):
            raise HTTPException(status_code=422, detail="یکی از نگاشت‌های برگه معتبر نیست.")
        source = str(item.get("sourceSheet") or "").strip()
        target = str(item.get("targetSheet") or "").strip().lower()
        if source not in source_sheets or target not in AI_STANDARD_FIELDS:
            raise HTTPException(status_code=422, detail="برگه مبدأ یا مقصد نگاشت معتبر نیست.")
        if source in mapped_sources or target in mapped_targets:
            raise HTTPException(
                status_code=422,
                detail="هر برگه مبدأ و مقصد فقط یک‌بار قابل استفاده است.",
            )
        try:
            confidence = float(item.get("confidence", 0))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail="میزان اطمینان نگاشت معتبر نیست.") from exc
        clean_sheet_mappings.append(
            {"sourceSheet": source, "targetSheet": target, "confidence": max(0.0, min(1.0, confidence))}
        )
        mapped_targets.add(target)
        mapped_sources.add(source)
        source_for_target[target] = source

    clean_column_maps: list[dict[str, Any]] = []
    for column_map in raw_column_maps:
        if not isinstance(column_map, dict):
            raise HTTPException(status_code=422, detail="یکی از نگاشت‌های ستون معتبر نیست.")
        target = str(column_map.get("targetSheet") or "").strip().lower()
        mappings = column_map.get("mappings")
        if target not in mapped_targets or not isinstance(mappings, list) or len(mappings) > 100:
            raise HTTPException(status_code=422, detail="نگاشت ستون با برگه مقصد سازگار نیست.")
        clean_mappings: list[dict[str, str]] = []
        for item in mappings:
            if not isinstance(item, dict):
                raise HTTPException(status_code=422, detail="یکی از ستون‌های نگاشت‌شده معتبر نیست.")
            source_header = str(item.get("fromHeader") or "").strip()
            target_field = str(item.get("toField") or "").strip().lower()
            source_sheet = source_for_target[target]
            if (
                source_header not in source_headers_by_sheet[source_sheet]
                or target_field not in AI_STANDARD_FIELDS[target]
            ):
                raise HTTPException(status_code=422, detail="ستون مبدأ یا فیلد مقصد معتبر نیست.")
            clean_mappings.append({"fromHeader": source_header, "toField": target_field})
        clean_column_maps.append({"targetSheet": target, "mappings": clean_mappings})

    return {"sheetMappings": clean_sheet_mappings, "columnMaps": clean_column_maps}


async def _call_llm_for_mapping(sheet_samples: list[dict[str, Any]], settings_obj: Any) -> dict[str, Any]:
    """Reusable helper: call LLM and return parsed mapping dict."""
    base = getattr(settings_obj, "INTERNAL_LLM_BASE_URL", None) or ""
    if not base:
        raise HTTPException(status_code=503, detail="سرویس هوش مصنوعی داخلی پیکربندی نشده است")

    model = getattr(settings_obj, "INTERNAL_LLM_MODEL", None) or "gpt-4o-mini"
    standard_schema = {
        key: sorted(fields) for key, fields in AI_STANDARD_FIELDS.items()
    }
    prompt = (
        "You map Excel sheets to our standard schema. Reply with JSON only, no markdown.\n"
        f"Allowed target sheets and fields: {json.dumps(standard_schema, ensure_ascii=False)}\n"
        "Output shape: {\"sheetMappings\":[{\"sourceSheet\":\"...\",\"targetSheet\":\"scenario|events|units|unit_states|equipment|personnel|features\",\"confidence\":0-1}],"
        "\"columnMaps\":[{\"targetSheet\":\"events\",\"mappings\":[{\"fromHeader\":\"...\",\"toField\":\"one allowed field\"}]}]}\n"
        "Use source headers exactly as provided. Do not invent sheets, headers, or target fields.\n"
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
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(url, headers=req_headers, json=payload)
            resp.raise_for_status()
            body = resp.json()
        text = body["choices"][0]["message"]["content"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    except httpx.TimeoutException as e:
        raise HTTPException(
            status_code=504,
            detail="مدل محلی در زمان مقرر پاسخ نداد؛ ممکن است درگیر پردازش دیگری باشد.",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e


def _build_sheet_samples(wb) -> list[dict[str, Any]]:
    sheet_samples: list[dict[str, Any]] = []
    for name in wb.sheetnames[:12]:
        ws = wb[name]
        layout = inspect_source_table_layout(ws)
        headers = layout["headers"][:20]
        sample_rows: list[list[str]] = []
        for row in ws.iter_rows(
            min_row=layout["dataStartRow"],
            max_row=min(ws.max_row, layout["dataStartRow"] + 4),
            values_only=True,
        ):
            cells = [str(c) if c is not None else "" for c in row[:20]]
            if any(x.strip() for x in cells):
                sample_rows.append(cells)
        sheet_samples.append(
            {
                "sheet": name,
                "headerRow": layout["headerRow"],
                "headerDepth": layout["headerDepth"],
                "headers": headers,
                "sampleRows": sample_rows[:5],
            }
        )
    return sheet_samples


@router.post(
    "/scenario/ai-auto-import",
    dependencies=[Depends(require_roles("SUPER_ADMIN", "COMMANDER"))],
)
async def ai_auto_import_scenario(
    db: DbSession,
    response: Response,
    file: UploadFile = File(...),
    mapping_json: str | None = Form(default=None),
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

    # Step 2 – Use the reviewed mapping when supplied; otherwise ask the LLM.
    if mapping_json:
        try:
            supplied_mapping = json.loads(mapping_json)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=422, detail="ساختار نگاشت قابل خواندن نیست.") from exc
        mapping = _validate_ai_mapping(supplied_mapping, sheet_samples)
    else:
        mapping = _validate_ai_mapping(
            await _call_llm_for_mapping(sheet_samples, settings), sheet_samples
        )

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
