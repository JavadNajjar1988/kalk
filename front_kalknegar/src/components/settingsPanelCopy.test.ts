import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("settings panel copy", () => {
  it("does not expose the map debug block", () => {
    const source = readFileSync(resolve(__dirname, "LayersPanel.vue"), "utf8");

    expect(source).not.toContain("For debugging:");
  });

  it("does not expose debug mode in settings", () => {
    const source = readFileSync(resolve(__dirname, "MainViewSlideOver.vue"), "utf8");

    expect(source).not.toContain("حالت اشکال‌یابی");
    expect(source).not.toContain("debugMode");
  });

  it("keeps the timeline-driven day and night control in the compact layers panel", () => {
    const source = readFileSync(resolve(__dirname, "LayersPanel.vue"), "utf8");

    expect(source).toContain('v-model="mapSettings.showDayNightTerminator"');
    expect(source).not.toContain("سایه شب بر اساس زمان خط زمان");
  });

  it("keeps the day and night source synchronized while the layer is hidden", () => {
    const source = readFileSync(
      resolve(__dirname, "../composables/geoDayNight.ts"),
      "utf8",
    );

    expect(source).not.toContain("watchPausable");
    expect(source).not.toContain("pause()");
    expect(source).toContain("syncDayNightWithTimeline(vectorSource, time)");
  });

  it("groups settings into readable sections", () => {
    const mapSettings = readFileSync(resolve(__dirname, "MapSettingsPanel.vue"), "utf8");
    const mainSettings = readFileSync(
      resolve(__dirname, "MainViewSlideOver.vue"),
      "utf8",
    );

    expect(mapSettings).toContain("اجزای رابط نقشه");
    expect(mapSettings).toContain("مختصات و اندازه‌گیری");
    expect(mainSettings).toContain("ظاهر نمادها");
  });

  it("removes duplicate scenario settings and keeps chart settings", () => {
    const source = readFileSync(resolve(__dirname, "MainViewSlideOver.vue"), "utf8");

    expect(source).not.toContain('label="تنظیمات سناریو"');
    expect(source).not.toContain("<ScenarioSettingsPanel");
    expect(source).toContain('label="تنظیمات چارت"');
    expect(source).toContain("<OrbatChartSettings");
  });

  it("uses Persian labels in time settings", () => {
    const source = readFileSync(
      resolve(__dirname, "TimeDateSettingsDetails.vue"),
      "utf8",
    );

    expect(source).toContain("زبان مرورگر");
    expect(source).toContain("پیش‌نمایش");
    expect(source).not.toContain("Browser locale is");
    expect(source).not.toContain("Preview:");
  });

  it("uses Persian date and time style names", () => {
    const source = readFileSync(
      resolve(__dirname, "../stores/timeFormatStore.ts"),
      "utf8",
    );

    expect(source).toContain('{ label: "کامل", value: "full" }');
    expect(source).toContain('{ label: "کوتاه", value: "short" }');
  });
});
