import { describe, expect, it } from "vitest";
import {
  normalizeEnvironmentalCondition,
  resolveEnvironmentalConditions,
  validateEnvironmentalConditions,
} from "./environment";
import type { EnvironmentalCondition } from "@/types/scenarioModels";

function rain(
  overrides: Partial<EnvironmentalCondition> = {},
): EnvironmentalCondition {
  return {
    id: "rain",
    kind: "precipitation",
    scope: "global",
    startTime: 1_000,
    endTime: 2_000,
    parameters: { mode: "rain", intensity: 0.5 },
    ...overrides,
  };
}

describe("environmental conditions", () => {
  it("resolves higher-priority area conditions before global conditions", () => {
    const global = rain({ id: "global", priority: 1 });
    const area = rain({
      id: "area",
      scope: "area",
      priority: 2,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      },
    });
    expect(resolveEnvironmentalConditions([global, area], 1_500)[0].id).toBe(
      "area",
    );
  });

  it("reports invalid ranges, missing geometry and overlapping kinds", () => {
    const issues = validateEnvironmentalConditions([
      rain({ id: "first" }),
      rain({
        id: "second",
        scope: "area",
        startTime: 1_500,
        endTime: 1_400,
      }),
    ]);
    expect(issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining(["invalid-range", "missing-geometry", "overlap"]),
    );
  });

  it("normalizes legacy dashboard values without dropping them", () => {
    const normalized = normalizeEnvironmentalCondition({
      id: "legacy",
      type: "visibility",
      value: 800,
      startTime: 1_000,
    } as EnvironmentalCondition);
    expect(normalized.kind).toBe("visibility");
    expect(normalized.parameters).toEqual({ rangeMeters: 800 });
    expect(normalized.scope).toBe("global");
  });
});
