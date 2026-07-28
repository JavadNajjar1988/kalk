from app.services.scenario_history import build_content_history_diff


def tactical_feature(name: str, coordinates: list[float]) -> dict:
    return {
        "type": "Feature",
        "name": name,
        "geometry": {"type": "Point", "coordinates": coordinates},
        "properties": {"sidc": "GFGPG-----*****"},
    }


def scenario_content(
    *,
    tactical_coordinates: list[float],
    unit_coordinates: list[float],
) -> dict:
    return {
        "metadata": {
            "tacticalSymbols": {
                "version": 1,
                "tuples": [
                    [
                        "feature:operational-layer/symbol-1",
                        tactical_feature("محور عملیاتی", tactical_coordinates),
                    ]
                ],
            }
        },
        "layers": [
            {
                "id": "areas",
                "name": "مناطق عملیاتی",
                "features": [
                    {
                        "id": "area-1",
                        "type": "Feature",
                        "meta": {"name": "منطقه شلمچه"},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [47.5, 30.5],
                                    [48.5, 30.5],
                                    [48.5, 31.5],
                                    [47.5, 31.5],
                                    [47.5, 30.5],
                                ]
                            ],
                        },
                    }
                ],
            }
        ],
        "sides": [
            {
                "id": "blue",
                "name": "خودی",
                "groups": [
                    {
                        "id": "group-1",
                        "name": "یگان‌ها",
                        "subUnits": [
                            {
                                "id": "unit-1",
                                "name": "گردان ۱۲۲",
                                "sidc": "10031000161211000000",
                                "state": [
                                    {
                                        "id": "state-1",
                                        "t": "2026-01-01T00:00:00Z",
                                        "location": unit_coordinates,
                                    }
                                ],
                            }
                        ],
                    }
                ],
            }
        ],
    }


def test_content_diff_reports_tactical_and_unit_movements_with_region():
    previous = scenario_content(
        tactical_coordinates=[48.0, 31.0],
        unit_coordinates=[48.1, 31.1],
    )
    current = scenario_content(
        tactical_coordinates=[49.0, 32.0],
        unit_coordinates=[48.2, 31.2],
    )

    result = build_content_history_diff(previous, current)

    assert result["summary"]["total"] == 2
    tactical = next(
        change
        for change in result["changes"]
        if change["category"] == "tactical_symbol"
    )
    assert tactical["operation"] == "moved"
    assert tactical["name"] == "محور عملیاتی"
    assert tactical["previous_region"] == "منطقه شلمچه"
    assert tactical["previous_location"] == {"lon": 48.0, "lat": 31.0}
    assert tactical["location"] == {"lon": 49.0, "lat": 32.0}

    unit = next(
        change for change in result["changes"] if change["category"] == "unit"
    )
    assert unit["operation"] == "moved"
    assert unit["name"] == "گردان ۱۲۲"
    assert unit["side"] == "خودی"
    assert unit["region"] == "منطقه شلمچه"


def test_content_diff_reports_added_and_removed_map_features():
    previous = {
        "layers": [
            {
                "id": "roads",
                "name": "محورهای مواصلاتی",
                "features": [
                    {
                        "id": "old-road",
                        "meta": {"name": "جاده قدیم"},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [[48.0, 31.0], [48.1, 31.1]],
                        },
                    }
                ],
            }
        ]
    }
    current = {
        "layers": [
            {
                "id": "roads",
                "name": "محورهای مواصلاتی",
                "features": [
                    {
                        "id": "new-road",
                        "meta": {"name": "جاده جدید"},
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [[48.2, 31.2], [48.3, 31.3]],
                        },
                    }
                ],
            }
        ]
    }

    result = build_content_history_diff(previous, current)

    assert result["summary"] == {
        "added": 1,
        "removed": 1,
        "moved": 0,
        "edited": 0,
        "total": 2,
    }
    assert {change["operation"] for change in result["changes"]} == {
        "added",
        "removed",
    }
    assert all(
        change["layer"] == "محورهای مواصلاتی" for change in result["changes"]
    )
