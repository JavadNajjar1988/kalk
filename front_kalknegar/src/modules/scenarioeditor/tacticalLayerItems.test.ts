import { describe, expect, it } from "vitest";

import { buildTacticalLayerItems, readTacticalLayerTuples } from "./tacticalLayerItems";

const PERSIAN_DEFAULT_LAYER_NAME = "\u0644\u0627\u06cc\u0647 \u062a\u0627\u06a9\u062a\u06cc\u06a9\u0627\u0644 \u06f1";
const PERSIAN_DEFAULT_FEATURE_NAME =
  "\u0646\u0645\u0627\u062f \u062a\u0627\u06a9\u062a\u06cc\u06a9\u0627\u0644 \u06f1";

describe("tactical layer items", () => {
  it("groups tactical features below their tactical layer", () => {
    const layers = buildTacticalLayerItems([
      ["layer:alpha", { name: "Tactical layer" }],
      [
        "feature:alpha/one",
        {
          name: "Contact line",
          type: "Feature",
          properties: { sidc: "GFGPOLK----X" },
        },
      ],
      [
        "feature:alpha/two",
        {
          type: "Feature",
          properties: { t: "Alpha", sidc: "SFGPUCI----K" },
        },
      ],
      ["hidden+feature:alpha/two", true],
      ["hidden+layer:alpha", true],
    ]);

    expect(layers).toEqual([
      {
        id: "layer:alpha",
        name: "Tactical layer",
        isHidden: true,
        features: [
          {
            id: "feature:alpha/one",
            layerId: "layer:alpha",
            name: "Contact line",
            sidc: "GFGPOLK----X",
            isHidden: false,
          },
          {
            id: "feature:alpha/two",
            layerId: "layer:alpha",
            name: "Alpha",
            sidc: "SFGPUCI----K",
            isHidden: true,
          },
        ],
      },
    ]);
  });

  it("uses Persian fallback names for unnamed tactical layers and features", () => {
    const layers = buildTacticalLayerItems([
      [
        "feature:beta/one",
        {
          type: "Feature",
          properties: {},
        },
      ],
    ]);

    expect(layers[0]?.name).toBe(PERSIAN_DEFAULT_LAYER_NAME);
    expect(layers[0]?.features[0]?.name).toBe(PERSIAN_DEFAULT_FEATURE_NAME);
  });

  it("reads tactical feature tuples from explicit store scopes", async () => {
    const calls: string[] = [];
    const store = {
      tuplesJSON: async (prefix: string) => {
        calls.push(prefix);
        if (prefix === "layer:") return [["layer:alpha", { name: "Layer" }]];
        if (prefix === "feature:") return [["feature:alpha/one", { type: "Feature" }]];
        if (prefix === "hidden+layer:") return [["hidden+layer:alpha", true]];
        if (prefix === "hidden+feature:") return [["hidden+feature:alpha/one", true]];
        return [];
      },
    };

    await expect(readTacticalLayerTuples(store)).resolves.toEqual([
      ["layer:alpha", { name: "Layer" }],
      ["feature:alpha/one", { type: "Feature" }],
      ["hidden+layer:alpha", true],
      ["hidden+feature:alpha/one", true],
    ]);
    expect(calls).toEqual(["layer:", "feature:", "hidden+layer:", "hidden+feature:"]);
  });
});
