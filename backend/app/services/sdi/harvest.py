from __future__ import annotations

import os
import re
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


# Path ending with /zoom/x/y or /zoom/x/y.ext — typical XYZ tile samples pasted by admins.
_TILE_NUMERIC_TAIL_RE = re.compile(
    r"/(\d+)/(\d+)/(\d+)(\.(?:png|jpg|jpeg|webp))?/?$",
    re.IGNORECASE,
)


def _concrete_tile_url_to_template(raw_url: str) -> Optional[str]:
    """Turn .../z/x/y or .../z/x/y.ext into .../{z}/{x}/{y}[.ext]. Query string preserved."""
    u = (raw_url or "").strip()
    if not u or "{z}" in u.lower():
        return None
    parsed = urlparse(u)
    path = unquote(parsed.path or "")
    m = _TILE_NUMERIC_TAIL_RE.search(path)
    if not m:
        return None
    ext = m.group(4) or ""
    prefix = path[: m.start()].rstrip("/")
    new_path = f"{prefix}/{{z}}/{{x}}/{{y}}{ext}"
    parts = list(parsed)
    parts[2] = new_path if new_path.startswith("/") else f"/{new_path}"
    return urlunparse(parts)


def should_harvest_xyz(base_url: str, service_types: Optional[List[str]] = None) -> bool:
    """True if harvest should run the XYZ branch (explicit type, template URL, or concrete tile URL)."""
    types = [(t or "").lower() for t in (service_types or [])]
    if any(t == "xyz" for t in types):
        return True
    bu = (base_url or "").strip()
    low = bu.lower()
    if "{z}" in low and "{x}" in low and ("{y}" in low or "{-y}" in low):
        return True
    path = unquote(urlparse(bu).path or "")
    return _TILE_NUMERIC_TAIL_RE.search(path) is not None


def _normalize_xyz_tile_template(base_url: str) -> str:
    """Build a Slippy Map XYZ URL template from a root URL or return if already templated.

    - Full sample tile URLs (.../z/x/y.png) → placeholders (query preserved).
    - If the URL already contains {z}/{x}/{y}, returned as-is (trimmed).
    - Otherwise appends /{z}/{x}/{y}.png (common default for raster tiles).
    """
    u = (base_url or "").strip()
    if not u:
        return ""
    lower = u.lower()
    if "{z}" in lower and "{x}" in lower and ("{y}" in lower or "{-y}" in lower):
        return u.rstrip("/") if not urlparse(u).query else u

    concrete = _concrete_tile_url_to_template(u)
    if concrete:
        return concrete

    root = u.rstrip("/")
    return f"{root}/{{z}}/{{x}}/{{y}}.png"


def _fill_xyz_template(template: str, z: int, x: int, y_xyz: int) -> str:
    """Expand placeholders; {-y} uses TMS row compatible with OpenLayers XYZ source."""
    out = template
    if "{-y}" in out:
        out = out.replace("{-y}", str((1 << z) - 1 - y_xyz))
    return out.replace("{z}", str(z)).replace("{x}", str(x)).replace("{y}", str(y_xyz))


def _xyz_template_variants(template: str) -> List[str]:
    """Alternate conventions some tile servers use."""
    seen: set[str] = set()
    ordered: List[str] = []

    def add(t: str) -> None:
        t = t.strip()
        if t and t not in seen:
            seen.add(t)
            ordered.append(t)

    add(template)
    if "/{z}/{x}/{y}" in template:
        add(template.replace("/{z}/{x}/{y}", "/{z}/{y}/{x}"))
    if "{y}" in template and "{-y}" not in template:
        add(template.replace("{y}", "{-y}"))
    return ordered


_XYZ_PROBE_TILES = ((2, 2, 2), (3, 4, 5), (1, 1, 1), (2, 1, 1))


async def _xyz_url_reachable(client: httpx.AsyncClient, url: str) -> bool:
    try:
        r = await client.head(url)
        if r.status_code == 200:
            ct = (r.headers.get("content-type") or "").lower()
            return "image" in ct or ct == "" or "octet-stream" in ct
        if r.status_code == 405:
            g = await client.get(url)
            return g.status_code == 200 and len(g.content) >= 64
        if r.status_code == 404:
            g = await client.get(url)
            return g.status_code == 200 and len(g.content) >= 64
    except httpx.RequestError:
        return False
    return False


async def _probe_xyz_template(template: str) -> tuple[str, str]:
    """Try a few Slippy variants; return (chosen_template, probe_label)."""
    variants = _xyz_template_variants(template)
    async with httpx.AsyncClient(timeout=8.0, verify=False, follow_redirects=True) as client:
        for tmpl in variants:
            for z, x, y in _XYZ_PROBE_TILES:
                filled = _fill_xyz_template(tmpl, z, x, y)
                if await _xyz_url_reachable(client, filled):
                    if tmpl == template:
                        return tmpl, "default"
                    if "{-y}" in tmpl and "{-y}" not in template:
                        return tmpl, "tms"
                    if "/{z}/{y}/{x}" in tmpl:
                        return tmpl, "z_y_x"
                    return tmpl, "variant"
    return template, "unverified"


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

    Accepts:
    - Tile root → ``/\\{z\\}/\\{x\\}/\\{y\\}.png`` appended.
    - Full template with ``\\{z\\}``, ``\\{x\\}``, ``\\{y\\}`` or ``\\{-y\\}``.
    - A **concrete** sample tile URL (``.../4/3/8.png``) → converted to a template.

    Probes the live server with a few zoom/x/y combinations and picks TMS ``\\{-y\\}``
    or ``/\\{z\\}/\\{y\\}/\\{x\\}`` when the default Slippy layout 404s.
    """
    template = _normalize_xyz_tile_template(base_url)
    if not template:
        return []
    chosen, probe = await _probe_xyz_template(template)
    raw = (base_url or "").strip()
    if "{" in raw:
        stem = raw.split("{", 1)[0].rstrip("/")
    else:
        conv = _concrete_tile_url_to_template(raw)
        stem = conv.split("{", 1)[0].rstrip("/") if conv else raw.rstrip("/")
    title = _title_from_xyz_url(stem)
    extra: Dict[str, Any] = {"xyz_probe": probe}
    if chosen != template:
        extra["xyz_template_normalized_from"] = template
    return [
        {
            "source_type": "xyz",
            "url_or_path": chosen,
            "layer_name": None,
            "title": title,
            "status": "draft",
            "srs": "EPSG:3857",
            "format": "image/png",
            "minzoom": 0,
            "maxzoom": 22,
            "bbox": None,
            "extra_metadata": extra,
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
