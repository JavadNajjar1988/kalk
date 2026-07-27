from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.api.routes.scenarios import _normalize_scenario_datetime
from app.schemas.scenario import ScenarioCreate


def test_scenario_schema_normalizes_iso_dates_to_utc() -> None:
    scenario = ScenarioCreate(
        name="schedule-test",
        start_time="2026-07-26T00:00:00+03:30",
    )

    assert scenario.start_time == datetime(2026, 7, 25, 20, 30, tzinfo=timezone.utc)


def test_scenario_schema_rejects_dates_without_timezone() -> None:
    with pytest.raises(ValidationError):
        ScenarioCreate(name="schedule-test", start_time="2026-07-26T00:00:00")


def test_orbat_millisecond_timestamp_is_normalized_to_utc() -> None:
    normalized = _normalize_scenario_datetime(1785011400000, "startTime")

    assert normalized == datetime(2026, 7, 25, 20, 30, tzinfo=timezone.utc)
