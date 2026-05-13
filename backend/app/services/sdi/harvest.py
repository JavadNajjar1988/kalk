from __future__ import annotations

import os
import sqlite3
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse, unquote
import httpx
import xml.etree.ElementTree as ET


def _read_mbtiles_metadata(path: str) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    if not os.path.exists(path):
        return meta
    try:
        conn = sqlite3.connect(path)
        try:
            cur = conn.cursor()
            # metadata table
            try:
                for k, v in cur.execute("SELECT name, value FROM metadata").fetchall():
                    meta[k] = v
            except Exception:
                pass
            # infer min/max zoom if missing
            try:
                if "minzoom" not in meta or "maxzoom" not in meta:
                    row = cur.execute("SELECT MIN(zoom_level), MAX(zoom_level) FROM tiles").fetchone()
                    if row:
                        if "minzoom" not in meta and row[0] is not None:
                            meta["minzoom"] = int(row[0])
                        if "maxzoom" not in meta and row[1] is not None:
                            meta["maxzoom"] = int(row[1])
            except Exception:
                pass
        finally:
            conn.close()
    except Exception:
        pass
    return meta


def harvest_offline_mbtiles(file_path: str) -> Dict[str, Any]:
    """Extract basic metadata from MBTiles file for SDIMap prefill."""
    meta = _read_mbtiles_metadata(file_path)
    # bounds can be comma-separated string
    bbox = None
    b = meta.get("bounds")
    if isinstance(b, str) and "," in b:
        try:
            parts = [float(x) for x in b.split(",")]
            if len(parts) == 4:
                bbox = parts
        except Exception:
            bbox = None
    return {
        "minzoom": int(meta.get("minzoom")) if str(meta.get("minzoom")).isdigit() else None,
        "maxzoom": int(meta.get("maxzoom")) if str(meta.get("maxzoom")).isdigit() else None,
        "bbox": bbox,
        "format": meta.get("format") or "png",
    }


def harvest_offline_folder(folder_path: str) -> Dict[str, Any]:
    """Naive scan of z/x/y folder to guess min/max zoom; returns minimal metadata."""
    minz: Optional[int] = None
    maxz: Optional[int] = None
    try:
        if os.path.isdir(folder_path):
            for name in os.listdir(folder_path):
                try:
                    if name.lower().startswith("z"):
                        z = int(name[1:])
                    else:
                        z = int(name)
                except Exception:
                    continue
                minz = z if minz is None else min(minz, z)
                maxz = z if maxz is None else max(maxz, z)
    except Exception:
        pass
    return {"minzoom": minz, "maxzoom": maxz, "bbox": None, "format": "png"}


def _ensure_query(url: str, params: Dict[str, str]) -> str:
    """Merge provided params into URL query string without duplicating keys."""
    parts = list(urlparse(url))
    q = parse_qs(parts[4])
    for k, v in params.items():
        q[k] = [v]
    parts[4] = urlencode({k: v[0] for k, v in q.items()}, doseq=False)
    return urlunparse(parts)


async def harvest_wms_layers(base_url: str) -> List[Dict[str, Any]]:
    """Fetch WMS GetCapabilities and extract layer name/title.
    Returns list of SDIMap-like dicts (draft level info).
    """
    url = _ensure_query(base_url, {"service": "WMS", "request": "GetCapabilities"})
    async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
        r = await client.get(url)
        r.raise_for_status()
        xml = r.text
    root = ET.fromstring(xml)
    # Try both WMS 1.1.1 and 1.3.0 namespaces
    ns = {
        "wms": "http://www.opengis.net/wms",
    }
    layers: List[Dict[str, Any]] = []
    for lyr in root.findall(".//{http://www.opengis.net/wms}Layer"):
        name_el = lyr.find("{http://www.opengis.net/wms}Name")
        title_el = lyr.find("{http://www.opengis.net/wms}Title")
        if name_el is None or not (name_el.text or "").strip():
            continue
        layer_name = (name_el.text or "").strip()
        title = (title_el.text or layer_name).strip() if title_el is not None else layer_name
        # Try SRS/CRS
        srs = None
        crs_el = lyr.find("{http://www.opengis.net/wms}CRS") or lyr.find("{http://www.opengis.net/wms}SRS")
        if crs_el is not None and (crs_el.text or "").strip():
            srs = (crs_el.text or "").strip()
        # Try bounds
        bbox = None
        llbbox = lyr.find("{http://www.opengis.net/wms}EX_GeographicBoundingBox")
        if llbbox is not None:
            try:
                west = float((llbbox.findtext("{http://www.opengis.net/wms}westBoundLongitude") or "").strip())
                south = float((llbbox.findtext("{http://www.opengis.net/wms}southBoundLatitude") or "").strip())
                east = float((llbbox.findtext("{http://www.opengis.net/wms}eastBoundLongitude") or "").strip())
                north = float((llbbox.findtext("{http://www.opengis.net/wms}northBoundLatitude") or "").strip())
                bbox = [west, south, east, north]
            except Exception:
                bbox = None
        if bbox is None:
            llbox2 = lyr.find("{http://www.opengis.net/wms}LatLonBoundingBox")
            if llbox2 is not None:
                try:
                    minx = float(llbox2.get("minx"))
                    miny = float(llbox2.get("miny"))
                    maxx = float(llbox2.get("maxx"))
                    maxy = float(llbox2.get("maxy"))
                    bbox = [minx, miny, maxx, maxy]
                except Exception:
                    bbox = None
        layers.append({
            "source_type": "wms",
            "url_or_path": base_url,
            "layer_name": layer_name,
            "title": title,
            "status": "draft",
            "srs": srs,
            "bbox": bbox,
            "format": "image/png",
        })
    return layers


