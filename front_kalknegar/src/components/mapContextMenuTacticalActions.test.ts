import { describe, expect, it } from "vitest";
import {
  getTacticalOperationTargetIds,
  pasteTacticalTargets,
} from "./mapContextMenuTacticalActions";

describe("getTacticalOperationTargetIds", () => {
  it("uses selected tactical ids before ids under the context-menu pointer", () => {
    expect(
      getTacticalOperationTargetIds({
        selectedIds: ["feature:selected-a", "feature:selected-b"],
        clickedIds: ["feature:clicked-a"],
      }),
    ).toEqual(["feature:selected-a", "feature:selected-b"]);
  });

  it("falls back to ids under the context-menu pointer when nothing is selected", () => {
    expect(
      getTacticalOperationTargetIds({
        selectedIds: [],
        clickedIds: ["feature:clicked-a"],
      }),
    ).toEqual(["feature:clicked-a"]);
  });

  it("removes duplicate ids while preserving order", () => {
    expect(
      getTacticalOperationTargetIds({
        selectedIds: [],
        clickedIds: ["feature:a", "feature:a", "feature:b"],
      }),
    ).toEqual(["feature:a", "feature:b"]);
  });
});

describe("pasteTacticalTargets", () => {
  it("delegates to the tactical clipboard paste service", async () => {
    let pasted = false;
    await pasteTacticalTargets({
      clipboard: {
        paste: () => {
          pasted = true;
        },
      },
    });

    expect(pasted).toBe(true);
  });
});
