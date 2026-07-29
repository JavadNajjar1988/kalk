import { describe, expect, it } from "vitest";
import {
  boundaryCodeFromEmt,
  boundaryEchelonOptions,
  recommendBoundaryEchelon,
} from "./boundaryEchelons";

describe("Boundary echelons", () => {
  it("maps MIL-STD-2525D unit echelons to 2525C boundary codes", () => {
    expect(boundaryCodeFromEmt("14")).toBe("D");
    expect(boundaryCodeFromEmt("18")).toBe("H");
    expect(boundaryCodeFromEmt("21")).toBe("I");
    expect(boundaryCodeFromEmt("00")).toBeNull();
    expect(boundaryCodeFromEmt(undefined)).toBeNull();
  });

  it("uses three solid dots for a platoon or detachment boundary", () => {
    expect(boundaryEchelonOptions.find(({ code }) => code === "D")).toMatchObject({
      label: "دسته / جزء مستقل",
      marker: "•••",
    });
  });

  it("recommends the higher adjacent echelon", () => {
    expect(recommendBoundaryEchelon(["14", "18"])).toBe("H");
    expect(recommendBoundaryEchelon(["14", "14"])).toBe("D");
  });

  it("uses the requested fallback when no adjacent echelon is valid", () => {
    expect(recommendBoundaryEchelon([], "H")).toBe("H");
    expect(recommendBoundaryEchelon(["00"])).toBe("F");
  });
});
