import { describe, expect, it } from "vitest";
import { getPathModeStateTargets } from "@/modules/scenarioeditor/unitTrackPathMode";
import type { NUnit } from "@/types/internalModels";

describe("getPathModeStateTargets", () => {
  it("returns unit and state indexes for selected waypoint state ids", () => {
    const units = [
      {
        id: "unit-1",
        state: [
          { id: "state-1", t: 100, location: [1, 1] },
          { id: "state-2", t: 200, location: [2, 2] },
        ],
      },
      {
        id: "unit-2",
        state: [{ id: "state-3", t: 300, location: [3, 3] }],
      },
    ] as NUnit[];

    expect(
      getPathModeStateTargets(units, {
        selectedWaypointIds: new Set(["state-2", "state-3"]),
        selectedUnitIds: new Set(),
      }),
    ).toEqual([
      { unitId: "unit-1", stateIndex: 1, stateId: "state-2" },
      { unitId: "unit-2", stateIndex: 0, stateId: "state-3" },
    ]);
  });

  it("ignores unknown ids and states without ids", () => {
    const units = [
      {
        id: "unit-1",
        state: [
          { id: "state-1", t: 100, location: [1, 1] },
          { t: 200, location: [2, 2] },
        ],
      },
    ] as NUnit[];

    expect(
      getPathModeStateTargets(units, {
        selectedWaypointIds: new Set(["missing", "state-1"]),
        selectedUnitIds: new Set(),
      }),
    ).toEqual([{ unitId: "unit-1", stateIndex: 0, stateId: "state-1" }]);
  });

  it("falls back to selected units when no waypoint state is selected", () => {
    const units = [
      {
        id: "unit-1",
        state: [
          { id: "state-1", t: 100, location: [1, 1] },
          { id: "state-no-location", t: 150 },
          { id: "state-removed", t: 175, location: null },
          { id: "state-2", t: 200, location: [2, 2] },
        ],
      },
      {
        id: "unit-2",
        state: [{ id: "state-3", t: 300, location: [3, 3] }],
      },
    ] as NUnit[];

    expect(
      getPathModeStateTargets(units, {
        selectedWaypointIds: new Set(),
        selectedUnitIds: new Set(["unit-1"]),
      }),
    ).toEqual([
      { unitId: "unit-1", stateIndex: 0, stateId: "state-1" },
      { unitId: "unit-1", stateIndex: 3, stateId: "state-2" },
    ]);
  });
});
