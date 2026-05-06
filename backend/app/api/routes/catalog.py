from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import json
import hashlib
import os

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.sdi.publish import generate_layers_json, _public_catalog_path


router = APIRouter(prefix="/catalog", tags=["catalog"])


def _compute_version_from_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


@router.get("/layers.json")
async def get_layers_catalog():
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
        return JSONResponse(payload)
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

