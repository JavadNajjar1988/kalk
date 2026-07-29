import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("settings panel copy", () => {
  it("does not expose the map debug block", () => {
    const source = readFileSync(resolve(__dirname, "LayersPanel.vue"), "utf8");

    expect(source).not.toContain("For debugging:");
  });

  it("uses Persian labels in time settings", () => {
    const source = readFileSync(resolve(__dirname, "TimeDateSettingsDetails.vue"), "utf8");

    expect(source).toContain("زبان مرورگر");
    expect(source).toContain("پیش‌نمایش");
    expect(source).not.toContain("Browser locale is");
    expect(source).not.toContain("Preview:");
  });

  it("uses Persian date and time style names", () => {
    const source = readFileSync(resolve(__dirname, "../stores/timeFormatStore.ts"), "utf8");

    expect(source).toContain('{ label: "کامل", value: "full" }');
    expect(source).toContain('{ label: "کوتاه", value: "short" }');
  });
});
