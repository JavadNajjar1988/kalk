import { describe, expect, it } from "vitest";
import {
  shouldUseTacticalRedo,
  shouldUseTacticalUndo,
} from "./useUnifiedUndoRedo";

describe("unified undo ordering", () => {
  it("undoes the most recent action regardless of which store owns it", () => {
    expect(shouldUseTacticalUndo(true, 20, true, 10)).toBe(true);
    expect(shouldUseTacticalUndo(true, 10, true, 20)).toBe(false);
    expect(shouldUseTacticalUndo(true, 10, false, 0)).toBe(true);
  });

  it("redoes the earliest action undone across both stores", () => {
    expect(shouldUseTacticalRedo(true, 10, true, 20)).toBe(true);
    expect(shouldUseTacticalRedo(true, 20, true, 10)).toBe(false);
    expect(shouldUseTacticalRedo(true, 10, false, 0)).toBe(true);
  });
});
