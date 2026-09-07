"""Persistent, single-worker document extraction jobs for the local deployment."""
from __future__ import annotations

import asyncio
import hashlib
import io
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from PIL import Image

from app.core.config import settings
from app.services.document_extraction import (
    document_page_count,
    extract_page,
    normalize_proposal_semantics,
    read_page,
)


TERMINAL_STATUSES = {"completed", "partial", "failed", "cancelled"}
MAP_PAGE_ERROR_MARKERS = (
    "نقشه یا تصویر پرجزئیات",
    "برای نقشه از برش نوشته‌ها",
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def job_root() -> Path:
    root = Path(settings.DOCUMENT_JOB_DIR).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _job_dir(job_id: str) -> Path:
    try:
        safe_id = str(UUID(job_id))
    except (ValueError, TypeError, AttributeError) as exc:
        raise ValueError("شناسه کار پردازش معتبر نیست.") from exc
    return job_root() / safe_id


def _metadata_path(job_id: str) -> Path:
    return _job_dir(job_id) / "job.json"


def is_map_page_error(error: object) -> bool:
    message = str(error)
    return any(marker in message for marker in MAP_PAGE_ERROR_MARKERS)


def _map_page_path(job_id: str, page: int) -> Path:
    return _job_dir(job_id) / "map-pages" / f"{page}.webp"


def _persist_map_page(job: dict[str, Any], raw: bytes, page: int) -> Path:
    page_data = read_page(raw, str(job["filename"]), page, True)
    image = page_data.get("image")
    if not isinstance(image, Image.Image):
        raise ValueError("تصویر کامل این صفحه برای بازبینی در دسترس نیست.")
    prepared: Image.Image | None = None
    try:
        prepared = image.convert("RGB")
        prepared.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
        target = _map_page_path(str(job["id"]), page)
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix(".webp.tmp")
        buffer = io.BytesIO()
        prepared.save(buffer, format="WEBP", quality=88, method=4)
        temporary.write_bytes(buffer.getvalue())
        temporary.replace(target)
        return target
    finally:
        if prepared is not None:
            prepared.close()
        image.close()


def _promote_map_page(
    job: dict[str, Any], raw: bytes, page: int, reason: str
) -> dict[str, Any]:
    _persist_map_page(job, raw, page)
    result = {
        "documentId": job["documentId"],
        "filename": job["filename"],
        "page": page,
        "pageCount": job["pageCount"],
        "method": "map-reference",
        "pageKind": "military-map",
        "text": "",
        "warnings": [
            "این صفحه به‌عنوان کالک یا نقشه تصویری شناسایی شد و برای جانمایی نیازمند بازبینی کاربر است."
        ],
        "items": [],
        "persisted": True,
    }
    _write_json(_job_dir(str(job["id"])) / "pages" / f"{page}.json", result)
    return {
        "page": page,
        "status": "needs_placement",
        "rotationDegrees": 0,
        "reason": reason[:1000],
    }


def detect_map_pages(job_id: str, owner: str) -> dict[str, Any]:
    """Promote known map-like OCR failures into reviewable image-page results."""
    job = get_job(job_id, owner)
    if job.get("status") not in TERMINAL_STATUSES:
        raise ValueError("تشخیص کالک‌ها پس از پایان پردازش سند انجام می‌شود.")
    raw = Path(job["sourcePath"]).read_bytes()
    failures = dict(job.get("failedPages") or {})
    completed = {int(value) for value in job.get("processedPages") or []}
    map_pages = dict(job.get("mapPages") or {})
    for page_text, reason in list(failures.items()):
        if not is_map_page_error(reason):
            continue
        page = int(page_text)
        map_pages[page_text] = _promote_map_page(job, raw, page, str(reason))
        completed.add(page)
        failures.pop(page_text, None)
    job.update(
        processedPages=sorted(completed),
        failedPages=failures,
        mapPages=map_pages,
        status="partial" if failures else "completed",
        updatedAt=_now(),
    )
    _write_json(_metadata_path(job_id), job)
    return job


def get_map_page_path(job_id: str, page: int, owner: str) -> Path:
    job = get_job(job_id, owner)
    if str(page) not in (job.get("mapPages") or {}):
        raise FileNotFoundError("تصویر کالک این صفحه آماده نیست.")
    path = _map_page_path(job_id, page)
    if not path.is_file():
        raise FileNotFoundError("تصویر کالک این صفحه آماده نیست.")
    return path


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    for attempt in range(8):
        try:
            temporary.replace(path)
            return
        except PermissionError:
            if attempt == 7:
                raise
            # Windows bind mounts can briefly lock the destination while the
            # dashboard reads job status. Retrying preserves the atomic write.
            time.sleep(min(0.05 * (2**attempt), 0.4))


def _read_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError("کار پردازش پیدا نشد.")
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("اطلاعات کار پردازش آسیب دیده است.")
    return value


def get_job(job_id: str, owner: str | None = None) -> dict[str, Any]:
    job = _read_json(_metadata_path(job_id))
    if owner is not None and job.get("owner") != owner:
        raise PermissionError("دسترسی به این کار پردازش مجاز نیست.")
    return job


def public_job(job: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in job.items()
        if key not in {"owner", "sourcePath", "workerId"}
    }


def create_job(raw: bytes, filename: str, owner: str, force_ocr: bool) -> dict[str, Any]:
    safe_name = Path(filename).name
    suffix = Path(safe_name).suffix.lower()
    if suffix not in {".pdf", ".png", ".jpg", ".jpeg", ".txt"}:
        raise ValueError("قالب سند برای پردازش پشتیبانی نمی‌شود.")
    total = document_page_count(raw, safe_name)
    job_id = str(uuid4())
    directory = _job_dir(job_id)
    directory.mkdir(parents=True, exist_ok=False)
    source = directory / f"source{suffix}"
    source.write_bytes(raw)
    created = _now()
    job = {
        "id": job_id,
        "owner": owner,
        "filename": safe_name,
        "sourcePath": str(source),
        "documentId": hashlib.sha256(raw).hexdigest(),
        "pageCount": total,
        "forceOcr": force_ocr,
        "status": "queued",
        "currentPage": None,
        "processedPages": [],
        "failedPages": {},
        "mapPages": {},
        "createdAt": created,
        "updatedAt": created,
        "completedAt": None,
        "error": None,
        "workerId": None,
    }
    _write_json(_metadata_path(job_id), job)
    return job


def request_cancel(job_id: str, owner: str) -> dict[str, Any]:
    job = get_job(job_id, owner)
    if job["status"] in TERMINAL_STATUSES:
        return job
    job["status"] = "cancelled" if job["status"] == "queued" else "cancel_requested"
    job["updatedAt"] = _now()
    if job["status"] == "cancelled":
        job["completedAt"] = job["updatedAt"]
    _write_json(_metadata_path(job_id), job)
    return job


def resume_job(job_id: str, owner: str) -> dict[str, Any]:
    job = get_job(job_id, owner)
    if job["status"] not in {"partial", "failed", "cancelled"}:
        return job
    job.update(status="queued", currentPage=None, completedAt=None, error=None, updatedAt=_now())
    _write_json(_metadata_path(job_id), job)
    return job


def get_job_page(job_id: str, page: int, owner: str) -> dict[str, Any]:
    job = get_job(job_id, owner)
    if not 1 <= page <= int(job["pageCount"]):
        raise ValueError("شماره صفحه خارج از محدوده سند است.")
    result = _read_json(_job_dir(job_id) / "pages" / f"{page}.json")
    clean_items = []
    removed = 0
    for item in result.get("items") or []:
        normalized = normalize_proposal_semantics(
            str(item.get("kind") or ""),
            str(item.get("name") or ""),
            str(item.get("evidence") or ""),
        )
        if normalized is None:
            removed += 1
            continue
        kind, name = normalized
        clean_items.append({**item, "kind": kind, "name": name})
    warnings = list(result.get("warnings") or [])
    if removed:
        warnings.append(f"{removed} پیشنهاد نامعتبر در پالایش معنایی حذف شد.")
    return {**result, "items": clean_items, "warnings": warnings, "persisted": True}


def list_jobs(owner: str, limit: int = 10) -> list[dict[str, Any]]:
    jobs: list[dict[str, Any]] = []
    for path in job_root().glob("*/job.json"):
        try:
            job = _read_json(path)
            if job.get("owner") == owner:
                jobs.append(public_job(job))
        except (OSError, ValueError, json.JSONDecodeError):
            continue
    jobs.sort(key=lambda item: item.get("createdAt") or "", reverse=True)
    return jobs[:limit]


async def _process_job(job_id: str) -> None:
    job = get_job(job_id)
    source = Path(job["sourcePath"])
    worker_id = str(uuid4())
    try:
        raw = await asyncio.to_thread(source.read_bytes)
        job.update(status="running", error=None, workerId=worker_id, updatedAt=_now())
        _write_json(_metadata_path(job_id), job)
        completed = {int(page) for page in job.get("processedPages") or []}
        failures = dict(job.get("failedPages") or {})
        map_pages = dict(job.get("mapPages") or {})
        for page in range(1, int(job["pageCount"]) + 1):
            latest = get_job(job_id)
            if latest.get("workerId") != worker_id:
                return
            if latest.get("status") == "cancel_requested":
                latest.update(
                    status="cancelled",
                    currentPage=None,
                    workerId=None,
                    completedAt=_now(),
                    updatedAt=_now(),
                )
                _write_json(_metadata_path(job_id), latest)
                return
            if page in completed:
                continue
            job = latest
            job.update(currentPage=page, updatedAt=_now())
            _write_json(_metadata_path(job_id), job)
            try:
                page_data = await asyncio.to_thread(
                    read_page, raw, job["filename"], page, bool(job.get("forceOcr"))
                )
                result = await extract_page(page_data, raw, job["filename"], settings)
                result["persisted"] = True
                latest = get_job(job_id)
                if latest.get("workerId") != worker_id:
                    return
                await asyncio.to_thread(
                    _write_json, _job_dir(job_id) / "pages" / f"{page}.json", result
                )
                completed.add(page)
                failures.pop(str(page), None)
            except Exception as exc:  # keep later pages moving
                if is_map_page_error(exc):
                    try:
                        map_pages[str(page)] = await asyncio.to_thread(
                            _promote_map_page, job, raw, page, str(exc)
                        )
                        completed.add(page)
                        failures.pop(str(page), None)
                    except Exception as promotion_error:
                        failures[str(page)] = str(promotion_error)[:1000]
                else:
                    failures[str(page)] = str(exc)[:1000]
            job = get_job(job_id)
            if job.get("workerId") != worker_id:
                return
            job.update(
                processedPages=sorted(completed),
                failedPages=failures,
                mapPages=map_pages,
                updatedAt=_now(),
            )
            _write_json(_metadata_path(job_id), job)
        job = get_job(job_id)
        if job.get("workerId") != worker_id:
            return
        finished = _now()
        if job.get("status") == "cancel_requested":
            job.update(
                status="cancelled",
                currentPage=None,
                workerId=None,
                completedAt=finished,
                updatedAt=finished,
            )
        else:
            job.update(
                status="partial" if failures else "completed",
                currentPage=None,
                workerId=None,
                failedPages=failures,
                completedAt=finished,
                updatedAt=finished,
            )
        _write_json(_metadata_path(job_id), job)
    except Exception as exc:
        job = get_job(job_id)
        if job.get("workerId") == worker_id:
            job.update(
                status="failed",
                currentPage=None,
                workerId=None,
                error=str(exc)[:2000],
                completedAt=_now(),
                updatedAt=_now(),
            )
            _write_json(_metadata_path(job_id), job)


def _next_queued_job() -> str | None:
    candidates = []
    for path in job_root().glob("*/job.json"):
        try:
            job = _read_json(path)
            if job.get("status") in {"queued", "running"}:
                candidates.append(job)
        except (OSError, ValueError, json.JSONDecodeError):
            continue
    if not candidates:
        return None
    candidates.sort(key=lambda item: item.get("createdAt") or "")
    job = candidates[0]
    if job.get("status") == "running":
        job.update(status="queued", currentPage=None, workerId=None, updatedAt=_now())
        _write_json(_metadata_path(job["id"]), job)
    return str(job["id"])


async def document_job_worker_loop() -> None:
    while True:
        try:
            job_id = await asyncio.to_thread(_next_queued_job)
            if job_id:
                await _process_job(job_id)
            else:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            raise
        except Exception:
            await asyncio.sleep(2)
