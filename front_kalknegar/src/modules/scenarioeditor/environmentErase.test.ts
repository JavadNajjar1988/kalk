import { describe, expect, it } from "vitest";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import MultiLineString from "ol/geom/MultiLineString";
import {
  applyEnvironmentalEraseZones,
  buildEnvironmentalEraseZone,
} from "./environmentErase";
import type { EnvironmentalCondition } from "@/types/scenarioModels";

function condition(mode: "fade" | "cut", radiusMeters = 100): EnvironmentalCondition {
  return {
    id: "weather-1",
    name: "نماد آزمایشی",
    kind: "metoc",
    scope: "area",
    startTime: 0,
    parameters: {},
    geometry: { type: "Point", coordinates: [0, 0] },
    eraseZones: [{ mode, coordinates: [[0, 0]], radiusMeters }],
  };
}

describe("environment METOC erasing", () => {
  it("removes a point icon covered by a cut mask", () => {
    const result = applyEnvironmentalEraseZones(
      new Feature(new Point([0, 0])),
      condition("cut"),
      "EPSG:3857",
    );

    expect(result).toHaveLength(0);
  });

  it("keeps a faded point with reduced opacity", () => {
    const result = applyEnvironmentalEraseZones(
      new Feature(new Point([0, 0])),
      condition("fade"),
      "EPSG:3857",
    );

    expect(result).toHaveLength(1);
    expect(result[0].get("environmentOpacity")).toBe(0.15);
  });

  it("cuts only the brushed section from a line", () => {
    const feature = new Feature(
      new LineString([
        [-1_000, 0],
        [1_000, 0],
      ]),
    );
    const result = applyEnvironmentalEraseZones(
      feature,
      condition("cut", 100),
      "EPSG:3857",
    );

    expect(result).toHaveLength(1);
    expect(result[0].getGeometry()?.getExtent()[0]).toBe(-1_000);
    expect(result[0].getGeometry()?.getExtent()[2]).toBe(1_000);
    expect(result[0].getGeometry()?.getType()).toBe("MultiLineString");
  });

  it("does not alter a distant component of the same rendered symbol", () => {
    const feature = new Feature(
      new MultiLineString([
        [
          [-1_000, 0],
          [1_000, 0],
        ],
        [
          [-1_000, 1_000],
          [1_000, 1_000],
        ],
      ]),
    );
    const result = applyEnvironmentalEraseZones(
      feature,
      condition("fade", 100),
      "EPSG:3857",
    );

    const normal = result.find((item) => item.get("environmentOpacity") === 1);
    const coordinates = (normal?.getGeometry() as MultiLineString).getCoordinates();
    expect(coordinates).toContainEqual([
      [-1_000, 1_000],
      [1_000, 1_000],
    ]);
  });

  it("stores erase paths in geographic coordinates with a metric radius", () => {
    const zone = buildEnvironmentalEraseZone(
      "fade",
      [
        [0, 0],
        [100, 0],
      ],
      20,
      "EPSG:3857",
    );

    expect(zone.mode).toBe("fade");
    expect(zone.radiusMeters).toBeCloseTo(20);
    expect(zone.coordinates[1][0]).toBeCloseTo(0.000898, 5);
  });
});
