"""
Parse standard multi-sheet Excel into ORBAT-mapper scenario dict + validation errors.
Sheet names (case-insensitive, trimmed): سناریو|scenario, حوادث|events, یگان‌ها|units,
تجهیزات|equipment, پرسنل|personnel
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet

# Default SIDC (APP-6 friendly infantry) when unit type unknown
DEFAULT_SIDC = "10031000131211004600"

SIDE_MAP = {
    "friend": "3",
    "friendly": "3",
    "دوست": "3",
    "خودی": "3",
    "blue": "3",
    "hostile": "6",
    "دشمن": "6",
    "enemy": "6",
    "red": "6",
    "neutral": "4",
    "خنثی": "4",
    "unknown": "0",
    "نامشخص": "0",
}

UNIT_TYPE_SIDC = {
    "infantry": "10031000131211004600",
    "پیاده": "10031000131211004600",
    "tank": "10031000151211004600",
    "زرهی": "10031000151211004600",
    "naval": "10033000001205001900",
    "دریایی": "10033000001205001900",
    "air": "10031000161211004600",
    "هوایی": "10031000161211004600",
}


def _norm(s: str | None) -> str:
    if s is None:
        return ""
    return str(s).strip()


def _norm_key(s: str) -> str:
    t = _norm(s).lower()
    t = re.sub(r"\s+", "_", t)
    return t


def _find_sheet(wb, *aliases: str) -> Worksheet | None:
    alias_set = {_norm_key(a) for a in aliases}
    for name in wb.sheetnames:
        if _norm_key(name) in alias_set or _norm(name).lower() in {a.lower() for a in aliases}:
            return wb[name]
    return None


def _header_map(ws: Worksheet) -> tuple[dict[str, int], list[dict[str, Any]]]:
    """Row 1 = headers. Return lowercase_underscore -> col index (1-based), and errors."""
    errors: list[dict[str, Any]] = []
    if ws.max_row is None or ws.max_row < 1:
        return {}, [{"sheet": ws.title, "row": 0, "message": "ورق خالی است"}]
    headers: dict[str, int] = {}
    for col in range(1, ws.max_column + 1):
        val = ws.cell(row=1, column=col).value
        key = _norm_key(str(val) if val is not None else "")
        if key:
            headers[key] = col
    return headers, errors


def _cell(row: tuple[Any, ...], headers: dict[str, int], *keys: str) -> str:
    for k in keys:
        k2 = _norm_key(k)
        if k2 in headers:
            c = headers[k2]
            if c <= len(row):
                v = row[c - 1]
                if v is None:
                    return ""
                return str(v).strip()
    return ""


def _cell_raw(row: tuple[Any, ...], headers: dict[str, int], *keys: str) -> Any:
    for k in keys:
        k2 = _norm_key(k)
        if k2 in headers:
            c = headers[k2]
            if c <= len(row):
                return row[c - 1]
    return None


def _parse_iso_or_ms(val: Any, errors: list, sheet: str, row: int, field: str) -> str | int | None:
    if isinstance(val, datetime):
        return val.isoformat()
    v = _norm(str(val) if val is not None else "")
    if not v:
        return None
    try:
        # numeric epoch ms
        if v.isdigit() and len(v) > 10:
            return int(v)
        # ISO-ish
        datetime.fromisoformat(v.replace("Z", "+00:00"))
        return v.replace("Z", "+00:00") if "Z" in v else v
    except Exception:
        errors.append({"sheet": sheet, "row": row, "message": f"تاریخ/زمان نامعتبر ({field}): {v}"})
        return None


def _validate_lon_lat(lon_s: str, lat_s: str, errors: list, sheet: str, row: int) -> tuple[float | None, float | None]:
    if not lon_s and not lat_s:
        return None, None
    try:
        lon = float(lon_s)
        lat = float(lat_s)
    except ValueError:
        errors.append({"sheet": sheet, "row": row, "message": "مختصات باید عدد باشند"})
        return None, None
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        errors.append({"sheet": sheet, "row": row, "message": "مختصات خارج از محدوده مجاز"})
        return None, None
    return lon, lat


def _read_rows(ws: Worksheet) -> list[tuple[Any, ...]]:
    rows: list[tuple[Any, ...]] = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r is None or all(x is None or str(x).strip() == "" for x in r):
            continue
        rows.append(tuple(r))
    return rows


def parse_excel_workbook(wb) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    errors: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()

    scenario_ws = _find_sheet(wb, "سناریو", "scenario")
    events_ws = _find_sheet(wb, "حوادث", "events")
    units_ws = _find_sheet(wb, "یگان‌ها", "یگان ها", "units", "orbat")
    equip_ws = _find_sheet(wb, "تجهیزات", "equipment")
    pers_ws = _find_sheet(wb, "پرسنل", "personnel")

    if not scenario_ws:
        errors.append({"sheet": "-", "row": 0, "message": "شیت «سناریو» یا scenario یافت نشد"})
        return {}, errors

    sh, _ = _header_map(scenario_ws)
    srows = _read_rows(scenario_ws)
    if not srows:
        errors.append({"sheet": scenario_ws.title, "row": 0, "message": "حداقل یک ردیف داده در شیت سناریو لازم است"})
    row1 = srows[0] if srows else tuple()

    name = _cell(row1, sh, "name", "نام", "عنوان")
    if not name:
        errors.append({"sheet": scenario_ws.title, "row": 2, "message": "نام سناریو الزامی است"})

    description = _cell(row1, sh, "description", "توضیح", "توضیحات")
    start_raw = _cell_raw(row1, sh, "start_time", "starttime", "زمان_شروع", "تاریخ_شروع")
    time_zone = _cell(row1, sh, "time_zone", "timezone", "منطقه_زمانی") or "UTC"
    sym = _cell(row1, sh, "symbology_standard", "symbology", "استاندارد_نماد") or "app6"

    start_time = _parse_iso_or_ms(start_raw, errors, scenario_ws.title, 2, "start_time")
    if start_time is None and start_raw:
        pass
    elif start_time is None:
        start_time = int(datetime.now(timezone.utc).timestamp() * 1000)

    events: list[dict[str, Any]] = []
    if events_ws:
        eh, _ = _header_map(events_ws)
        for i, er in enumerate(_read_rows(events_ws), start=2):
            eid = _cell(er, eh, "id", "شناسه") or f"ev-{uuid.uuid4().hex[:12]}"
            title = _cell(er, eh, "title", "عنوان")
            if not title:
                errors.append({"sheet": events_ws.title, "row": i, "message": "عنوان رویداد خالی است"})
                continue
            sub = _cell(er, eh, "subtitle", "sub_title", "زیرعنوان")
            st = _cell_raw(er, eh, "start_time", "starttime", "زمان", "تاریخ")
            st_parsed = _parse_iso_or_ms(st, errors, events_ws.title, i, "start_time")
            if st_parsed is None:
                st_parsed = now
            lon_s = _cell(er, eh, "lon", "longitude", "طول", "طول_جغرافیایی")
            lat_s = _cell(er, eh, "lat", "latitude", "عرض", "عرض_جغرافیایی")
            lon, lat = _validate_lon_lat(lon_s, lat_s, errors, events_ws.title, i)
            ev: dict[str, Any] = {"id": eid, "title": title, "startTime": st_parsed}
            if sub:
                ev["subTitle"] = sub
            if lon is not None and lat is not None:
                ev["where"] = {
                    "type": "geometry",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat],
                    },
                }
            events.append(ev)

    sides: list[dict[str, Any]] = []
    if units_ws:
        uh, _ = _header_map(units_ws)
        raw_units: list[dict[str, Any]] = []
        for i, ur in enumerate(_read_rows(units_ws), start=2):
            uid = _cell(ur, uh, "id", "شناسه")
            uname = _cell(ur, uh, "name", "نام")
            if not uname:
                errors.append({"sheet": units_ws.title, "row": i, "message": "نام یگان خالی است"})
                continue
            if not uid:
                uid = f"u-{uuid.uuid4().hex[:10]}"
            parent = _cell(ur, uh, "parent_id", "parentid", "والد", "id_والد")
            side_raw = _cell(ur, uh, "side", "طرف", "جبهه") or "friend"
            sk = _norm_key(side_raw)
            std_id = SIDE_MAP.get(sk) or SIDE_MAP.get(side_raw.strip().lower()) or "3"
            utype = _norm_key(_cell(ur, uh, "unit_type", "type", "نوع", "نوع_واحد"))
            sidc = UNIT_TYPE_SIDC.get(utype, DEFAULT_SIDC)
            t_s = _cell_raw(ur, uh, "time", "t", "زمان")
            t_parsed = _parse_iso_or_ms(t_s, errors, units_ws.title, i, "time") if t_s is not None and str(t_s).strip() != "" else None
            lon_s = _cell(ur, uh, "lon", "longitude", "طول")
            lat_s = _cell(ur, uh, "lat", "latitude", "عرض")
            lon, lat = _validate_lon_lat(lon_s, lat_s, errors, units_ws.title, i)
            st_list: list[dict[str, Any]] = []
            if t_parsed or lon is not None:
                loc = [lon, lat] if lon is not None and lat is not None else None
                st_list.append({"t": t_parsed or now, "location": loc, "id": f"s-{uuid.uuid4().hex[:10]}"})
            raw_units.append(
                {
                    "id": uid,
                    "name": uname,
                    "parent_id": parent or None,
                    "standard_identity": std_id,
                    "sidc": sidc,
                    "state": st_list,
                    "subUnits": [],
                }
            )

        by_id = {u["id"]: u for u in raw_units}
        roots: list[dict[str, Any]] = []
        for u in raw_units:
            pid = u.get("parent_id")
            if pid and pid in by_id:
                by_id[pid].setdefault("subUnits", []).append(u)
            else:
                roots.append(u)
        for u in raw_units:
            u.pop("parent_id", None)
        sides_map: dict[str, list[dict[str, Any]]] = {}
        for r in roots:
            sid = r["standard_identity"]
            sides_map.setdefault(sid, []).append(r)
        for std_id, subs in sides_map.items():
            sides.append(
                {
                    "id": f"side-{std_id}-{uuid.uuid4().hex[:8]}",
                    "name": "Friendly" if std_id == "3" else "Hostile" if std_id == "6" else f"Side-{std_id}",
                    "standardIdentity": std_id,
                    "groups": [{"id": f"g-{uuid.uuid4().hex[:8]}", "name": "Group", "subUnits": subs}],
                }
            )

    equipment: list[dict[str, Any]] = []
    if equip_ws:
        eh, _ = _header_map(equip_ws)
        for i, er in enumerate(_read_rows(equip_ws), start=2):
            ename = _cell(er, eh, "name", "نام")
            if not ename:
                continue
            qty_raw = _cell(er, eh, "quantity", "تعداد", "count") or "1"
            try:
                quantity = int(float(qty_raw))
            except ValueError:
                quantity = 1
                errors.append({"sheet": equip_ws.title, "row": i, "message": f"تعداد نامعتبر: {qty_raw}"})
            equipment.append(
                {
                    "id": _cell(er, eh, "id", "شناسه") or f"eq-{uuid.uuid4().hex[:10]}",
                    "name": ename,
                    "type": _cell(er, eh, "type", "نوع") or "general",
                    "quantity": quantity,
                    "unitId": _cell(er, eh, "unit_id", "id_یگان", "یگان"),
                }
            )

    personnel: list[dict[str, Any]] = []
    if pers_ws:
        ph, _ = _header_map(pers_ws)
        for i, pr in enumerate(_read_rows(pers_ws), start=2):
            fn = _cell(pr, ph, "first_name", "نام")
            ln = _cell(pr, ph, "last_name", "نام_خانوادگی", "فامیلی")
            full = _cell(pr, ph, "full_name", "نام_کامل")
            if not fn and not ln and full:
                parts = full.split(maxsplit=1)
                fn = parts[0]
                ln = parts[1] if len(parts) > 1 else ""
            if not fn and not ln:
                continue
            personnel.append(
                {
                    "id": _cell(pr, ph, "id", "شناسه") or f"p-{uuid.uuid4().hex[:10]}",
                    "firstName": fn,
                    "lastName": ln,
                    "rank": _cell(pr, ph, "rank", "درجه"),
                    "specialty": _cell(pr, ph, "specialty", "position", "تخصص", "سمت"),
                    "nationalId": _cell(pr, ph, "national_id", "کد_ملی", "nationalid"),
                    "unitId": _cell(pr, ph, "unit_id", "id_یگان", "یگان"),
                }
            )

    scenario_id = str(uuid.uuid4())
    layer_id = f"layer-{uuid.uuid4().hex[:12]}"
    content: dict[str, Any] = {
        "id": scenario_id,
        "type": "ORBAT-mapper",
        "version": "0.40.0",
        "name": name or "Imported scenario",
        "description": description or "",
        "startTime": start_time,
        "timeZone": time_zone,
        "symbologyStandard": sym,
        "sides": sides,
        "events": events,
        "layers": [{"id": layer_id, "name": "Features", "features": []}],
        "mapLayers": [],
        "equipment": equipment,
        "personnel": personnel,
        "supplyCategories": [],
        "settings": {
            "rangeRingGroups": [],
            "statuses": [],
            "supplyClasses": [
                {"name": "Class I"},
                {"name": "Class II"},
                {"name": "Class III"},
                {"name": "Class IV"},
                {"name": "Class V"},
            ],
            "supplyUoMs": [
                {"name": "Kilogram", "code": "KG", "type": "weight"},
                {"name": "Each", "code": "EA", "type": "quantity"},
            ],
            "map": {"baseMapId": "osm"},
        },
        "meta": {"createdDate": now, "lastModifiedDate": now},
        "metadata": {"source": "excel-import"},
    }
    return content, errors


def build_template_workbook() -> Workbook:
    wb = Workbook()
    # سناریو
    ws0 = wb.active
    ws0.title = "سناریو"
    ws0.append(
        ["name", "description", "start_time", "time_zone", "symbology_standard"]
    )
    ws0.append(["نمونه عملیات", "توضیح کوتاه", "2024-01-01T12:00:00+00:00", "Asia/Tehran", "app6"])

    ws1 = wb.create_sheet("حوادث")
    ws1.append(["id", "title", "subtitle", "start_time", "lon", "lat"])
    ws1.append(["ev-1", "شروع عملیات", "", "2024-01-02T08:00:00+00:00", "51.4", "35.7"])

    ws2 = wb.create_sheet("یگان‌ها")
    ws2.append(["id", "name", "parent_id", "side", "unit_type", "time", "lon", "lat"])
    ws2.append(["u1", "گردان ۱", "", "friend", "infantry", "2024-01-01T12:00:00+00:00", "51.41", "35.71"])
    ws2.append(["u2", "گروهان الف", "u1", "friend", "infantry", "", "", ""])

    ws3 = wb.create_sheet("تجهیزات")
    ws3.append(["id", "name", "type", "quantity", "unit_id"])
    ws3.append(["eq1", "تانک", "tank", "2", "u1"])

    ws4 = wb.create_sheet("پرسنل")
    ws4.append(["id", "first_name", "last_name", "rank", "specialty", "national_id", "unit_id"])
    ws4.append(["p1", "علی", "رضایی", "سروان", "فرمانده", "0011111111", "u1"])

    return wb


# ---------------------------------------------------------------------------
# Standard sheet definitions (used by transform + export)
# ---------------------------------------------------------------------------

_STANDARD_SHEETS: dict[str, list[str]] = {
    "scenario": ["name", "description", "start_time", "time_zone", "symbology_standard"],
    "events": ["id", "title", "subtitle", "start_time", "lon", "lat"],
    "units": ["id", "name", "parent_id", "side", "unit_type", "time", "lon", "lat"],
    "equipment": ["id", "name", "type", "quantity", "unit_id"],
    "personnel": ["id", "first_name", "last_name", "rank", "specialty", "national_id", "unit_id"],
}

# Maps AI targetSheet names (lowercase) to canonical Persian sheet names
_TARGET_TO_SHEET_TITLE: dict[str, str] = {
    "scenario": "سناریو",
    "events": "حوادث",
    "units": "یگان‌ها",
    "equipment": "تجهیزات",
    "personnel": "پرسنل",
}


def transform_workbook_with_mapping(wb, mapping: dict[str, Any]) -> Workbook:
    """
    Given an arbitrary workbook and an AI mapping dict (sheetMappings + columnMaps),
    produce a new standard-format workbook that parse_excel_workbook() can consume.

    mapping shape:
      {
        "sheetMappings": [{"sourceSheet": "...", "targetSheet": "scenario|events|units|equipment|personnel", "confidence": 0-1}],
        "columnMaps": [{"targetSheet": "...", "mappings": [{"fromHeader": "...", "toField": "..."}]}]
      }
    """
    sheet_mappings: list[dict[str, Any]] = mapping.get("sheetMappings") or []
    column_maps: list[dict[str, Any]] = mapping.get("columnMaps") or []

    # Build lookup: targetSheet (lower) -> sourceSheetName
    source_for_target: dict[str, str] = {}
    for sm in sheet_mappings:
        t = _norm_key(sm.get("targetSheet") or "")
        s = _norm(sm.get("sourceSheet") or "")
        if t and s:
            source_for_target[t] = s

    # Build lookup: targetSheet -> {toField (lower) -> fromHeader (original)}
    col_map_for_target: dict[str, dict[str, str]] = {}
    for cm in column_maps:
        t = _norm_key(cm.get("targetSheet") or "")
        if not t:
            continue
        field_map: dict[str, str] = {}
        for m in cm.get("mappings") or []:
            to = _norm_key(m.get("toField") or "")
            frm = _norm(m.get("fromHeader") or "")
            if to and frm:
                field_map[to] = frm
        col_map_for_target[t] = field_map

    new_wb = Workbook()
    first = True

    for target_key, std_headers in _STANDARD_SHEETS.items():
        sheet_title = _TARGET_TO_SHEET_TITLE[target_key]
        if first:
            ws_new = new_wb.active
            ws_new.title = sheet_title
            first = False
        else:
            ws_new = new_wb.create_sheet(sheet_title)

        ws_new.append(std_headers)

        source_name = source_for_target.get(target_key)
        if not source_name:
            continue

        # Find source worksheet by name (case-insensitive)
        source_ws = None
        for sn in wb.sheetnames:
            if _norm(sn).lower() == _norm(source_name).lower():
                source_ws = wb[sn]
                break
        if source_ws is None:
            continue

        # Read source headers
        src_headers: dict[str, int] = {}
        for col in range(1, source_ws.max_column + 1):
            val = source_ws.cell(row=1, column=col).value
            key = _norm_key(str(val) if val is not None else "")
            if key:
                src_headers[key] = col

        field_map = col_map_for_target.get(target_key) or {}

        # For each source data row, build a standard row
        for row_cells in source_ws.iter_rows(min_row=2, values_only=True):
            if all(x is None or str(x).strip() == "" for x in row_cells):
                continue
            row_list = list(row_cells)

            std_row: list[Any] = []
            for field in std_headers:
                field_key = _norm_key(field)
                # Look up the original header that maps to this standard field
                from_header = field_map.get(field_key)
                value = None
                if from_header:
                    from_key = _norm_key(from_header)
                    if from_key in src_headers:
                        col_idx = src_headers[from_key] - 1
                        value = row_list[col_idx] if col_idx < len(row_list) else None
                std_row.append(value)

            ws_new.append(std_row)

    return new_wb


def export_content_to_workbook(content: dict[str, Any]) -> Workbook:
    """
    Convert a parsed scenario content dict back into a standard Excel workbook.
    Useful for downloading the standardized version after AI import.
    """
    wb = Workbook()

    # --- سناریو ---
    ws0 = wb.active
    ws0.title = "سناریو"
    ws0.append(["name", "description", "start_time", "time_zone", "symbology_standard"])
    ws0.append([
        content.get("name") or "",
        content.get("description") or "",
        content.get("startTime") or "",
        content.get("timeZone") or "UTC",
        content.get("symbologyStandard") or "app6",
    ])

    # --- حوادث ---
    ws1 = wb.create_sheet("حوادث")
    ws1.append(["id", "title", "subtitle", "start_time", "lon", "lat"])
    for ev in content.get("events") or []:
        geo = ev.get("where", {})
        coords = geo.get("geometry", {}).get("coordinates") if isinstance(geo, dict) else None
        lon = coords[0] if coords and len(coords) >= 2 else ""
        lat = coords[1] if coords and len(coords) >= 2 else ""
        ws1.append([
            ev.get("id") or "",
            ev.get("title") or "",
            ev.get("subTitle") or "",
            ev.get("startTime") or "",
            lon,
            lat,
        ])

    # --- یگان‌ها ---
    ws2 = wb.create_sheet("یگان‌ها")
    ws2.append(["id", "name", "parent_id", "side", "unit_type", "time", "lon", "lat"])
    _side_std_to_label = {"3": "friend", "6": "hostile", "4": "neutral", "0": "unknown"}

    def _flatten_units(units: list, parent_id: str = "") -> None:
        for u in units or []:
            std_id = u.get("standard_identity") or u.get("standardIdentity") or "3"
            side_label = _side_std_to_label.get(std_id, "friend")
            # Find unit_type from sidc (best-effort reverse)
            sidc = u.get("sidc") or ""
            unit_type = next(
                (k for k, v in UNIT_TYPE_SIDC.items() if v == sidc and not k.startswith("ز") and not k.startswith("د") and not k.startswith("پ") and not k.startswith("ه")),
                "infantry",
            )
            state0 = u.get("state", [{}])[0] if u.get("state") else {}
            loc = state0.get("location") or []
            lon = loc[0] if len(loc) >= 2 else ""
            lat = loc[1] if len(loc) >= 2 else ""
            ws2.append([
                u.get("id") or "",
                u.get("name") or "",
                parent_id,
                side_label,
                unit_type,
                state0.get("t") or "",
                lon,
                lat,
            ])
            _flatten_units(u.get("subUnits") or [], u.get("id") or "")

    for side in content.get("sides") or []:
        for group in side.get("groups") or []:
            _flatten_units(group.get("subUnits") or [])

    # --- تجهیزات ---
    ws3 = wb.create_sheet("تجهیزات")
    ws3.append(["id", "name", "type", "quantity", "unit_id"])
    for eq in content.get("equipment") or []:
        ws3.append([
            eq.get("id") or "",
            eq.get("name") or "",
            eq.get("type") or "",
            eq.get("quantity") or 1,
            eq.get("unitId") or "",
        ])

    # --- پرسنل ---
    ws4 = wb.create_sheet("پرسنل")
    ws4.append(["id", "first_name", "last_name", "rank", "specialty", "national_id", "unit_id"])
    for p in content.get("personnel") or []:
        ws4.append([
            p.get("id") or "",
            p.get("firstName") or "",
            p.get("lastName") or "",
            p.get("rank") or "",
            p.get("specialty") or "",
            p.get("nationalId") or "",
            p.get("unitId") or "",
        ])

    return wb


def parse_resources_workbook(wb) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """
    فقط شیت‌های تجهیزات و پرسنل؛ خروجی برای ادغام در داشبورد (ساختار نزدیک به JSON محلی).
    """
    errors: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()
    equip_ws = _find_sheet(wb, "تجهیزات", "equipment")
    pers_ws = _find_sheet(wb, "پرسنل", "personnel")
    if not equip_ws and not pers_ws:
        errors.append({"sheet": "-", "row": 0, "message": "هیچ شیت تجهیزات یا پرسنل یافت نشد"})
        return [], [], errors

    equipment_out: list[dict[str, Any]] = []
    if equip_ws:
        eh, _ = _header_map(equip_ws)
        for i, er in enumerate(_read_rows(equip_ws), start=2):
            ename = _cell(er, eh, "name", "نام")
            if not ename:
                continue
            eid = _cell(er, eh, "id", "شناسه") or f"EQ-{uuid.uuid4().hex[:8]}"
            code = _cell(er, eh, "equipment_code", "کد", "equipmentcode") or eid
            unit_ref = _cell(er, eh, "unit_id", "id_یگان", "یگان", "assigned_to")
            equipment_out.append(
                {
                    "id": eid,
                    "equipmentCode": code,
                    "name": ename,
                    "type": _cell(er, eh, "type", "نوع") or "عمومی",
                    "model": _cell(er, eh, "model", "مدل") or None,
                    "manufacturer": _cell(er, eh, "manufacturer", "سازنده") or None,
                    "serialNumber": _cell(er, eh, "serial_number", "سریال") or None,
                    "acquisitionDate": _cell(er, eh, "acquisition_date", "تاریخ_خرید") or now[:10],
                    "condition": "excellent",
                    "location": _cell(er, eh, "location", "مکان") or unit_ref or "",
                    "assignedTo": unit_ref or None,
                    "status": "available",
                    "createdAt": now,
                    "updatedAt": now,
                }
            )

    personnel_out: list[dict[str, Any]] = []
    if pers_ws:
        ph, _ = _header_map(pers_ws)
        for i, pr in enumerate(_read_rows(pers_ws), start=2):
            fn = _cell(pr, ph, "first_name", "نام")
            ln = _cell(pr, ph, "last_name", "نام_خانوادگی", "فامیلی")
            full = _cell(pr, ph, "full_name", "نام_کامل")
            if not fn and not ln and full:
                parts = full.split(maxsplit=1)
                fn = parts[0]
                ln = parts[1] if len(parts) > 1 else ""
            if not fn and not ln:
                continue
            pid = _cell(pr, ph, "id", "شناسه") or f"person-{uuid.uuid4().hex[:8]}"
            pcode = _cell(pr, ph, "personal_code", "کد_پرسنلی", "personalcode") or pid
            personnel_out.append(
                {
                    "id": pid,
                    "personalCode": pcode,
                    "firstName": fn,
                    "lastName": ln or "",
                    "nationalId": _cell(pr, ph, "national_id", "کد_ملی", "nationalid") or "",
                    "rank": _cell(pr, ph, "rank", "درجه") or "",
                    "unit": _cell(pr, ph, "unit_id", "id_یگان", "یگان", "unit") or "",
                    "position": _cell(pr, ph, "specialty", "position", "تخصص", "سمت") or None,
                    "phoneNumber": _cell(pr, ph, "phone", "تلفن") or None,
                    "email": _cell(pr, ph, "email", "ایمیل") or None,
                    "status": "active",
                    "startDate": _cell(pr, ph, "start_date", "تاریخ_شروع") or now[:10],
                    "createdAt": now,
                    "updatedAt": now,
                }
            )

    return personnel_out, equipment_out, errors
