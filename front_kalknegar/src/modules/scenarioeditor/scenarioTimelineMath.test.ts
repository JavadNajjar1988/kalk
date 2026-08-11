import { describe, expect, it } from "vitest";
import {
  collectTacticalTimelineMarkers,
  mapEventsToX,
  mapPhasesToX,
  mapEnvironmentToX,
  mapTacticalMarkersToX,
} from "./scenarioTimelineMath";
import { PhaseStatus } from "@/types/scenarioModels";

describe("scenario timeline tactical markers", () => {
  it("collects unique tactical feature state times with counts", () => {
    const markers = collectTacticalTimelineMarkers([
      [
        "timed+feature:feature:a",
        [
          { t: 1_000, geometry: { type: "Point", coordinates: [0, 0] } },
          { t: 2_000, geometry: { type: "Point", coordinates: [1, 1] } },
        ],
      ],
      ["timed+feature:feature:b", [{ t: 1_000, properties: { fadeZones: [] } }]],
      ["timed+feature:feature:c", [{ t: Number.NaN }, { geometry: {} }]],
    ]);

    expect(markers).toEqual([
      { t: 1_000, count: 2 },
      { t: 2_000, count: 1 },
    ]);
  });

  it("maps tactical markers to timeline x positions", () => {
    const markers = mapTacticalMarkersToX({
      tacticalMarkers: [
        { t: 0, count: 1 },
        { t: 43_200_000, count: 2 },
        { t: 86_400_001, count: 1 },
      ],
      minTimestamp: 0,
      maxTimestamp: 86_400_000,
      majorWidth: 240,
      tzOffsetMinutes: 0,
    });

    expect(markers).toEqual([
      { x: 0, count: 1 },
      { x: 120, count: 2 },
    ]);
  });
});

describe("scenario timeline phases", () => {
  it("preserves phase associations while mapping events to the timeline", () => {
    const events = mapEventsToX({
      events: [
        {
          id: "event-1",
          _type: "scenario",
          title: "Phase event",
          startTime: 43_200_000,
          phaseId: "phase-1",
        },
      ],
      histogram: [],
      minTimestamp: 0,
      maxTimestamp: 86_400_000,
      majorWidth: 240,
      tzOffsetMinutes: 0,
    });

    expect(events).toHaveLength(1);
    expect(events[0].x).toBe(120);
    expect(events[0].event.phaseId).toBe("phase-1");
  });

  it("clips phase bands to the visible timeline range", () => {
    const phases = mapPhasesToX({
      events: [],
      histogram: [],
      phases: [
        {
          id: "phase-1",
          name: "مرحله یک",
          startTime: -43_200_000,
          endTime: 43_200_000,
          objectives: [],
          tasks: [],
          status: PhaseStatus.PLANNED,
        },
      ],
      minTimestamp: 0,
      maxTimestamp: 86_400_000,
      majorWidth: 240,
      tzOffsetMinutes: 0,
    });

    expect(phases).toHaveLength(1);
    expect(phases[0].x).toBe(0);
    expect(phases[0].width).toBe(120);
  });
});

describe("scenario timeline environment", () => {
  it("clips environmental bands to the visible range", () => {
    const bands = mapEnvironmentToX({
      events: [],
      histogram: [],
      environmentalConditions: [
        {
          id: "rain-1",
          kind: "precipitation",
          scope: "global",
          startTime: -43_200_000,
          endTime: 43_200_000,
          parameters: { mode: "rain", intensity: 0.7 },
        },
      ],
      minTimestamp: 0,
      maxTimestamp: 86_400_000,
      majorWidth: 240,
      tzOffsetMinutes: 0,
    });
    expect(bands).toHaveLength(1);
    expect(bands[0].x).toBe(0);
    expect(bands[0].width).toBe(120);
  });
});
