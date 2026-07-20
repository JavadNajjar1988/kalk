import { describe, expect, it } from "vitest";
import { buildScenarioSaveDotClass, buildScenarioSaveStatus } from "./scenarioSaveStatus";

describe("buildScenarioSaveStatus", () => {
  it("shows autosave disabled for demo scenarios", () => {
    expect(
      buildScenarioSaveStatus({
        isDemoScenario: true,
        saveState: "idle",
        dirty: true,
        lastSavedAt: null,
      }),
    ).toMatchObject({
      label: "نمونه؛ ذخیره خودکار غیرفعال",
      tone: "muted",
    });
  });

  it("shows saving, dirty, saved, and error states", () => {
    expect(
      buildScenarioSaveStatus({
        isDemoScenario: false,
        saveState: "saving",
        dirty: true,
        lastSavedAt: null,
      }).label,
    ).toBe("در حال ذخیره...");

    expect(
      buildScenarioSaveStatus({
        isDemoScenario: false,
        saveState: "idle",
        dirty: true,
        lastSavedAt: null,
      }).label,
    ).toBe("ذخیره نشده");

    expect(
      buildScenarioSaveStatus({
        isDemoScenario: false,
        saveState: "saved",
        dirty: false,
        lastSavedAt: new Date("2026-06-10T07:35:00.000Z"),
        locale: "en-US",
        timeZone: "UTC",
      }).label,
    ).toBe("ذخیره شد 07:35");

    expect(
      buildScenarioSaveStatus({
        isDemoScenario: false,
        saveState: "error",
        dirty: true,
        lastSavedAt: null,
      }).label,
    ).toBe("خطا در ذخیره");
  });
});

describe("buildScenarioSaveDotClass", () => {
  it("maps save tones to the compact title indicator colors", () => {
    expect(buildScenarioSaveDotClass("dirty")).toContain("bg-amber-500");
    expect(buildScenarioSaveDotClass("saving")).toContain("animate-pulse bg-sky-500");
    expect(buildScenarioSaveDotClass("saved")).toContain("bg-emerald-500");
    expect(buildScenarioSaveDotClass("error")).toContain("bg-red-500");
    expect(buildScenarioSaveDotClass("muted")).toContain("bg-slate-400");
  });
});
