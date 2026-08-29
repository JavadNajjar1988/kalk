from openpyxl import Workbook

from app.services.excel_scenario_import import build_template_workbook, parse_excel_workbook
from app.services.scenario_import import merge_scenario_content


def _workbook() -> Workbook:
    wb = Workbook()
    scenario = wb.active
    scenario.title = "سناریو"
    scenario.append(["name", "description", "start_time", "time_zone", "symbology_standard"])
    scenario.append(["آزمون", "", "2026-01-01T08:00:00+00:00", "Asia/Tehran", "app6"])

    units = wb.create_sheet("یگان")
    units.append(["id", "name", "parent_id", "side", "unit_type", "time", "lon", "lat"])
    units.append(["u1", "گردان", "", "friend", "tank", "2026-01-01T08:00:00+00:00", 51.4, 35.7])
    units.append(["u2", "گروهان", "u1", "friend", "infantry", "", "", ""])

    equipment = wb.create_sheet("تجهیزات")
    equipment.append(["id", "name", "type", "quantity", "unit_id", "start_time", "lon", "lat"])
    equipment.append(["eq1", "تانک", "تی ۶۴", 2, "u1", "2026-01-01T09:00:00+00:00", 51.5, 35.8])

    personnel = wb.create_sheet("پرسنل")
    personnel.append(["id", "first_name", "last_name", "rank", "specialty", "national_id", "unit_id"])
    personnel.append(["p1", "علی", "رضایی", "سروان", "فرمانده", "", "u1"])

    events = wb.create_sheet("حوادث")
    events.append(["id", "title", "start_time", "side", "unit_ids", "equipment_ids", "lon", "lat"])
    events.append(["ev1", "حرکت", "2026-01-01T09:00:00+00:00", "friend", "u1,u2", "eq1", 51.6, 35.9])

    features = wb.create_sheet("عوارض")
    features.append(["id", "name", "type", "lon", "lat", "radius_m", "start_time", "end_time", "event_id"])
    features.append(["f1", "شهر نمونه", "شهر", 51.7, 36.0, 3000, "", "", "ev1"])
    return wb


def test_parser_builds_orbat_attachments_features_and_storyboard():
    content, errors = parse_excel_workbook(_workbook())

    assert errors == []
    assert content["sides"][0]["id"] == "excel-side-3"
    root = content["sides"][0]["groups"][0]["subUnits"][0]
    assert root["id"] == "u1"
    assert root["sidc"] == "10031000001205000000"
    assert root["subUnits"][0]["id"] == "u2"
    assert root["equipment"] == [{"name": "تانک - تی ۶۴", "count": 2, "description": "تی ۶۴"}]
    assert root["personnel"][0]["name"] == "علی رضایی"
    assert content["equipment"][0]["name"] == "تانک - تی ۶۴"

    layers = {layer["id"]: layer for layer in content["layers"]}
    assert layers["excel-independent-equipment"]["features"][0]["geometry"]["coordinates"] == [51.5, 35.8]
    city = layers["excel-imported-features"]["features"][0]
    assert city["meta"]["type"] == "Circle"
    assert city["meta"]["radius"] == 3000

    event = content["events"][0]
    assert event["involvedUnits"] == ["u1", "u2"]
    assert event["involvedEquipment"] == ["eq1"]
    assert content["storyboard"]["scenes"][0]["camera"]["type"] == "eventWhere"


def test_merge_updates_matching_ids_and_preserves_absent_records():
    existing = {
        "id": "scenario-1",
        "name": "قدیمی",
        "events": [{"id": "ev-old", "title": "ماندگار"}, {"id": "ev1", "title": "قدیمی"}],
        "sides": [],
        "layers": [],
        "equipment": [],
        "personnel": [],
        "mapLayers": [{"id": "map-1"}],
        "storyboard": {"scenes": [], "settings": {}},
    }
    incoming = {
        "id": "temporary",
        "name": "جدید",
        "events": [{"id": "ev1", "title": "به‌روز"}],
        "sides": [],
        "layers": [],
        "equipment": [],
        "personnel": [],
        "mapLayers": [],
        "storyboard": {"scenes": [], "settings": {}},
    }

    merged = merge_scenario_content(existing, incoming)

    assert merged["id"] == "scenario-1"
    assert [event["id"] for event in merged["events"]] == ["ev-old", "ev1"]
    assert merged["events"][1]["title"] == "به‌روز"
    assert merged["mapLayers"] == [{"id": "map-1"}]


