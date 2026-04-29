from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import DbSession
from app.models.sdi import SDIMap, SDIServer
from app.models.map import OfflineMap
from app.schemas.sdi import (
    SDIMapResponse,
    SDIMapListResponse,
    SDIMapCreate,
    SDIMapUpdate,
    SDIServerCreate,
    SDIServerUpdate,
    SDIServerResponse,
    SDIServerListResponse,
)
from app.core.config import settings
from app.services.sdi.publish import generate_layers_json
from app.core.security import require_roles
from app.services.sdi.harvest import (
    harvest_offline_mbtiles,
    harvest_offline_folder,
    harvest_wms_layers,
    harvest_wmts_layers,
    harvest_ogcapi_features,
)
import httpx


router = APIRouter(prefix="/sdi", tags=["sdi"])


@router.get("/maps", response_model=SDIMapListResponse)
async def list_sdi_maps(
    status: str = Query("all", pattern="^(all|draft|published|retired)$"),
    skip: int = 0,
    limit: int = 100,
    session: DbSession = None,
):
    q = select(SDIMap)
    if status != "all":
        q = q.where(SDIMap.status == status)
    total_res = await session.execute(select(func.count()).select_from(q.subquery()))
    total = int(total_res.scalar_one() or 0)
    res = await session.execute(q.order_by(SDIMap.created_at.desc()).offset(skip).limit(limit))
    items = list(res.scalars().all() or [])
    return SDIMapListResponse(maps=[SDIMapResponse.model_validate(i) for i in items], total=total)


@router.post("/maps", response_model=SDIMapResponse, dependencies=[Depends(require_roles("ADMIN"))])
async def create_sdi_map(payload: SDIMapCreate, session: DbSession = None):
    obj = SDIMap(
        server_id=payload.server_id,
        title=payload.title,
        description=payload.description,
        source_type=payload.source_type,
        url_or_path=payload.url_or_path,
        layer_name=payload.layer_name,
        format=payload.format,
        srs=payload.srs,
        minzoom=payload.minzoom,
        maxzoom=payload.maxzoom,
        bbox=payload.bbox,
        version=payload.version,
        status=payload.status,
        roles=payload.roles,
        category=payload.category,
        extra_metadata=payload.extra_metadata,
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return SDIMapResponse.model_validate(obj)


# ---- SDI Servers ----

@router.get("/servers", response_model=SDIServerListResponse)
async def list_servers(session: DbSession = None):
    res = await session.execute(select(SDIServer).order_by(SDIServer.created_at.desc()))
    items = list(res.scalars().all() or [])
    return SDIServerListResponse(servers=[SDIServerResponse.model_validate(i) for i in items])


@router.post("/servers", response_model=SDIServerResponse)
async def create_server(payload: SDIServerCreate, session: DbSession = None):
    obj = SDIServer(
        name=payload.name,
        base_url=payload.base_url,
        service_types=payload.service_types or [],
        auth_type=payload.auth_type or "none",
        auth_config=payload.auth_config,
        status="active",
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return SDIServerResponse.model_validate(obj)


@router.get("/servers/{server_id}", response_model=SDIServerResponse)
async def get_server(server_id: int, session: DbSession = None):
    res = await session.execute(select(SDIServer).where(SDIServer.id == server_id))
    obj = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="server_not_found")
    return SDIServerResponse.model_validate(obj)


@router.put("/servers/{server_id}", response_model=SDIServerResponse, dependencies=[Depends(require_roles("ADMIN"))])
async def update_server(server_id: int, payload: SDIServerUpdate, session: DbSession = None):
    res = await session.execute(select(SDIServer).where(SDIServer.id == server_id))
    obj: SDIServer | None = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="server_not_found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await session.commit()
    await session.refresh(obj)
    return SDIServerResponse.model_validate(obj)


@router.delete("/servers/{server_id}", dependencies=[Depends(require_roles("ADMIN"))])
async def delete_server(server_id: int, session: DbSession = None):
    res = await session.execute(select(SDIServer).where(SDIServer.id == server_id))
    obj = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="server_not_found")
    await session.delete(obj)
    await session.commit()
    return {"deleted": server_id}


