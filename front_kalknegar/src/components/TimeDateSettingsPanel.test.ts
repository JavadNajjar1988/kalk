import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("TimeDateSettingsPanel", () => {
  it("reads current scenario time reactively", () => {
    const component = readFileSync(
      resolve(__dirname, "TimeDateSettingsPanel.vue"),
      "utf8",
    );

    expect(component).toContain(
      "const currentTime = computed(() => store.state.currentTime)",
    );
    expect(component).toContain("format(currentTime.value)");
  });

  it("updates the scenario time zone from a country and location picker", () => {
    const component = readFileSync(
      resolve(__dirname, "TimeDateSettingsPanel.vue"),
      "utf8",
    );

    expect(component).toContain("<TimezoneLocationSelect");
    expect(component).toContain('v-model="scenarioTimeZone"');
    expect(component).toContain("s.info.timeZone = value");
  });
});
