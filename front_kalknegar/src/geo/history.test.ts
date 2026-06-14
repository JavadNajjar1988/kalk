// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createUnitPathFeatures } from "@/geo/history";
import type { Unit } from "@/types/scenarioModels";

vi.mock("@/stores/timeFormatStore", () => ({
  useTimeFormatStore: () => ({
    trackFormatter: { format: (value: number) => String(value) },
  }),
}));

describe("createUnitPathFeatures", () => {
  it("renders sampled curved geometry while preserving editable control points", () => {
    const unit = {
      id: "unit-1",
      name: "Unit 1",
      sidc: "10031000141211000000",
      location: [0, 0],
      state: [
        {
          id: "state-1",
          t: 1000,
          location: [0.02, 0],
          via: [[0.01, 0.02]],
          pathMode: "curved",
        },
      ],
    } as Unit;

    const { arcFeatures, legFeatures } = createUnitPathFeatures(unit, {
      isEditMode: true,
    });

    const arcCoordinates = arcFeatures[0].getGeometry()?.getCoordinates() ?? [];
    const legCoordinates = legFeatures[0].getGeometry()?.getCoordinates() ?? [];

    expect(arcCoordinates.length).toBeGreaterThan(8);
    expect(legCoordinates.length).toBe(3);
  });
});
