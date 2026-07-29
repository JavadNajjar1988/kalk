from datetime import datetime, timezone

from app.api.routes.dashboard import _scenario_card, _scenario_content_stats
from app.models.scenario import Scenario


def _scenario(content: dict) -> Scenario:
    now = datetime.now(timezone.utc)
    return Scenario(
        id="scenario-1",
        name="سناریوی آزمایشی",
        description="شرح",
        image=None,
        created=now,
        modified=now,
        content=content,
    )


def test_scenario_content_stats_are_derived_from_saved_kalk_data():
    item = _scenario(
        {
            "sides": [
                {
                    "groups": [
                        {
                            "subUnits": [
                                {"id": "u1", "subUnits": [{"id": "u2"}]},
                            ]
                        }
                    ]
                }
            ],
            "events": [{"id": "e1"}],
            "layers": [{"id": "l1", "features": [{"id": "f1"}, {"id": "f2"}]}],
            "environmentalConditions": [{"id": "c1"}],
            "storyboard": {"scenes": [{"id": "s1"}]},
        }
    )

    assert _scenario_content_stats(item) == {
        "units": 2,
        "events": 1,
        "features": 2,
        "layers": 1,
        "conditions": 1,
        "storyboardScenes": 1,
    }


def test_scenario_card_uses_saved_status_and_image():
    item = _scenario(
        {
            "status": "active",
            "metadata": {"image": "/api/scenarios/images/preview.jpg"},
            "settings": {"map": {"baseMapId": "osm-de"}},
            "mapView": {"center": [51.4, 35.7], "zoom": 9},
            "layers": [
                {
                    "id": "layer-1",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {"type": "Point", "coordinates": [51.4, 35.7]},
                            "properties": {"name": "نقطه آزمایشی"},
                        }
                    ],
                }
            ],
        }
    )

    card = _scenario_card(item)

    assert card["id"] == item.id
    assert card["status"] == "active"
    assert card["image"] == "/api/scenarios/images/preview.jpg"
    assert card["archivedAt"] is None
    assert card["mapPreview"]["baseMapId"] == "osm-de"
    assert card["mapPreview"]["center"] == [51.4, 35.7]
    assert card["mapPreview"]["zoom"] == 9
    assert len(card["mapPreview"]["features"]) == 1


def test_scenario_card_includes_visible_tactical_snapshot_features():
    tactical_feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [5729744.3, 4257980.7]},
        "properties": {"sidc": "SFGPUCI---*****", "t": "گردان یکم"},
    }
    hidden_feature = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [5730000, 4258000]},
        "properties": {"sidc": "SHGPUCI---*****"},
    }
    item = _scenario(
        {
            "metadata": {
                "tacticalSymbols": {
                    "version": 1,
                    "tuples": [
                        ["feature:layer-1/visible", tactical_feature],
                        ["feature:layer-1/hidden", hidden_feature],
                        ["hidden+feature:layer-1/hidden", True],
                    ],
                }
            },
            "layers": [],
        }
    )

    card = _scenario_card(item)

    assert card["contentStats"]["features"] == 1
    assert len(card["mapPreview"]["features"]) == 1
    preview = card["mapPreview"]["features"][0]
    assert preview["properties"]["sidc"] == "SFGPUCI---*****"
    assert preview["properties"]["__dashboardProjection"] == "EPSG:3857"
    assert preview["properties"]["__dashboardSource"] == "tactical"
