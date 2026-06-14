import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { prepareScenario } from "@/scenariostore/newScenarioStore";
import { createEmptyScenario, useScenario } from "@/scenariostore";
import type { Scenario } from "@/types/scenarioModels";

function baseScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "storyboard-scenario",
    type: "ORBAT-mapper",
    version: "0.41.0",
    name: "Storyboard scenario",
    sides: [],
    events: [],
    layers: [],
    mapLayers: [],
    ...overrides,
  };
}

describe("storyboard scenario persistence", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("adds runtime storyboard defaults for old scenarios", () => {
    const state = prepareScenario(baseScenario());

    expect(state.storyboard).toEqual({
      enabled: false,
      scenes: [],
      settings: {
        defaultSceneDurationMs: 6000,
        autoDuration: true,
        showMode: "toast",
      },
    });
  });

  it("creates new scenarios with storyboard defaults", () => {
    const scenario = createEmptyScenario({ id: "new-storyboard" });

    expect(scenario.storyboard).toEqual({
      enabled: false,
      scenes: [],
      settings: {
        defaultSceneDurationMs: 6000,
        autoDuration: true,
        showMode: "toast",
      },
    });
  });

  it("serializes storyboard scenes through scenario io", () => {
    const { scenario } = useScenario();
    scenario.value.io.loadFromObject(
      baseScenario({
        storyboard: {
          enabled: true,
          settings: {
            defaultSceneDurationMs: 7000,
            autoDuration: false,
            showMode: "cinematic",
          },
          scenes: [
            {
              id: "scene-1",
              title: "Opening",
              body: "Narrative text",
              startTime: 1000,
              durationMs: 8000,
              order: 1,
              camera: { type: "none" },
            },
          ],
        },
      }),
    );

    expect(scenario.value.io.toObject().storyboard).toEqual({
      enabled: true,
      settings: {
        defaultSceneDurationMs: 7000,
        autoDuration: false,
        showMode: "cinematic",
      },
      scenes: [
        {
          id: "scene-1",
          title: "Opening",
          body: "Narrative text",
          startTime: 1000,
          durationMs: 8000,
          order: 1,
          camera: { type: "none" },
        },
      ],
    });
  });
});
