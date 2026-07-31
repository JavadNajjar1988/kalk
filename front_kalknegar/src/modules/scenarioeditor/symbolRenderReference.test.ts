import { describe, expect, it } from "vitest";
import { pointSymbolScale } from "./symbolRenderReference";

describe("symbol render reference", () => {
  it("keeps the geographic size of a point symbol stable across zoom levels", () => {
    const reference = {
      version: 1 as const,
      renderer: "mission-command" as const,
      authoredResolution: 10,
      authoredScale: 40_000,
      pointSizeMeters: 360,
    };

    expect(pointSymbolScale(reference, 10)).toBe(1);
    expect(pointSymbolScale(reference, 20)).toBe(0.5);
    expect(pointSymbolScale(reference, 5)).toBe(2);
  });
});
