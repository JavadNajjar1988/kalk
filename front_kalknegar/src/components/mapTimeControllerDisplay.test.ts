import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { formatMapTimeDisplay } from "./mapTimeControllerDisplay";
import type { TimeFormatSettings } from "@/stores/timeFormatStore";

describe("formatMapTimeDisplay", () => {
  it("formats the map header date and time as separate stable Persian strings", () => {
    const timestamp = Date.UTC(1982, 3, 1, 10, 40);

    const result = formatMapTimeDisplay(timestamp, "UTC");

    expect(result).toEqual({
      date: "۱۲ فروردین ۱۳۶۱",
      time: "۱۰:۴۰",
    });
    expect(result.date).not.toMatch(/\s{2,}/);
    expect(result.time).toHaveLength(5);
  });

  it("applies the selected map locale, style and geographic time zone", () => {
    const timestamp = Date.UTC(2026, 6, 29, 20, 30);
    const settings: TimeFormatSettings = {
      timeFormat: "local",
      locale: "en-GB",
      dateStyle: "long",
      timeStyle: "short",
    };

    const result = formatMapTimeDisplay(timestamp, "Asia/Tehran", settings);

    expect(result.date).toBe("30 July 2026");
    expect(result.time).toBe("00:00");
  });

  it("keeps the map header date and time visually compact", () => {
    const component = readFileSync(resolve(__dirname, "MapTimeController.vue"), "utf8");

    expect(component).toContain("inline-flex");
    expect(component).toContain("gap-5");
    expect(component).toContain("timeSettings.track");
    expect(component).not.toContain("justify-between");
    expect(component).not.toContain("min-w-[18rem]");
    expect(component).not.toContain("sm:min-w-[21rem]");
  });

  it("renders the map header time with a high contrast map-safe text style", () => {
    const component = readFileSync(resolve(__dirname, "MapTimeController.vue"), "utf8");

    expect(component).toContain("map-time-display");
    expect(component).toContain("color: #fff");
    expect(component).toContain("-webkit-text-stroke");
    expect(component).toContain("text-shadow");
    expect(component).not.toContain("text-slate-900");
    expect(component).not.toContain("dark:text-slate-100");
  });
});
