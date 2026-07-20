import { describe, expect, it } from "vitest";
import {
  collectTacticalTimelineMarkers,
  mapTacticalMarkersToX,
} from "./scenarioTimelineMath";

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
