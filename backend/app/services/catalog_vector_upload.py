"""Convert uploaded vector files (Shapefile ZIP, GeoJSON, GPX) to GeoJSON for catalog serving."""

from __future__ import annotations

import io
import json
import tempfile
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

import shapefile
from pyproj import CRS, Transformer

MAX_UPLOAD_BYTES = 80 * 1024 * 1024  # 80 MiB


class VectorConversionError(ValueError):
    pass


def _transform_geometry(geom: dict[str, Any], transformer: Transformer) -> None:
    gtype = geom.get("type")
    coords = geom.get("coordinates")
    if gtype == "GeometryCollection":
        for g in geom.get("geometries") or []:
            _transform_geometry(g, transformer)
        return
    if coords is None:
        return

    def transform_coords(o: Any) -> Any:
        # Point coordinate: [x,y] / (x,y) / [x,y,z] / (x,y,z)
        if isinstance(o, (list, tuple)) and len(o) >= 2 and isinstance(o[0], (int, float)) and isinstance(o[1], (int, float)):
            x, y = transformer.transform(float(o[0]), float(o[1]))
            # preserve any extra dimensions (z/m) as-is
            rest = list(o[2:]) if len(o) > 2 else []
            return [x, y, *rest]

        if isinstance(o, (list, tuple)):
            return [transform_coords(v) for v in o]

        return o

    geom["coordinates"] = transform_coords(coords)


def _bbox_from_fc(fc: dict[str, Any]) -> list[float] | None:
    xs: list[float] = []
    ys: list[float] = []

    def collect_geom(g: dict[str, Any] | None) -> None:
        if not g:
            return
        t = g.get("type")
        coords = g.get("coordinates")
        if t == "GeometryCollection":
            for sg in g.get("geometries") or []:
                collect_geom(sg)
            return

        def walk(o: Any) -> None:
            if isinstance(o, (list, tuple)):
                if len(o) >= 2 and isinstance(o[0], (int, float)) and isinstance(o[1], (int, float)):
                    xs.append(float(o[0]))
                    ys.append(float(o[1]))
                else:
                    for item in o:
                        walk(item)

        walk(coords)

    for feat in fc.get("features") or []:
        collect_geom(feat.get("geometry"))
    if not xs or not ys:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def _geojson_from_shapefile(
    shp_path: Path,
    prj_text: str | None,
    crs_epsg: int | None = None,
) -> dict[str, Any]:
    reader = shapefile.Reader(str(shp_path))
    try:
        fields = reader.fields[1:]
        features: list[dict[str, Any]] = []

        for sr in reader.iterShapeRecords():
            shape = sr.shape
            geom = dict(shape.__geo_interface__)
            props: dict[str, Any] = {}
            row = list(sr.record)
            for i, fdef in enumerate(fields):
                raw_name = fdef[0]
                name = (
                    raw_name.decode("utf-8", errors="replace").strip("\x00").strip()
                    if isinstance(raw_name, bytes)
                    else str(raw_name).strip("\x00").strip()
                )
                props[name] = _json_safe(row[i]) if i < len(row) else None

            features.append({"type": "Feature", "geometry": geom, "properties": props})

        fc: dict[str, Any] = {"type": "FeatureCollection", "features": features}

        def _project_to_wgs84(source: CRS, label: str) -> None:
            try:
                tr = Transformer.from_crs(source, CRS.from_epsg(4326), always_xy=True)
                for feat in fc["features"]:
                    g = feat.get("geometry")
                    if isinstance(g, dict):
                        _transform_geometry(g, tr)
            except Exception as e:
                raise VectorConversionError(f"خطا در تبدیل {label} به WGS84: {e}") from e

        if prj_text and prj_text.strip():
            try:
                crs_src = CRS.from_wkt(prj_text.strip())
            except Exception as e:
                raise VectorConversionError(f"خطا در خواندن CRS از فایل .prj: {e}") from e
            _project_to_wgs84(crs_src, ".prj")
        elif crs_epsg is not None:
            try:
                src = CRS.from_epsg(int(crs_epsg))
            except Exception as e:
                raise VectorConversionError(f"crs_epsg نامعتبر است: {e}") from e
            _project_to_wgs84(src, f"EPSG:{crs_epsg}")
        else:
            bbox = _bbox_from_fc(fc)
            if bbox:
                mx = max(abs(bbox[0]), abs(bbox[2]))
                my = max(abs(bbox[1]), abs(bbox[3]))
                if mx > 180 or my > 90 or mx > 1e6 or my > 1e6:
                    raise VectorConversionError(
                        "Shapefile پیش‌شماره‌شده بدون .prj است. یا فایل .prj را در ZIP قرار دهید یا در فرم آپلود کد EPSG (مثل 32639 برای UTM ایران) را وارد کنید."
                    )

        return fc
    finally:
        reader.close()