@router.post("/servers/{server_id}/test", dependencies=[Depends(require_roles("ADMIN"))])
async def test_server(server_id: int, session: DbSession = None):
    res = await session.execute(select(SDIServer).where(SDIServer.id == server_id))
    obj: SDIServer | None = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="server_not_found")
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            r = await client.get(obj.base_url)
        return {"ok": r.status_code < 500, "status": r.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/servers/test", dependencies=[Depends(require_roles("ADMIN"))])
async def test_server_ad_hoc(base_url: str):
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            r = await client.get(base_url)
        return {"ok": r.status_code < 500, "status": r.status_code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@router.post("/servers/{server_id}/harvest", dependencies=[Depends(require_roles("ADMIN"))])
async def harvest_server(server_id: int, session: DbSession = None):
    # fetch server
    res = await session.execute(select(SDIServer).where(SDIServer.id == server_id))
    server: SDIServer | None = res.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="server_not_found")

    # create job
    from app.models.sdi import SDIJob
    job = SDIJob(type="harvest", server_id=server.id, status="running", logs=["starting"], map_ids=[])
    session.add(job)
    await session.commit()
    await session.refresh(job)

    harvested_ids: list[int] = []
    logs: list[str] = []
    try:
        svc_types = server.service_types or []
        candidates: list[dict] = []
        if any(t.lower() == "wms" for t in svc_types) or "wms" in server.base_url.lower():
            try:
                candidates += await harvest_wms_layers(server.base_url)
                logs.append("wms: ok")
            except Exception as e:
                logs.append(f"wms: error {e}")
        if any(t.lower() == "wmts" for t in svc_types) or "wmts" in server.base_url.lower():
            try:
                candidates += await harvest_wmts_layers(server.base_url)
                logs.append("wmts: ok")
            except Exception as e:
                logs.append(f"wmts: error {e}")
        if any(("ogc" in (t.lower())) or ("features" in (t.lower())) for t in svc_types) or "/collections" in server.base_url.lower():
            try:
                candidates += await harvest_ogcapi_features(server.base_url)
                logs.append("ogcapi: ok")
            except Exception as e:
                logs.append(f"ogcapi: error {e}")

        for c in candidates:
            obj = SDIMap(
                server_id=server.id,
                title=c.get("title") or c.get("layer_name") or "Unnamed",
                description=None,
                source_type=c.get("source_type") or "wms",
                url_or_path=c.get("url_or_path") or server.base_url,
                layer_name=c.get("layer_name"),
                format=c.get("format"),
                srs=c.get("srs") or "EPSG:3857",
                minzoom=c.get("minzoom"),
                maxzoom=c.get("maxzoom"),
                bbox=c.get("bbox"),
                status="draft",
                roles=None,
                category=None,
                extra_metadata={"server_id": server.id},
            )
            session.add(obj)
            await session.flush()
            harvested_ids.append(obj.id)

        await session.commit()
        job.status = "success"
        job.map_ids = harvested_ids
        job.logs = (job.logs or []) + logs
        await session.commit()
        return {"harvested": len(harvested_ids), "map_ids": harvested_ids, "job_id": job.id}
    except Exception as e:
        job.status = "error"
        job.error = str(e)
        job.logs = (job.logs or []) + logs + [f"error: {e}"]
        await session.commit()
        raise


@router.get("/jobs")
async def list_jobs(session: DbSession = None):
    from app.models.sdi import SDIJob
    res = await session.execute(select(SDIJob).order_by(SDIJob.started_at.desc()))
    items = [
        {
            "id": j.id,
            "type": j.type,
            "status": j.status,
            "server_id": j.server_id,
            "map_ids": j.map_ids,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "ended_at": j.ended_at.isoformat() if j.ended_at else None,
            "logs": j.logs,
            "error": j.error,
        }
        for j in res.scalars().all() or []
    ]
    return {"jobs": items}


@router.get("/jobs/{job_id}")
async def get_job(job_id: int, session: DbSession = None):
    from app.models.sdi import SDIJob
    res = await session.execute(select(SDIJob).where(SDIJob.id == job_id))
    j = res.scalar_one_or_none()
    if not j:
        raise HTTPException(status_code=404, detail="job_not_found")
    return {
        "id": j.id,
        "type": j.type,
        "status": j.status,
        "server_id": j.server_id,
        "map_ids": j.map_ids,
        "started_at": j.started_at.isoformat() if j.started_at else None,
        "ended_at": j.ended_at.isoformat() if j.ended_at else None,
        "logs": j.logs,
        "error": j.error,
    }


@router.get("/maps/{map_id}", response_model=SDIMapResponse)
async def get_sdi_map(map_id: int, session: DbSession = None):
    res = await session.execute(select(SDIMap).where(SDIMap.id == map_id))
    obj = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="sdi_map_not_found")
    return SDIMapResponse.model_validate(obj)


