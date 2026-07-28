from datetime import datetime, timedelta, timezone

from app.api.routes.scenarios import _scenario_versions_match
from app.schemas.scenario import ScenarioUpdate


def test_scenario_update_normalizes_expected_version_to_utc() -> None:
    payload = ScenarioUpdate(expected_modified="2026-07-28T11:30:00+03:30")

    assert payload.expected_modified == datetime(
        2026, 7, 28, 8, 0, tzinfo=timezone.utc
    )


def test_scenario_versions_match_across_timezone_offsets() -> None:
    actual = datetime(2026, 7, 28, 8, 0, tzinfo=timezone.utc)
    expected = datetime(
        2026,
        7,
        28,
        11,
        30,
        tzinfo=timezone(timedelta(hours=3, minutes=30)),
    )

    assert _scenario_versions_match(actual, expected)


def test_scenario_versions_reject_stale_editor_version() -> None:
    actual = datetime(2026, 7, 28, 8, 1, tzinfo=timezone.utc)
    expected = datetime(2026, 7, 28, 8, 0, tzinfo=timezone.utc)

    assert not _scenario_versions_match(actual, expected)
