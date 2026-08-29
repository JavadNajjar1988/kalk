from app.services.map_scenario_assignments import (
    filter_catalog_for_scenario,
    normalize_scenario_ids,
)


def test_normalize_scenario_ids_removes_empty_and_duplicate_values():
    assert normalize_scenario_ids([" scenario-a ", "", "scenario-a", "scenario-b"]) == [
        "scenario-a",
        "scenario-b",
    ]


def test_catalog_filter_only_returns_layers_assigned_to_scenario():
    payload = {
        "catalog_version": "v1",
        "layers": [
            {"id": "assigned", "admin": {"scenario_ids": ["scenario-a"]}},
            {"id": "other", "admin": {"scenario_ids": ["scenario-b"]}},
            {"id": "legacy", "admin": {}},
        ],
    }

    filtered = filter_catalog_for_scenario(payload, "scenario-a")

    assert [layer["id"] for layer in filtered["layers"]] == ["assigned"]
    assert filter_catalog_for_scenario(payload, None) is payload