@router.put("/maps/{map_id}", response_model=SDIMapResponse)
async def update_sdi_map(map_id: int, payload: SDIMapUpdate, session: DbSession = None):
    res = await session.execute(select(SDIMap).where(SDIMap.id == map_id))
    obj: SDIMap | None = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="sdi_map_not_found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    await session.commit()
    await session.refresh(obj)
    return SDIMapResponse.model_validate(obj)


@router.post("/maps/{map_id}/publish", dependencies=[Depends(require_roles("ADMIN"))])
async def publish_map(map_id: int, session: DbSession = None):
    res = await session.execute(select(SDIMap).where(SDIMap.id == map_id))
    obj: SDIMap | None = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="sdi_map_not_found")
    obj.status = "published"
    await session.commit()
    # regenerate catalog
    payload = await generate_layers_json(session)
    return {"catalog_version": payload.get("catalog_version"), "published": [obj.id]}


@router.post("/maps/publish", dependencies=[Depends(require_roles("ADMIN"))])
async def publish_maps(map_ids: list[int], session: DbSession = None):
    if not map_ids:
        return {"catalog_version": None, "published": []}
    res = await session.execute(select(SDIMap).where(SDIMap.id.in_(map_ids)))
    items = list(res.scalars().all() or [])
    if not items:
        raise HTTPException(status_code=404, detail="no_maps_found")
    for m in items:
        m.status = "published"
    await session.commit()
    payload = await generate_layers_json(session)
    return {"catalog_version": payload.get("catalog_version"), "published": [m.id for m in items]}


@router.post("/maps/{map_id}/retire", dependencies=[Depends(require_roles("ADMIN"))])
async def retire_map(map_id: int, session: DbSession = None):
    res = await session.execute(select(SDIMap).where(SDIMap.id == map_id))
    obj: SDIMap | None = res.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="sdi_map_not_found")
    obj.status = "retired"
    await session.commit()
    payload = await generate_layers_json(session)
    return {"catalog_version": payload.get("catalog_version"), "retired": obj.id}


def _build_tiles_url_template(offline: OfflineMap) -> str:
    if offline.storage_type == "filesystem":
        return f"/api/tile-cache/{offline.id}/{{z}}/{{x}}/{{y}}"
    base_url = settings.TILESERVER_URL.rstrip("/")
    tileset = offline.filename or offline.file_path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    if tileset.lower().endswith(".mbtiles"):
        tileset = tileset[:-8]
    return f"{base_url}/data/{tileset}/{{z}}/{{x}}/{{-y}}.png"


@router.post("/offline/harvest-from-offline-map/{offline_map_id}", response_model=SDIMapResponse, dependencies=[Depends(require_roles("ADMIN"))])
async def harvest_from_offline_map(offline_map_id: int, session: DbSession = None):
    res = await session.execute(select(OfflineMap).where(OfflineMap.id == offline_map_id))
    om = res.scalar_one_or_none()
    if not om:
        raise HTTPException(status_code=404, detail="offline_map_not_found")

    # extract metadata
    if om.storage_type == "mbtiles":
        meta = harvest_offline_mbtiles(om.file_path)
        source_type = "xyz_mbtiles"
    else:
        meta = harvest_offline_folder(om.file_path)
        source_type = "xyz_sqlite"

    obj = SDIMap(
        server_id=None,
        title=om.name,
        description=om.description,
        source_type=source_type,
        url_or_path=_build_tiles_url_template(om),
        layer_name=None,
        format=meta.get("format"),
        srs="EPSG:3857",
        minzoom=meta.get("minzoom"),
        maxzoom=meta.get("maxzoom"),
        bbox=meta.get("bbox"),
        version="v1",
        status="draft",
        roles=None,
        category=None,
        extra_metadata={"offline_map_id": om.id},
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return SDIMapResponse.model_validate(obj)
