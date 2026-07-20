import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useScenario } from "./index";
import type { Scenario } from "@/types/scenarioModels";

function createScenario(id: string): Scenario {
  return {
    id,
    type: "ORBAT-mapper",
    version: "0.41.0",
    name: "Autosave test",
    sides: [],
    events: [],
    layers: [],
    mapLayers: [],
  };
}

describe("useScenario", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("keeps io stable so dirty state survives repeated scenario reads", () => {
    const { scenario } = useScenario();

    scenario.value.io.loadFromObject(createScenario("autosave-test"));
    const io = scenario.value.io;

    scenario.value.store.markChanged();

    expect(io.savedDirty.value).toBe(true);
    expect(scenario.value.io).toBe(io);
    expect(scenario.value.io.savedDirty.value).toBe(true);
  });
});
