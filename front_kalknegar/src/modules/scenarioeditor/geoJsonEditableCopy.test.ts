import { describe, expect, it } from "vitest";

import { createEditableScenarioFeatures } from "./geoJsonEditableCopy";

describe("GeoJSON editable scenario copy", () => {
  it("preserves geometry, attributes and simple style", () => {
    const [feature] = createEditableScenarioFeatures(
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              name: "منطقه یک",
              code: 12,
              fill: "#ff0000",
              "fill-opacity": 0.4,
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [51, 35],
                  [52, 35],
                  [52, 36],
                  [51, 35],
                ],
              ],
            },
          },
        ],
      },
      "editable-layer",
    );

    expect(feature._pid).toBe("editable-layer");
    expect(feature.meta).toMatchObject({ type: "Polygon", name: "منطقه یک" });
    expect(feature.properties).toMatchObject({ code: 12, type: "Polygon" });
    expect(feature.style).toEqual({ fill: "#ff0000", "fill-opacity": 0.4 });
  });

  it("skips null geometries and assigns a Persian fallback name", () => {
    const features = createEditableScenarioFeatures(
      {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: {}, geometry: null },
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [51, 35] },
          },
        ],
      },
      "editable-layer",
    );

    expect(features).toHaveLength(1);
    expect(features[0]?.meta.name).toBe("عارضه ۲");
  });
});
