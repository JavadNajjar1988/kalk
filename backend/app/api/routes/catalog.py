from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, JSONResponse
import hashlib
import json
import os
import re
import uuid
from pathlib import Path

from pydantic import BaseModel

from app.core.config import settings
from app.deps import DbSession
from app.models.sdi import SDIMap
from app.core.security import require_roles
from app.services.catalog_vector_upload import (
    VectorConversionError,
    _bbox_from_fc,
    gpx_bytes_to_geojson,
    parse_geojson_bytes,
    shapefile_zip_to_geojson,
    write_geojson_file,
)
from app.services.sdi.publish import _public_catalog_path, generate_layers_json
from app.services.map_scenario_assignments import (
    filter_catalog_for_scenario,
    validate_scenario_ids,
)


router = APIRouter(prefix="/catalog", tags=["catalog"])

VECTOR_UPLOAD_DIR = Path("backend/static/maps/vector_uploads")
VECTOR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

_SAFE_VECTOR_NAME = re.compile(r"^[a-f0-9]{32}\.(geojson|kml)$")


class CatalogVectorUploadResponse(BaseModel):
    map_id: int
    catalog_version: str | None
    layer_url: str
    source_type: str


def _compute_version_from_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


@router.get("/layers.json")
async def get_layers_catalog(scenario_id: str | None = Query(None)):
    path = settings.CATALOG_PATH
    # If file missing, return empty catalog
    if not os.path.exists(path):
        empty_payload = {
            "schema_version": 1,
            "catalog_version": "empty",
            "layers": []
        }
        return JSONResponse(empty_payload)

    try:
        with open(path, "rb") as f:
            data = f.read()
        payload = json.loads(data.decode("utf-8"))
        if isinstance(payload, dict):
            for layer in payload.get("layers") or []:
                if isinstance(layer, dict) and isinstance(layer.get("path"), str):
                    layer["path"] = _public_catalog_path(layer["path"])
        return JSONResponse(filter_catalog_for_scenario(payload, scenario_id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed_to_read_catalog: {e}")


@router.get("/version")
async def get_catalog_version():
    path = settings.CATALOG_PATH
    if not os.path.exists(path):
        return {"catalog_version": "empty"}
    try:
        with open(path, "rb") as f:
            data = f.read()
        try:
            payload = json.loads(data.decode("utf-8"))
            ver = payload.get("catalog_version")
            if isinstance(ver, str) and len(ver) > 0:
                return {"catalog_version": ver}
        except Exception:
            pass
        # fallback: hash bytes
        return {"catalog_version": _compute_version_from_bytes(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed_to_read_version: {e}")


@router.post("/rollback", dependencies=[Depends(require_roles("ADMIN"))])
async def rollback_catalog():
    """Rollback catalog file to last backup (best-effort).

    Swaps `layers.bak.json` back to `layers.json` if backup exists.
    """
    final_path = settings.CATALOG_PATH
    bak_path = settings.CATALOG_BACKUP_PATH
    if not os.path.exists(bak_path):
        raise HTTPException(status_code=404, detail="catalog_backup_not_found")
    try:
        # overwrite current catalog with backup
        os.replace(bak_path, final_path)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"failed_to_rollback_catalog: {e}")


@router.get("/vector-data/{filename}")
async def serve_catalog_vector(filename: str):
    if not _SAFE_VECTOR_NAME.match(filename):
        raise HTTPException(status_code=404, detail="not_found")
    path = VECTOR_UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="not_found")
    media = (
        "application/geo+json"
        if filename.endswith(".geojson")
        else "application/vnd.google-earth.kml+xml"
    )
    return FileResponse(path, media_type=media)


@router.post("/upload-vector", response_model=CatalogVectorUploadResponse)
async def upload_catalog_vector_layer(
    title: str = Form(...),
    file: UploadFile = File(...),
    crs_epsg: str | None = Form(None),
    scenario_ids: str = Form("[]"),
    session: DbSession = None,
):
    """آپلود لایهٔ برداری، ذخیره، ثبت SDIMap منتشرشده و بازتولید layers.json برای کلک‌نگار."""
    try:
        parsed_scenario_ids = json.loads(scenario_ids)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="فهرست سناریوها معتبر نیست") from exc
    if not isinstance(parsed_scenario_ids, list) or not all(
        isinstance(value, str) for value in parsed_scenario_ids
    ):
        raise HTTPException(status_code=400, detail="فهرست سناریوها معتبر نیست")
    assigned_scenario_ids = await validate_scenario_ids(session, parsed_scenario_ids)

    raw = await file.read()
    if len(raw) > 80 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="فایل خیلی بزرگ است")

    crs_epsg_val: int | None = None
    if crs_epsg and crs_epsg.strip():
        try:
            crs_epsg_val = int(crs_epsg.strip())
        except ValueError:
            raise HTTPException(status_code=400, detail="crs_epsg باید عدد صحیح باشد (مثل 32639).")

    name_lower = (file.filename or "").lower()
    uid = uuid.uuid4().hex

    try:
        if name_lower.endswith(".zip"):
            fc = shapefile_zip_to_geojson(raw, crs_epsg=crs_epsg_val)
            fname = f"{uid}.geojson"
            out_path = VECTOR_UPLOAD_DIR / fname
            write_geojson_file(fc, out_path)
            source_type = "geojson"
            ext = "geojson"
            bbox = _bbox_from_fc(fc)
        elif name_lower.endswith((".geojson", ".json")):
            fc = parse_geojson_bytes(raw)
            fname = f"{uid}.geojson"
            out_path = VECTOR_UPLOAD_DIR / fname
            write_geojson_file(fc, out_path)
            source_type = "geojson"
            ext = "geojson"
            bbox = _bbox_from_fc(fc)
        elif name_lower.endswith(".gpx"):
            fc = gpx_bytes_to_geojson(raw)
            fname = f"{uid}.geojson"
            out_path = VECTOR_UPLOAD_DIR / fname
            write_geojson_file(fc, out_path)
            source_type = "geojson"
            ext = "geojson"
            bbox = _bbox_from_fc(fc)
        elif name_lower.endswith(".kml"):
            fname = f"{uid}.kml"
            out_path = VECTOR_UPLOAD_DIR / fname
            out_path.write_bytes(raw)
            source_type = "kml"
            ext = "kml"
            bbox = None
        elif name_lower.endswith((".tif", ".tiff")):
            raise HTTPException(
                status_code=400,
                detail="GeoTIFF از این مسیر پشتیبانی نمی‌شود؛ از نقشهٔ رستری/سرور استفاده کنید.",
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="فرمت پشتیبانی‌شده: zip (shapefile)، geojson، json، kml، gpx",
            )
    except VectorConversionError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    layer_url = f"{settings.API_PREFIX}/catalog/vector-data/{uid}.{ext}"
    file_hash = hashlib.sha256(out_path.read_bytes()).hexdigest()

    obj = SDIMap(
        server_id=None,
        title=title.strip() or (file.filename or "vector-layer"),
        description=None,
        source_type=source_type,
        url_or_path=layer_url,
        layer_name=None,
        format=ext,
        srs="EPSG:4326",
        minzoom=None,
        maxzoom=None,
        bbox=bbox,
        version="v1",
        hash=file_hash,
        status="published",
        roles=None,
        scenario_ids=assigned_scenario_ids,
        category="uploaded-vector",
        extra_metadata={"original_filename": file.filename},
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)

    payload = await generate_layers_json(session)
    return CatalogVectorUploadResponse(
        map_id=obj.id,
        catalog_version=str(payload.get("catalog_version")) if payload.get("catalog_version") else None,
        layer_url=layer_url,
        source_type=source_type,
    )
