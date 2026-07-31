import { describe, expect, it } from "vitest";
import { sanitizeMetocFeatureCollection, sanitizeMetocGeometry } from "./metocGeoJson";

describe("METOC GeoJSON sanitizer", () => {
  it("removes invalid renderer segments and keeps valid lines", () => {
    const geometry = sanitizeMetocGeometry({
      type: "MultiLineString",
      coordinates: [
        [
          [51, 35],
          [52, 36],
        ],
        [
          [null, null],
          [null, null],
        ],
        [],
      ],
    } as unknown as GeoJSON.MultiLineString);

    expect(geometry).toEqual({
      type: "MultiLineString",
      coordinates: [
        [
          [51, 35],
          [52, 36],
        ],
      ],
    });
  });

  it("closes polygon rings returned without a closing coordinate", () => {
    const geometry = sanitizeMetocGeometry({
      type: "Polygon",
      coordinates: [
        [
          [51, 35],
          [52, 35],
          [52, 36],
        ],
      ],
    });

    expect((geometry as GeoJSON.Polygon).coordinates[0]).toEqual([
      [51, 35],
      [52, 35],
      [52, 36],
      [51, 35],
    ]);
  });

  it("returns no collection when the renderer produced no usable geometry", () => {
    expect(
      sanitizeMetocFeatureCollection({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "MultiLineString", coordinates: [] },
          },
        ],
      }),
    ).toBeUndefined();
  });
});