def test_download_template_includes_new_columns_and_features_sheet():
    wb = build_template_workbook()

    assert "عوارض" in wb.sheetnames
    assert "زمان‌بندی" in wb.sheetnames
    assert [cell.value for cell in wb["تجهیزات"][1]] == [
        "شناسه", "نام", "نوع", "تعداد", "شناسه_یگان", "شناسه_زمان_شروع", "طول", "عرض"
    ]
    assert "شناسه_یگان" in [cell.value for cell in wb["حوادث"][1]]
    assert [cell.value for cell in wb["یگان‌ها"][1]] == [
        "شناسه", "نام", "طرف", "رده_یگان", "نوع_نماد", "شناسه_والد",
        "وضعیت_نماد", "شناسه_زمان", "طول", "عرض", "کد_نماد_پیشرفته"
    ]
    assert len(wb["یگان‌ها"].data_validations.dataValidation) >= 4
    assert wb["یگان‌ها"][2][1].value == "لشکر ۱۶"
    assert wb["یگان‌ها"][4][5].value == "u2"
    assert wb["یگان‌ها"][5][2].value == "دشمن"
    echelon_values = [wb["فهرست‌های انتخاب"].cell(row, 8).value for row in range(2, 11)]
    assert echelon_values[:4] == ["ارتش", "سپاه", "لشکر", "تیپ"]
    assert wb["زمان‌بندی"]["H2"].value.startswith("=IFERROR")


def test_persian_symbol_selections_generate_sidc_and_advanced_code_overrides():
    wb = Workbook()
    scenario = wb.active
    scenario.title = "سناریو"
    scenario.append(["نام"])
    scenario.append(["آزمون نماد"])

    units = wb.create_sheet("یگان‌ها")
    units.append([
        "شناسه", "نام", "طرف", "نوع_نماد", "رده_یگان", "وضعیت_نماد", "کد_نماد_پیشرفته"
    ])
    units.append(["u1", "گردان زرهی", "دشمن", "زرهی", "گردان / اسکادران", "آسیب‌دیده", ""])
    units.append(["u2", "نماد ویژه", "خودی", "پیاده‌نظام", "دسته / جزء مستقل", "حاضر", "10031000181211000000"])

    content, errors = parse_excel_workbook(wb)

    assert errors == []
    hostile = next(side for side in content["sides"] if side["id"] == "excel-side-6")
    assert hostile["groups"][0]["subUnits"][0]["sidc"] == "10061030161205000000"
    friendly = next(side for side in content["sides"] if side["id"] == "excel-side-3")
    assert friendly["groups"][0]["subUnits"][0]["sidc"] == "10031000181211000000"


def test_persian_headers_and_jalali_time_reference_are_parsed():
    wb = Workbook()
    scenario = wb.active
    scenario.title = "سناریو"
    scenario.append(["نام", "توضیحات", "شناسه_زمان_شروع", "ناحیه_زمانی", "استاندارد_نماد"])
    scenario.append(["آزمون شمسی", "", "زمان-001", "Asia/Tehran", "app6"])

    times = wb.create_sheet("زمان‌بندی")
    times.append(["شناسه_زمان", "سال_شمسی", "ماه_شمسی", "روز_شمسی", "ساعت", "دقیقه", "ناحیه_زمانی"])
    times.append(["زمان-001", 1405, 6, 7, 8, 15, "Asia/Tehran"])

    events = wb.create_sheet("حوادث")
    events.append(["شناسه", "عنوان", "شناسه_زمان_شروع", "طرف", "طول_جغرافیایی", "عرض_جغرافیایی"])
    events.append(["ev-1", "رویداد نمونه", "زمان-001", "خودی", 51.4, 35.7])

    content, errors = parse_excel_workbook(wb)

    assert errors == []
    assert content["startTime"] == "2026-08-29T08:15:00+03:30"
    assert content["events"][0]["startTime"] == "2026-08-29T08:15:00+03:30"
