import { describe, expect, it } from "vitest";

import {
  buildTacticalLayerItems,
  readTacticalLayerTuples,
  reorderTacticalPanelItems,
  writeTacticalPanelOrder,
} from "./tacticalLayerItems";

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
        order: 1,
        features: [
          {
            id: "feature:alpha/one",
            layerId: "layer:alpha",
            name: "Contact line",
            sidc: "GFGPOLK----X",
            isHidden: false,
            order: 1,
          },
          {
            id: "feature:alpha/two",
            layerId: "layer:alpha",
            name: "Alpha",
            sidc: "SFGPUCI----K",
            isHidden: true,
            order: 2,
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

  it("sorts tactical layers and features by their layer panel order", () => {
    const layers = buildTacticalLayerItems([
      ["layer:alpha", { name: "Alpha", layerPanelOrder: 2 }],
      ["layer:beta", { name: "Beta", layerPanelOrder: 1 }],
      ["feature:alpha/one", { name: "One", layerPanelOrder: 20 }],
      ["feature:alpha/two", { name: "Two", layerPanelOrder: 10 }],
      ["feature:beta/three", { name: "Three", layerPanelOrder: 30 }],
    ]);

    expect(layers.map((layer) => layer.id)).toEqual(["layer:beta", "layer:alpha"]);
    expect(layers[1]?.features.map((feature) => feature.id)).toEqual([
      "feature:alpha/two",
      "feature:alpha/one",
    ]);
  });

  it("reorders tactical panel items around a destination edge", () => {
    const items = [{ id: "one" }, { id: "two" }, { id: "three" }];

    expect(reorderTacticalPanelItems(items, "one", "three", "bottom")).toEqual([
      { id: "two" },
      { id: "three" },
      { id: "one" },
    ]);
    expect(reorderTacticalPanelItems(items, "three", "one", "top")).toEqual([
      { id: "three" },
      { id: "one" },
      { id: "two" },
    ]);
  });

  it("writes tactical panel order back to store values", async () => {
    const updates: any[] = [];
    const store = {
      tuplesJSON: async (ids: string[]) =>
        ids.map((id) => [id, { name: id, layerPanelOrder: 99 }]),
      update: async (keys: string[], newValues: any[], oldValues: any[]) => {
        updates.push({ keys, newValues, oldValues });
      },
    };

    await writeTacticalPanelOrder(store, ["feature:a/one", "feature:a/two"]);

    expect(updates).toEqual([
      {
        keys: ["feature:a/one", "feature:a/two"],
        oldValues: [
          { name: "feature:a/one", layerPanelOrder: 99 },
          { name: "feature:a/two", layerPanelOrder: 99 },
        ],
        newValues: [
          { name: "feature:a/one", layerPanelOrder: 1 },
          { name: "feature:a/two", layerPanelOrder: 2 },
        ],
      },
    ]);
  });
});