def _json_safe(v: Any) -> Any:
    if isinstance(v, (bytes, bytearray)):
        return v.decode("utf-8", errors="replace")
    if isinstance(v, (list, tuple)):
        return [_json_safe(x) for x in v]
    return v


def parse_geojson_bytes(raw: bytes) -> dict[str, Any]:
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise VectorConversionError(f"GeoJSON نامعتبر: {e}") from e
    if not isinstance(data, dict):
        raise VectorConversionError("GeoJSON باید یک آبجکت JSON باشد.")
    t = data.get("type")
    if t == "FeatureCollection":
        return data
    if t == "Feature":
        return {"type": "FeatureCollection", "features": [data]}
    if "coordinates" in data and "type" in data:
        return {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "geometry": data, "properties": {}}],
        }
    raise VectorConversionError("نوع GeoJSON پشتیبانی نمی‌شود (FeatureCollection / Feature / Geometry لازم است).")


def gpx_bytes_to_geojson(raw: bytes) -> dict[str, Any]:
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        raise VectorConversionError(f"GPX نامعتبر: {e}") from e

    points: list[list[float]] = []
    for el in root.iter():
        tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
        if tag in ("trkpt", "rtept", "wpt"):
            try:
                lat = float(el.attrib["lat"])
                lon = float(el.attrib["lon"])
                points.append([lon, lat])
            except (KeyError, ValueError):
                continue

    if not points:
        raise VectorConversionError("در GPX هیچ نقطه‌ای (trkpt/wpt/rtept) یافت نشد.")

    if len(points) == 1:
        geom: dict[str, Any] = {"type": "Point", "coordinates": points[0]}
    else:
        geom = {"type": "LineString", "coordinates": points}

    return {
        "type": "FeatureCollection",
        "features": [{"type": "Feature", "geometry": geom, "properties": {}}],
    }


def shapefile_zip_to_geojson(zip_bytes: bytes, crs_epsg: int | None = None) -> dict[str, Any]:
    if len(zip_bytes) > MAX_UPLOAD_BYTES:
        raise VectorConversionError("حجم فایل ZIP بیش از حد مجاز است.")

    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile as e:
        raise VectorConversionError("فایل ZIP معتبر نیست.") from e

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for member in zf.infolist():
            if member.is_dir():
                continue
            dest = (tmp_path / member.filename).resolve()
            try:
                dest.relative_to(tmp_path.resolve())
            except ValueError:
                raise VectorConversionError("مسیر ناامن در ZIP.") from None
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member, "r") as src, open(dest, "wb") as out:
                out.write(src.read())

        shp_files = sorted(tmp_path.rglob("*.shp"))
        if not shp_files:
            raise VectorConversionError("در ZIP هیچ فایل .shp یافت نشد.")

        shp_path = shp_files[0]
        prj_path = shp_path.with_suffix(".prj")
        prj_text = None
        if prj_path.is_file():
            prj_text = prj_path.read_text(encoding="utf-8", errors="ignore")

        return _geojson_from_shapefile(shp_path, prj_text, crs_epsg=crs_epsg)


def write_geojson_file(fc: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(fc, ensure_ascii=False), encoding="utf-8")
