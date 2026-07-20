import { describe, expect, it } from "vitest";
import { buildUnitPathCoordinates } from "@/geo/unitPath";
import type { Position } from "geojson";

describe("buildUnitPathCoordinates", () => {
  it("returns original coordinates for straight mode", () => {
    const input: Position[] = [
      [0, 0],
      [1, 1],
      [2, 0],
    ];

    expect(buildUnitPathCoordinates(input, "straight")).toEqual(input);
  });

  it("samples a curved path through control points", () => {
    const input: Position[] = [
      [0, 0],
      [1, 1],
      [2, 0],
      [3, 1],
    ];

    const output = buildUnitPathCoordinates(input, "curved", {
      samplesPerSegment: 8,
    });

    expect(output.length).toBeGreaterThan(input.length);
    expect(output[0]).toEqual([0, 0]);
    expect(output[output.length - 1]).toEqual([3, 1]);
    expect(output.some(([x, y]) => x > 1 && x < 2 && y !== 1 && y !== 0)).toBe(
      true,
    );
  });

  it("falls back to straight when curved mode has fewer than three points", () => {
    const input: Position[] = [
      [0, 0],
      [1, 1],
    ];

    expect(buildUnitPathCoordinates(input, "curved")).toEqual(input);
  });
});
