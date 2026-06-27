import { describe, expect, it } from "vitest";
import {
  promoteEchelonForCluster,
  summarySidcForUnits,
  unitDensityFeatureOpacity,
} from "@/geo/unitDensitySummary";

describe("unitDensitySummary", () => {
  it("promotes crowded battalions to a higher visible echelon", () => {
    expect(promoteEchelonForCluster("15", 2)).toBe("16");
    expect(promoteEchelonForCluster("15", 4)).toBe("18");
    expect(promoteEchelonForCluster("15", 8)).toBe("21");
  });

  it("builds a summary SIDC without mutating member SIDCs", () => {
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
      { id: "c", sidc: "10031000151211000000" },
      { id: "d", sidc: "10031000151211000000" },
    ];

    expect(summarySidcForUnits(units)).toBe("10031000181211000000");
    expect(units[0].sidc).toBe("10031000151211000000");
  });

  it("dims member units while a summary symbol is visible", () => {
    expect(unitDensityFeatureOpacity({ hasDensitySummary: true })).toBe(0.35);
    expect(unitDensityFeatureOpacity({ hasDensitySummary: false })).toBe(1);
  });
});