async def harvest_wmts_layers(base_url: str) -> List[Dict[str, Any]]:
    """Fetch WMTS GetCapabilities and extract layer Identifier/Title."""
    url = _ensure_query(base_url, {"service": "WMTS", "request": "GetCapabilities", "version": "1.0.0"})
    async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
        r = await client.get(url)
        r.raise_for_status()
        xml = r.text
    root = ET.fromstring(xml)
    ns = {
        "ows": "http://www.opengis.net/ows/1.1",
        "wmts": "http://www.opengis.net/wmts/1.0",
    }
    layers: List[Dict[str, Any]] = []
    for lyr in root.findall(".//{http://www.opengis.net/wmts/1.0}Layer"):
        ident = lyr.find("{http://www.opengis.net/ows/1.1}Identifier")
        title_el = lyr.find("{http://www.opengis.net/ows/1.1}Title")
        if ident is None or not (ident.text or "").strip():
            continue
        layer_name = (ident.text or "").strip()
        title = (title_el.text or layer_name).strip() if title_el is not None else layer_name
        layers.append(
            {
                "source_type": "wmts",
                "url_or_path": base_url,
                "layer_name": layer_name,
                "title": title,
                "status": "draft",
            }
        )
    return layers


def _normalize_xyz_tile_template(base_url: str) -> str:
    """Build a Slippy Map XYZ URL template from a root URL or return if already templated.

    If the URL already contains {z}/{x}/{y} placeholders, it is returned trimmed.
    Otherwise appends /{z}/{x}/{y}.png (common default for raster tiles).
    """
    u = (base_url or "").strip().rstrip("/")
    if not u:
        return u
    lower = u.lower()
    if "{z}" in lower and "{x}" in lower and "{y}" in lower:
        return u
    # OSM-style root → template
    return f"{u}/{{z}}/{{x}}/{{y}}.png"


def _title_from_xyz_url(url: str) -> str:
    try:
        path = urlparse(url).path.rstrip("/")
        seg = path.split("/")[-1] if path else ""
        seg = unquote(seg or "").strip()
        if seg and seg not in ("{z}", "{x}", "{y}"):
            return seg.replace("-", " ").replace("_", " ").strip() or "XYZ tiles"
    except Exception:
        pass
    return "XYZ tiles"


async def harvest_xyz_layers(base_url: str) -> List[Dict[str, Any]]:
    """Single logical layer for an XYZ / raster tile endpoint.

    Expects either a tile root (we append /{z}/{x}/{y}.png) or a full template URL.
    """
    template = _normalize_xyz_tile_template(base_url)
    if not template:
        return []
    stem = base_url.split("{", 1)[0].rstrip("/") if "{" in (base_url or "") else (base_url or "").rstrip("/")
    title = _title_from_xyz_url(stem)
    return [
        {
            "source_type": "xyz",
            "url_or_path": template,
            "layer_name": None,
            "title": title,
            "status": "draft",
            "srs": "EPSG:3857",
            "format": "image/png",
            "minzoom": 0,
            "maxzoom": 22,
            "bbox": None,
        }
    ]


async def harvest_ogcapi_features(base_url: str) -> List[Dict[str, Any]]:
    """Harvest OGC API Features collections.
    Expects a base URL pointing to the landing page or /collections endpoint.
    """
    # Normalize to /collections
    url = base_url.rstrip('/')
    if not url.endswith('/collections'):
        url = f"{url}/collections"
    async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
        r = await client.get(url, headers={"Accept": "application/json"})
        r.raise_for_status()
        data = r.json()
    cols = data.get("collections", []) if isinstance(data, dict) else []
    out: List[Dict[str, Any]] = []
    for c in cols:
        cid = str(c.get("id") or c.get("name") or "")
        if not cid:
            continue
        title = str(c.get("title") or cid)
        extent = c.get("extent") or {}
        bbox = None
        srs = None
        try:
            bbox_list = extent.get("spatial", {}).get("bbox")
            if isinstance(bbox_list, list) and len(bbox_list) > 0:
                first = bbox_list[0]
                if isinstance(first, list) and len(first) >= 4:
                    bbox = [float(first[0]), float(first[1]), float(first[2]), float(first[3])]
        except Exception:
            pass
        crs_list = extent.get("spatial", {}).get("crs") or c.get("crs") or []
        if isinstance(crs_list, list) and crs_list:
            srs = str(crs_list[0])
        out.append(
            {
                "source_type": "ogcapi_features",
                "url_or_path": base_url,
                "layer_name": cid,
                "title": title,
                "status": "draft",
                "bbox": bbox,
                "srs": srs,
                "format": "application/geo+json",
            }
        )
    return out
