// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useMeasurementsStore } from "./geoStore";
import { useUiStore } from "./uiStore";
import { useMapSettingsStore } from "./mapSettingsStore";

describe("settings persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("restores the measurement unit in a new store", async () => {
    useMeasurementsStore().measurementUnit = "nautical";
    await nextTick();
    setActivePinia(createPinia());

    expect(useMeasurementsStore().measurementUnit).toBe("nautical");
  });

  it("restores toolbar visibility in a new store", async () => {
    useUiStore().showToolbar = false;
    await nextTick();
    setActivePinia(createPinia());

    expect(useUiStore().showToolbar).toBe(false);
  });

  it("keeps day and night visibility between sessions", async () => {
    useMapSettingsStore().showDayNightTerminator = false;
    await nextTick();
    setActivePinia(createPinia());

    expect(useMapSettingsStore().showDayNightTerminator).toBe(false);
  });

  it("does not restore the removed debug mode", () => {
    localStorage.setItem("debugMode", "true");
    setActivePinia(createPinia());

    expect(useUiStore().debugMode).toBe(false);
  });
});
