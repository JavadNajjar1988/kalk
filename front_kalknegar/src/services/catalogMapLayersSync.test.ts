import { afterEach, describe, expect, it, vi } from "vitest";

import { mergePublishedCatalogMapLayers } from "./catalogMapLayersSync";

describe("mergePublishedCatalogMapLayers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the scenario catalog and removes catalog layers that are no longer assigned", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        layers: [
          {
            id: "assigned",
            title: "Assigned layer",
            type: "geojson",
            source: "geojson",
            path: "/api/catalog/vector-data/assigned.geojson",
            status: "published",
            admin: { map_id: 22 },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const geo = {
      mapLayers: { value: [{ id: "sdi-cat-11" }, { id: "manual-layer" }] },
      deleteMapLayer: vi.fn(),
      getMapLayerById: vi.fn().mockReturnValue(undefined),
      addMapLayer: vi.fn(),
    };

    await mergePublishedCatalogMapLayers(geo as never, "scenario/alpha");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/catalog\/layers\.json\?scenario_id=scenario%2Falpha$/),
    );
    expect(geo.deleteMapLayer).toHaveBeenCalledOnce();
    expect(geo.deleteMapLayer).toHaveBeenCalledWith("sdi-cat-11");
    expect(geo.addMapLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sdi-cat-22", name: "Assigned layer" }),
    );
  });
});
