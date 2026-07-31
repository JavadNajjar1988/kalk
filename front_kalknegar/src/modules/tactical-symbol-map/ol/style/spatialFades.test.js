import { MultiLineString } from "ol/geom";
import { describe, expect, it } from "vitest";
import * as TS from "../ts";
import applySpatialFades from "./spatialFades";

const read = (geometry) => TS.read(geometry);

describe("spatialFades", () => {
  it("fades only the rendered branch beneath the brush", () => {
    const geometry = TS.read(
      new MultiLineString([
        [
          [0, 0],
          [10, 0],
        ],
        [
          [0, 10],
          [10, 10],
        ],
      ]),
    );

    const result = applySpatialFades(
      [{ id: "style:2525c/default-stroke", geometry }],
      [{ coordinates: [[5, 0]], radius: 1, gesture: "fade:a" }],
      read,
    );

    const faded = result.filter((entry) => entry["line-opacity"] === 0.15);
    const normal = result.filter((entry) => entry["line-opacity"] === undefined);
    expect(faded).toHaveLength(1);
    expect(normal).toHaveLength(1);
    expect(
      TS.geometries(normal[0].geometry).some((part) =>
        part.getCoordinates().every((coordinate) => coordinate.y === 10),
      ),
    ).toBe(true);
  });
});
