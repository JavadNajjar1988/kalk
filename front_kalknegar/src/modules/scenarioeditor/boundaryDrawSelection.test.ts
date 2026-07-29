import { describe, expect, it } from "vitest";
import type { NUnit } from "@/types/internalModels";
import {
  placementModeForSidc,
  selectedBoundaryUnits,
  unitDesignation,
} from "./boundaryDrawSelection";

describe("Boundary draw unit selection", () => {
  const units = [
    {
      id: "u1",
      name: "گردان یکم",
      shortName: "۱",
      sidc: "10031000161211000000",
    },
    {
      id: "u2",
      name: "تیپ دوم",
      sidc: "10031000181211000000",
    },
  ] as NUnit[];

  it("preselects two existing units in selection order", () => {
    expect(selectedBoundaryUnits(units, ["u2", "missing", "u1"])).toEqual({
      leftUnit: units[1],
      rightUnit: units[0],
    });
  });

  it("preselects one unit on the left", () => {
    expect(selectedBoundaryUnits(units, ["u1"])).toEqual({
      leftUnit: units[0],
      rightUnit: null,
    });
  });

  it("uses the short name as designation and falls back to the full name", () => {
    expect(unitDesignation(units[0])).toBe("۱");
    expect(unitDesignation(units[1])).toBe("تیپ دوم");
    expect(unitDesignation(null)).toBeUndefined();
  });

  it("opens configuration only for the Boundary SIDC", () => {
    expect(placementModeForSidc("GFGPGLB---*****")).toBe("configure-boundary");
    expect(placementModeForSidc("G*G*GLB---")).toBe("configure-boundary");
    expect(placementModeForSidc("G*F*LCC---")).toBe("draw");
    expect(placementModeForSidc(null)).toBe("draw");
  });
});
