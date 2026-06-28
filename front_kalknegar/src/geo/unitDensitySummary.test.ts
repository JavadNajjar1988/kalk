import { describe, expect, it } from "vitest";
import {
  applyEchelonToSummarySidc,
  commonParentSummaryForUnits,
  getUnitDensitySummaryOverrides,
  resolveUnitDensitySummary,
  promoteEchelonForCluster,
  setUnitDensitySummaryOverride,
  shouldOpenUnitDensitySummaryEditor,
  sidcWithInferredParentEchelon,
  summarySidcForUnits,
  unitDensitySummarySourceLabel,
  unitDensityFeatureOpacity,
} from "@/geo/unitDensitySummary";

describe("unitDensitySummary", () => {
  it("promotes crowded battalions to a higher visible echelon", () => {
    expect(promoteEchelonForCluster("15", 2)).toBe("16");
    expect(promoteEchelonForCluster("15", 4)).toBe("18");
    expect(promoteEchelonForCluster("15", 8)).toBe("21");
  });

  it("builds a summary SIDC without mutating member SIDCs", () => {
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
      { id: "c", sidc: "10031000151211000000" },
      { id: "d", sidc: "10031000151211000000" },
    ];

    expect(summarySidcForUnits(units)).toBe("10031000181211000000");
    expect(units[0].sidc).toBe("10031000151211000000");
  });

  it("dims member units while a summary symbol is visible", () => {
    expect(unitDensityFeatureOpacity({ hasDensitySummary: true })).toBe(0.35);
    expect(unitDensityFeatureOpacity({ hasDensitySummary: false })).toBe(1);
  });

  it("uses a manual summary override for matching unit members", () => {
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
      { id: "c", sidc: "10031000151211000000" },
    ];

    expect(
      resolveUnitDensitySummary(units, {
        "a|b|c": {
          label: "لشکر ۲۱ حمزه",
          sidc: "10031000211211000000",
        },
      }),
    ).toEqual({
      label: "لشکر ۲۱ حمزه",
      sidc: "10031000211211000000",
      source: "manual",
      overrideKey: "a|b|c",
    });
  });

  it("uses the lowest shared ORBAT parent when no manual override exists", () => {
    const brigade = {
      id: "brigade",
      name: "تیپ ۱",
      sidc: "10031000181211000000",
    };
    const division = {
      id: "division",
      name: "لشکر ۲۱",
      sidc: "10031000211211000000",
    };
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
    ];

    expect(
      commonParentSummaryForUnits(units, (unitId) =>
        unitId === "a" || unitId === "b" ? [division, brigade] : [],
      ),
    ).toEqual({
      label: "تیپ ۱",
      sidc: "10031000181211000000",
    });
  });

  it("infers missing parent echelon from ORBAT parent names", () => {
    expect(
      sidcWithInferredParentEchelon({
        id: "brigade",
        name: "\u062a\u06cc\u067e 1",
        sidc: "10031000001211000000",
      }),
    ).toBe("10031000181211000000");
    expect(
      sidcWithInferredParentEchelon({
        id: "division",
        name: "\u0644\u0634\u06a9\u0631 16",
        sidc: "10031000001211000000",
      }),
    ).toBe("10031000211211000000");
    expect(
      sidcWithInferredParentEchelon({
        id: "corps",
        shortName: "\u0642.\u06a9\u0631\u0628\u0644\u0627",
        name: "",
        sidc: "10031000001211000000",
      }),
    ).toBe("10031000221211000000");
  });

  it("keeps manual overrides above ORBAT parent summaries", () => {
    const parentSummary = {
      label: "تیپ ۱",
      sidc: "10031000181211000000",
    };
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
    ];

    expect(
      resolveUnitDensitySummary(
        units,
        {
          "a|b": {
            label: "لشکر سفارشی",
            sidc: "10031000211211000000",
          },
        },
        parentSummary,
      ),
    ).toEqual({
      label: "لشکر سفارشی",
      sidc: "10031000211211000000",
      source: "manual",
      overrideKey: "a|b",
    });
  });

  it("stores manual summary overrides in scenario metadata immutably", () => {
    const metadata = { existing: true };
    const updated = setUnitDensitySummaryOverride(metadata, "a|b", {
      label: "قرارگاه شمال",
      sidc: "10031000181211000000",
    });

    expect(metadata).toEqual({ existing: true });
    expect(getUnitDensitySummaryOverrides(updated)).toEqual({
      "a|b": {
        label: "قرارگاه شمال",
        sidc: "10031000181211000000",
      },
    });
  });

  it("applies a selected echelon to a summary SIDC", () => {
    expect(applyEchelonToSummarySidc("10031000151211000000", "21")).toBe(
      "10031000211211000000",
    );
  });

  it("reports the summary source for UI badges", () => {
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
    ];
    const parentSummary = {
      label: "\u062a\u06cc\u067e 1",
      sidc: "10031000181211000000",
    };

    expect(resolveUnitDensitySummary(units).source).toBe("automatic");
    expect(resolveUnitDensitySummary(units, {}, parentSummary).source).toBe("orbat");
    expect(
      resolveUnitDensitySummary(
        units,
        { "a|b": { label: "\u062f\u0633\u062a\u06cc" } },
        parentSummary,
      ).source,
    ).toBe("manual");
    expect(unitDensitySummarySourceLabel("manual")).toBe("\u062f\u0633\u062a\u06cc");
    expect(unitDensitySummarySourceLabel("orbat")).toBe(
      "\u0622\u0631\u0627\u06cc\u0634 \u0646\u0628\u0631\u062f",
    );
    expect(unitDensitySummarySourceLabel("automatic")).toBe(
      "\u062e\u0648\u062f\u06a9\u0627\u0631",
    );
  });

  it("honors explicit automatic source selection over ORBAT", () => {
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
      { id: "c", sidc: "10031000151211000000" },
      { id: "d", sidc: "10031000151211000000" },
    ];
    const parentSummary = {
      label: "\u062a\u06cc\u067e 1",
      sidc: "10031000181211000000",
    };

    expect(
      resolveUnitDensitySummary(
        units,
        { "a|b|c|d": { source: "automatic" } },
        parentSummary,
      ),
    ).toEqual({
      label: undefined,
      sidc: "10031000181211000000",
      symbolOptions: undefined,
      overrideKey: "a|b|c|d",
      source: "automatic",
    });
  });

  it("opens the summary editor only before save or when forced", () => {
    const units = [
      { id: "a", sidc: "10031000151211000000" },
      { id: "b", sidc: "10031000151211000000" },
    ];
    const overrides = {
      "a|b": { source: "orbat" as const },
    };

    expect(shouldOpenUnitDensitySummaryEditor(units, {}, false)).toBe(true);
    expect(shouldOpenUnitDensitySummaryEditor(units, overrides, false)).toBe(false);
    expect(shouldOpenUnitDensitySummaryEditor(units, overrides, true)).toBe(true);
  });
});
