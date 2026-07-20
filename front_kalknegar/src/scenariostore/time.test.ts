import { describe, expect, it } from "vitest";
import { updateCurrentUnitState } from "@/scenariostore/time";
import type { NUnit } from "@/types/internalModels";
import type { PathMode } from "@/geo/unitPath";

function unitWithState(pathMode?: PathMode): NUnit {
  return {
    id: "unit-1",
    name: "Unit 1",
    sidc: "10031000141211000000",
    location: [0, 0],
    state: [
      {
        id: "state-1",
        t: 1000,
        location: [2, 0],
        via: [[1, 2]],
        viaStartTime: 0,
        pathMode,
      },
    ],
  } as NUnit;
}

describe("updateCurrentUnitState path interpolation", () => {
  it("keeps existing straight interpolation as the default", () => {
    const unit = unitWithState();

    updateCurrentUnitState(unit, 500);

    expect(unit._state?.type).toBe("interpolated");
    expect(unit._state?.location?.[0]).toBeCloseTo(1, 1);
    expect(unit._state?.location?.[1]).toBeCloseTo(2, 1);
  });

  it("moves along the sampled curved path when pathMode is curved", () => {
    const straight = unitWithState("straight");
    const curved = unitWithState("curved");

    updateCurrentUnitState(straight, 250);
    updateCurrentUnitState(curved, 250);

    expect(curved._state?.type).toBe("interpolated");
    expect(curved._state?.location?.[0]).not.toBeCloseTo(
      straight._state?.location?.[0] ?? 0,
      2,
    );
    expect(curved._state?.location?.[1]).not.toBeCloseTo(
      straight._state?.location?.[1] ?? 0,
      2,
    );
  });
});
