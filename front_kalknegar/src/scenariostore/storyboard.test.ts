import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { prepareScenario, useNewScenarioStore } from "@/scenariostore/newScenarioStore";
import { useScenario } from "@/scenariostore";
import { createEmptyScenario } from "@/scenariostore/io";
import {
  buildSceneFromEvent,
  calculateStoryboardDurationMs,
  getTriggeredStoryboardScenes,
  resolveStoryboardScene,
  sortStoryboardScenes,
  useStoryboard,
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

  it("returns a scene at zero when crossing from a negative timestamp", () => {
    const triggered = getTriggeredStoryboardScenes({
      scenes: [{ id: "zero", title: "Zero", startTime: 0 }],
      previousTime: -100,
      currentTime: 0,
      displayedSceneIds: new Set(),
    });

    expect(triggered.map((scene) => scene.id)).toEqual(["zero"]);
  });

  it("keeps composable storyboard state and resets displayed scenes on rewind", () => {
    const store = {
      state: {
        currentTime: 2500,
        eventMap: {
          "event-1": {
            id: "event-1",
            _type: "scenario",
            title: "Linked event",
            description: "Linked body",
            startTime: 2000,
          },
        },
        storyboard: {
          enabled: true,
          settings: {
            defaultSceneDurationMs: 6000,
            autoDuration: true,
            showMode: "toast",
          },
          scenes: [
            {
              id: "scene-linked",
              title: "Scene override",
              linkedEventId: "event-1",
            },
          ],
        },
      },
    } as Parameters<typeof useStoryboard>[0];
    const storyboard = useStoryboard(store);

    expect(storyboard.resolvedScenes.value).toEqual([
      expect.objectContaining({
        id: "scene-linked",
        title: "Scene override",
        body: "Linked body",
        startTime: 2000,
      }),
    ]);

    storyboard.showScene(storyboard.resolvedScenes.value[0]);

    expect(storyboard.activeScene.value).toMatchObject({
      id: "scene-linked",
      title: "Scene override",
      body: "Linked body",
    });
    expect(storyboard.displayedSceneIds.value.has("scene-linked")).toBe(true);

    expect(storyboard.detectTriggeredScenes(1000)).toEqual([]);
    expect(storyboard.displayedSceneIds.value.size).toBe(0);
  });
});

describe("useStoryboard mutations", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("creates linked scenes for events that are not already linked", () => {
    const store = useNewScenarioStore(
      baseScenario({
        events: [
          { id: "event-1", title: "First", startTime: 1000 },
          { id: "event-2", title: "Second", startTime: 2000 },
        ],
        storyboard: {
          enabled: true,
          settings: {
            defaultSceneDurationMs: 6000,
            autoDuration: true,
            showMode: "toast",
          },
          scenes: [{ id: "existing", title: "First", linkedEventId: "event-1" }],
        },
      }),
    );
    const storyboard = useStoryboard(store);

    storyboard.createScenesFromEvents();

    expect(store.state.storyboard.scenes).toHaveLength(2);
    expect(store.state.storyboard.scenes.find((scene) => scene.id === "existing")).toEqual({
      id: "existing",
      title: "First",
      linkedEventId: "event-1",
    });
    expect(store.state.storyboard.scenes.filter((scene) => scene.id !== "existing")).toEqual([
      expect.objectContaining({
        title: "Second",
        linkedEventId: "event-2",
      }),
    ]);
    expect(store.state.storyboard.scenes.map((scene) => scene.linkedEventId)).toEqual([
      "event-1",
      "event-2",
    ]);
  });

  it("adds, updates, reorders, and deletes scenes", () => {
    const store = useNewScenarioStore(baseScenario());
    const storyboard = useStoryboard(store);

    const sceneId = storyboard.addScene({
      title: "Independent",
      body: "Text",
      startTime: 5000,
    });
    expect(store.state.storyboard.enabled).toBe(true);
    expect(store.state.storyboard.scenes.find((scene) => scene.id === sceneId)).toEqual({
      id: sceneId,
      title: "Independent",
      body: "Text",
      startTime: 5000,
      camera: { type: "none" },
    });

    storyboard.updateScene(sceneId, { title: "Updated", order: 2 });
    expect(store.state.storyboard.scenes.find((scene) => scene.id === sceneId)).toEqual(
      expect.objectContaining({
        title: "Updated",
        order: 2,
      }),
    );

    const beforeId = storyboard.addScene({ title: "Before", order: 1 });
    storyboard.reorderScenes(["before-missing-id", sceneId, beforeId]);
    expect(store.state.storyboard.scenes.find((scene) => scene.id === sceneId)).toEqual(
      expect.objectContaining({ order: 1 }),
    );
    expect(store.state.storyboard.scenes.find((scene) => scene.id === beforeId)).toEqual(
      expect.objectContaining({ order: 2 }),
    );
    expect(store.state.storyboard.scenes.some((scene) => scene.id === "before-missing-id")).toBe(
      false,
    );

    storyboard.deleteScene(sceneId);

    expect(store.state.storyboard.scenes.some((scene) => scene.id === sceneId)).toBe(false);
    expect(store.state.storyboard.scenes.find((scene) => scene.id === beforeId)).toEqual(
      expect.objectContaining({
        id: beforeId,
        title: "Before",
      }),
    );
  });
});
