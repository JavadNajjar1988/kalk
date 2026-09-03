import { describe, expect, it } from "vitest";
import type { NScenarioEvent } from "@/types/internalModels";
import {
  filterScenarioEventsByTime,
  getEventTimeFilterBounds,
} from "./scenarioEventTimeFilter";

const events: NScenarioEvent[] = [
  { id: "a", _type: "scenario", title: "یک", startTime: new Date("2026-01-10T08:00:00Z").valueOf() },
  { id: "b", _type: "scenario", title: "دو", startTime: new Date("2026-01-11T08:00:00Z").valueOf() },
];

describe("scenario event time filter", () => {
  it("returns every event when the filter is disabled", () => {
    expect(filterScenarioEventsByTime(events, null)).toEqual(events);
  });

  it("limits events to the selected day", () => {
    const bounds = getEventTimeFilterBounds({
      mode: "day",
      currentTime: new Date("2026-01-10T12:00:00Z").valueOf(),
    });
    expect(filterScenarioEventsByTime(events, bounds).map((event) => event.id)).toEqual(["a"]);
  });

  it("normalizes a reversed custom range", () => {
    const bounds = getEventTimeFilterBounds({
      mode: "custom",
      currentTime: 0,
      customFrom: "2026-01-12T00:00",
      customTo: "2026-01-10T00:00",
    });
    expect(bounds?.from).toBeLessThan(bounds?.to ?? 0);
    expect(filterScenarioEventsByTime(events, bounds).map((event) => event.id)).toEqual(["a", "b"]);
  });
});
