import { describe, expect, it } from "vitest";
import {
  createOrbatClipboardData,
  getOrbatOperationTargetIds,
  getSingleOrbatPasteParentId,
} from "./mapContextMenuOrbatActions";

describe("getOrbatOperationTargetIds", () => {
  it("uses selected ORBAT unit ids before ids under the context-menu pointer", () => {
    expect(
      getOrbatOperationTargetIds({
        selectedIds: ["selected-a", "selected-b"],
        clickedIds: ["clicked-a"],
      }),
    ).toEqual(["selected-a", "selected-b"]);
  });

  it("falls back to ids under the context-menu pointer when nothing is selected", () => {
    expect(
      getOrbatOperationTargetIds({
        selectedIds: [],
        clickedIds: ["clicked-a"],
      }),
    ).toEqual(["clicked-a"]);
  });

  it("removes duplicate ids while preserving order", () => {
    expect(
      getOrbatOperationTargetIds({
        selectedIds: [],
        clickedIds: ["unit-a", "unit-a", "unit-b"],
      }),
    ).toEqual(["unit-a", "unit-b"]);
  });
});

describe("getSingleOrbatPasteParentId", () => {
  it("returns the only target as the paste parent", () => {
    expect(getSingleOrbatPasteParentId(["unit-a"])).toBe("unit-a");
  });

  it("rejects empty or multi-target paste parents", () => {
    expect(getSingleOrbatPasteParentId([])).toBeNull();
    expect(getSingleOrbatPasteParentId(["unit-a", "unit-b"])).toBeNull();
  });
});

describe("createOrbatClipboardData", () => {
  it("serializes selected units for ORBAT paste and plain-text clipboard", () => {
    const data = createOrbatClipboardData({
      targetIds: ["unit-a"],
      stringifyObject: (obj) => JSON.stringify(obj),
      state: {
        unitMap: {
          "unit-a": {
            id: "unit-a",
            name: "Alpha",
            sidc: "SFGPU----------",
            subUnits: [],
            _baseSubUnits: [],
            state: [],
          },
        },
        equipmentMap: {},
        personnelMap: {},
        supplyCategoryMap: {},
        rangeRingGroupMap: {},
        unitStatusMap: {},
      } as any,
    });

    expect(data?.textPlain).toBe("Alpha\n");
    expect(JSON.parse(data?.applicationOrbat ?? "")[0]).toMatchObject({
      name: "Alpha",
      sidc: "SFGPU----------",
    });
    expect(JSON.parse(data?.applicationOrbat ?? "")[0].id).not.toBe("unit-a");
  });
});
