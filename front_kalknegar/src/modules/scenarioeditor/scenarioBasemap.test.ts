import { describe, expect, it } from "vitest";
import { resolveInitialBaseMapId } from "./scenarioBasemap";

describe("resolveInitialBaseMapId", () => {
  it("keeps the base map stored in an existing scenario", () => {
    expect(resolveInitialBaseMapId("esriWorldImagery", "osm")).toBe("esriWorldImagery");
  });

  it("uses the user default only when the scenario has no usable base map", () => {
    expect(resolveInitialBaseMapId("  ", "openTopoMap")).toBe("openTopoMap");
  });
});
