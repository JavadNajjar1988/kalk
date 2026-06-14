import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { prepareScenario } from "@/scenariostore/newScenarioStore";
import { useScenario } from "@/scenariostore";
import { createEmptyScenario } from "@/scenariostore/io";
import {
  buildSceneFromEvent,
  calculateStoryboardDurationMs,
  getTriggeredStoryboardScenes,
  resolveStoryboardScene,
  sortStoryboardScenes,
} from "@/scenariostore/storyboard";
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

describe("storyboard helpers", () => {
  it("sorts by explicit order before start time", () => {
    const scenes = sortStoryboardScenes([
      { id: "late", title: "Late", startTime: 3000 },
      { id: "ordered", title: "Ordered", startTime: 5000, order: 1 },
      { id: "early", title: "Early", startTime: 1000 },
    ]);

    expect(scenes.map((scene) => scene.id)).toEqual(["ordered", "early", "late"]);
  });

  it("clamps automatic duration from text length", () => {
    expect(
      calculateStoryboardDurationMs({
        title: "Short",
        body: "",
        defaultSceneDurationMs: 6000,
        autoDuration: true,
      }),
    ).toBe(4000);

    expect(
      calculateStoryboardDurationMs({
        title: "Long",
        body: "x".repeat(1000),
        defaultSceneDurationMs: 6000,
        autoDuration: true,
      }),
    ).toBe(12000);
  });

  it("uses manual duration before automatic duration", () => {
    expect(
      calculateStoryboardDurationMs({
        title: "Manual",
        durationMs: 8500,
        defaultSceneDurationMs: 6000,
        autoDuration: true,
      }),
    ).toBe(8500);
  });

  it("builds a scene from a scenario event", () => {
    const scene = buildSceneFromEvent({
      id: "event-1",
      _type: "scenario",
      title: "Event title",
      description: "Event description",
      startTime: 1234,
      where: { type: "units", units: ["u1"], maxZoom: 9 },
    });

    expect(scene).toMatchObject({
      title: "Event title",
      body: "Event description",
      startTime: 1234,
      linkedEventId: "event-1",
      camera: { type: "eventWhere", maxZoom: 9 },
    });
  });

  it("resolves linked event data while preserving scene overrides", () => {
    const resolved = resolveStoryboardScene(
      {
        id: "scene-1",
        title: "Override title",
        linkedEventId: "event-1",
      },
      {
        "event-1": {
          id: "event-1",
          _type: "scenario",
          title: "Event title",
          description: "Event body",
          startTime: 777,
        },
      },
    );

    expect(resolved).toMatchObject({
      id: "scene-1",
      title: "Override title",
      body: "Event body",
      startTime: 777,
      linkedEventMissing: false,
    });
  });

  it("returns scenes crossed between two timestamps once", () => {
    const triggered = getTriggeredStoryboardScenes({
      scenes: [
        { id: "before", title: "Before", startTime: 1000 },
        { id: "inside", title: "Inside", startTime: 2000 },
        { id: "after", title: "After", startTime: 3000 },
      ],
      previousTime: 1500,
      currentTime: 2500,
      displayedSceneIds: new Set(["before"]),
    });

    expect(triggered.map((scene) => scene.id)).toEqual(["inside"]);
  });
});
