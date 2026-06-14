# Storyboard Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hybrid storyboard mode to Kalk Negar so scenario events can become narrative scenes, independent scenes can be authored, and both normal playback and dedicated story playback can show timed narrative cards on the map.

**Architecture:** Keep storyboard data optional on the existing scenario JSON model, then add a focused storyboard composable that owns scene normalization, sorting, duration calculation, triggered-scene state, and story playback state. UI is added as a new scenario-editor tab plus an overlay component mounted in the map editor; map camera integration is a thin adapter around existing event `where` and geo-store zoom helpers.

**Tech Stack:** Vue 3 composition API, TypeScript, Pinia-style existing scenario stores, Vitest, existing Headless UI tab layout, existing OpenLayers geo store helpers.

---

## Execution Notes

- Work in `C:\Users\AI\Documents\GitHub\kalk`.
- The working tree may contain unrelated user changes. Do not revert them.
- Run commands from `front_kalknegar` unless a task says otherwise.
- Use the focused Vitest commands listed inside each task.
- Use `npm run type-check` before final completion.
- Commit only files touched by the current task.

## File Structure

- Modify `front_kalknegar/src/types/scenarioModels.ts`
  - Add public `Storyboard`, `StoryboardScene`, `StoryboardSettings`, and `StoryboardCamera` types.
  - Add optional `storyboard?: Storyboard` to `Scenario`.
- Modify `front_kalknegar/src/types/internalModels.ts`
  - Add `NStoryboardScene` and `NStoryboard` internal types for normalized store state.
- Modify `front_kalknegar/src/scenariostore/newScenarioStore.ts`
  - Add `storyboard` to `ScenarioState`.
  - Normalize missing storyboard into defaults during `prepareScenario`.
- Modify `front_kalknegar/src/scenariostore/io.ts`
  - Add default storyboard to `createEmptyScenario`.
  - Serialize storyboard in `toObject`.
- Create `front_kalknegar/src/scenariostore/storyboard.ts`
  - Pure helpers plus `useStoryboard(store, cameraAdapter?)`.
  - Sort, resolve, duration, trigger detection, scene generation, update methods, playback state.
- Create `front_kalknegar/src/scenariostore/storyboard.test.ts`
  - Unit coverage for data behavior.
- Create `front_kalknegar/src/modules/scenarioeditor/StoryboardPanel.vue`
  - Main editor panel.
- Create `front_kalknegar/src/modules/scenarioeditor/StoryboardSceneList.vue`
  - Reusable scene list.
- Create `front_kalknegar/src/modules/scenarioeditor/StoryboardSceneForm.vue`
  - Scene editor form.
- Create `front_kalknegar/src/modules/scenarioeditor/StoryboardOverlay.vue`
  - Map narrative card.
- Create `front_kalknegar/src/modules/scenarioeditor/StoryboardPlaybackControls.vue`
  - Story playback controls.
- Modify `front_kalknegar/src/modules/scenarioeditor/MapEditorDesktopPanel.vue`
  - Add storyboard tab.
- Modify `front_kalknegar/src/modules/scenarioeditor/MapEditorMobilePanel.vue`
  - Add storyboard tab.
- Modify `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`
  - Mount overlay and playback controls.
  - Connect normal time playback to storyboard trigger detection.

---

### Task 1: Storyboard Types and Scenario Serialization

**Files:**
- Modify: `front_kalknegar/src/types/scenarioModels.ts`
- Modify: `front_kalknegar/src/types/internalModels.ts`
- Modify: `front_kalknegar/src/scenariostore/newScenarioStore.ts`
- Modify: `front_kalknegar/src/scenariostore/io.ts`
- Test: `front_kalknegar/src/scenariostore/storyboard.test.ts`

- [ ] **Step 1: Write failing tests for defaults and serialization**

Create `front_kalknegar/src/scenariostore/storyboard.test.ts` with this initial content:

```ts
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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: TypeScript/runtime failure because `Scenario.storyboard` and `ScenarioState.storyboard` are not implemented.

- [ ] **Step 3: Add public storyboard model types**

In `front_kalknegar/src/types/scenarioModels.ts`, add these exports near `ScenarioEvent` types:

```ts
export type StoryboardShowMode = "toast" | "cinematic";

export interface StoryboardSettings {
  defaultSceneDurationMs: number;
  autoDuration: boolean;
  showMode: StoryboardShowMode;
}

export type StoryboardCamera =
  | { type: "none" }
  | { type: "eventWhere"; maxZoom?: number }
  | { type: "geometry"; geometry: GeometryWhere["geometry"]; maxZoom?: number }
  | { type: "units"; units: EntityId[]; maxZoom?: number };

export interface StoryboardScene {
  id: EntityId;
  title: string;
  body?: string;
  startTime?: ScenarioTime;
  durationMs?: number;
  order?: number;
  linkedEventId?: EntityId;
  camera?: StoryboardCamera;
  pausePlayback?: boolean;
}

export interface Storyboard {
  enabled: boolean;
  scenes: StoryboardScene[];
  settings: StoryboardSettings;
}
```

In the `Scenario` interface, add:

```ts
storyboard?: Storyboard;
```

- [ ] **Step 4: Add internal storyboard types**

In `front_kalknegar/src/types/internalModels.ts`, import the new types if not already available and add:

```ts
export interface NStoryboardScene extends StoryboardScene {
  id: EntityId;
}

export interface NStoryboard extends Storyboard {
  scenes: NStoryboardScene[];
}
```

- [ ] **Step 5: Normalize storyboard in scenario state**

In `front_kalknegar/src/scenariostore/newScenarioStore.ts`, import `Storyboard` and `StoryboardScene`, then add `storyboard` to `ScenarioState`:

```ts
storyboard: Storyboard;
```

Add helper functions above `prepareScenario`:

```ts
export const DEFAULT_STORYBOARD_SETTINGS = {
  defaultSceneDurationMs: 6000,
  autoDuration: true,
  showMode: "toast" as const,
};

export function normalizeStoryboard(storyboard?: Storyboard): Storyboard {
  return {
    enabled: storyboard?.enabled ?? false,
    settings: {
      ...DEFAULT_STORYBOARD_SETTINGS,
      ...(storyboard?.settings ?? {}),
    },
    scenes: (storyboard?.scenes ?? []).map((scene: StoryboardScene) => ({
      ...scene,
      id: scene.id ?? nanoid(),
      startTime:
        scene.startTime !== undefined ? +dayjs(scene.startTime) : undefined,
    })),
  };
}
```

In the `prepareScenario` return object, add:

```ts
storyboard: normalizeStoryboard(scenario.storyboard),
```

- [ ] **Step 6: Add defaults and serialization**

In `front_kalknegar/src/scenariostore/io.ts`, import `DEFAULT_STORYBOARD_SETTINGS`:

```ts
import { DEFAULT_STORYBOARD_SETTINGS } from "./newScenarioStore";
```

In `createEmptyScenario`, add this property to the returned object:

```ts
storyboard: {
  enabled: false,
  scenes: [],
  settings: { ...DEFAULT_STORYBOARD_SETTINGS },
},
```

In `toObject`, add:

```ts
storyboard: klona(state.storyboard),
```

- [ ] **Step 7: Run focused tests**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add front_kalknegar/src/types/scenarioModels.ts front_kalknegar/src/types/internalModels.ts front_kalknegar/src/scenariostore/newScenarioStore.ts front_kalknegar/src/scenariostore/io.ts front_kalknegar/src/scenariostore/storyboard.test.ts
git commit -m "feat: add storyboard scenario model"
```

---

### Task 2: Storyboard Pure Helpers

**Files:**
- Create: `front_kalknegar/src/scenariostore/storyboard.ts`
- Modify: `front_kalknegar/src/scenariostore/storyboard.test.ts`

- [ ] **Step 1: Add failing helper tests**

Append these tests to `front_kalknegar/src/scenariostore/storyboard.test.ts`:

```ts
import {
  buildSceneFromEvent,
  calculateStoryboardDurationMs,
  getTriggeredStoryboardScenes,
  resolveStoryboardScene,
  sortStoryboardScenes,
} from "@/scenariostore/storyboard";

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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: FAIL because `@/scenariostore/storyboard` does not exist.

- [ ] **Step 3: Create helper implementation**

Create `front_kalknegar/src/scenariostore/storyboard.ts`:

```ts
import { computed, ref } from "vue";
import { nanoid } from "@/utils";
import type { EntityId } from "@/types/base";
import type {
  ScenarioEvent,
  StoryboardCamera,
  StoryboardScene,
} from "@/types/scenarioModels";
import type { NScenarioEvent } from "@/types/internalModels";
import type { NewScenarioStore } from "@/scenariostore/newScenarioStore";

export interface ResolvedStoryboardScene extends StoryboardScene {
  linkedEventMissing: boolean;
}

export interface DurationInput {
  title?: string;
  body?: string;
  durationMs?: number;
  defaultSceneDurationMs: number;
  autoDuration: boolean;
}

export function calculateStoryboardDurationMs(input: DurationInput): number {
  if (Number.isFinite(input.durationMs) && input.durationMs! > 0) {
    return input.durationMs!;
  }

  if (!input.autoDuration) {
    return input.defaultSceneDurationMs;
  }

  const textLength = `${input.title ?? ""} ${input.body ?? ""}`.trim().length;
  const calculated = 3500 + textLength * 45;
  return Math.min(12000, Math.max(4000, Math.round(calculated)));
}

export function sortStoryboardScenes<T extends StoryboardScene>(scenes: T[]): T[] {
  return [...scenes].sort((a, b) => {
    const aHasOrder = Number.isFinite(a.order);
    const bHasOrder = Number.isFinite(b.order);
    if (aHasOrder && bHasOrder && a.order !== b.order) return a.order! - b.order!;
    if (aHasOrder && !bHasOrder) return -1;
    if (!aHasOrder && bHasOrder) return 1;

    const aTime = a.startTime ?? Number.MAX_SAFE_INTEGER;
    const bTime = b.startTime ?? Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;
    return a.title.localeCompare(b.title);
  });
}

export function buildSceneFromEvent(event: NScenarioEvent | ScenarioEvent): StoryboardScene {
  const camera: StoryboardCamera | undefined =
    event.where && "maxZoom" in event.where
      ? { type: "eventWhere", maxZoom: event.where.maxZoom }
      : event.where
        ? { type: "eventWhere" }
        : undefined;

  return {
    id: nanoid(),
    title: event.title,
    body: event.description,
    startTime: event.startTime,
    linkedEventId: event.id,
    camera,
  };
}

export function resolveStoryboardScene(
  scene: StoryboardScene,
  eventMap: Record<EntityId, NScenarioEvent>,
): ResolvedStoryboardScene {
  const event = scene.linkedEventId ? eventMap[scene.linkedEventId] : undefined;
  return {
    ...scene,
    title: scene.title || event?.title || "",
    body: scene.body ?? event?.description,
    startTime: scene.startTime ?? event?.startTime,
    camera: scene.camera ?? (event?.where ? { type: "eventWhere" } : undefined),
    linkedEventMissing: Boolean(scene.linkedEventId && !event),
  };
}

export interface TriggeredScenesInput {
  scenes: StoryboardScene[];
  previousTime: number;
  currentTime: number;
  displayedSceneIds: Set<EntityId>;
}

export function getTriggeredStoryboardScenes(input: TriggeredScenesInput): StoryboardScene[] {
  if (input.currentTime < input.previousTime) return [];

  return sortStoryboardScenes(input.scenes).filter((scene) => {
    if (!scene.startTime) return false;
    if (input.displayedSceneIds.has(scene.id)) return false;
    return scene.startTime > input.previousTime && scene.startTime <= input.currentTime;
  });
}

export function useStoryboard(store: NewScenarioStore) {
  const displayedSceneIds = ref<Set<EntityId>>(new Set());
  const activeScene = ref<ResolvedStoryboardScene | null>(null);
  const storyPlaybackRunning = ref(false);
  const storyPlaybackIndex = ref(0);
  const previousTime = ref(store.state.currentTime);

  const resolvedScenes = computed(() =>
    sortStoryboardScenes(
      store.state.storyboard.scenes.map((scene) =>
        resolveStoryboardScene(scene, store.state.eventMap),
      ),
    ),
  );

  function markDisplayed(sceneId: EntityId) {
    displayedSceneIds.value.add(sceneId);
  }

  function resetDisplayedScenes() {
    displayedSceneIds.value = new Set();
  }

  function detectTriggeredScenes(currentTime: number) {
    if (currentTime < previousTime.value) {
      resetDisplayedScenes();
    }

    const triggered = getTriggeredStoryboardScenes({
      scenes: resolvedScenes.value,
      previousTime: previousTime.value,
      currentTime,
      displayedSceneIds: displayedSceneIds.value,
    });

    previousTime.value = currentTime;
    return triggered;
  }

  function showScene(scene: StoryboardScene) {
    const resolved = resolveStoryboardScene(scene, store.state.eventMap);
    if (!resolved.title && !resolved.body) return;
    activeScene.value = resolved;
    markDisplayed(resolved.id);
  }

  function clearActiveScene() {
    activeScene.value = null;
  }

  return {
    activeScene,
    resolvedScenes,
    displayedSceneIds,
    storyPlaybackRunning,
    storyPlaybackIndex,
    clearActiveScene,
    detectTriggeredScenes,
    markDisplayed,
    resetDisplayedScenes,
    showScene,
  };
}
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add front_kalknegar/src/scenariostore/storyboard.ts front_kalknegar/src/scenariostore/storyboard.test.ts
git commit -m "feat: add storyboard scene helpers"
```

---

### Task 3: Storyboard Store Mutations

**Files:**
- Modify: `front_kalknegar/src/scenariostore/storyboard.ts`
- Modify: `front_kalknegar/src/scenariostore/storyboard.test.ts`

- [ ] **Step 1: Add failing mutation tests**

Append:

```ts
import { useNewScenarioStore } from "@/scenariostore/newScenarioStore";
import { useStoryboard } from "@/scenariostore/storyboard";

describe("useStoryboard mutations", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("creates linked scenes for events that are not already linked", () => {
    const store = useNewScenarioStore(
      prepareScenario(
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
      ),
    );
    const storyboard = useStoryboard(store);

    storyboard.createScenesFromEvents();

    expect(store.state.storyboard.scenes.map((scene) => scene.linkedEventId)).toEqual([
      "event-1",
      "event-2",
    ]);
  });

  it("adds, updates, reorders, and deletes scenes", () => {
    const store = useNewScenarioStore(prepareScenario(baseScenario()));
    const storyboard = useStoryboard(store);

    const sceneId = storyboard.addScene({
      title: "Independent",
      body: "Text",
      startTime: 5000,
    });
    storyboard.updateScene(sceneId, { title: "Updated", order: 2 });
    storyboard.addScene({ title: "Before", order: 1 });
    storyboard.reorderScenes(["before-missing-id", sceneId]);
    storyboard.deleteScene(sceneId);

    expect(store.state.storyboard.scenes.some((scene) => scene.id === sceneId)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: FAIL because mutation methods do not exist.

- [ ] **Step 3: Add mutation methods**

In `useStoryboard`, add these functions before `return`:

```ts
function createScenesFromEvents() {
  store.update((state) => {
    const linkedIds = new Set(
      state.storyboard.scenes
        .map((scene) => scene.linkedEventId)
        .filter((id): id is EntityId => Boolean(id)),
    );

    state.events.forEach((eventId) => {
      if (linkedIds.has(eventId)) return;
      const event = state.eventMap[eventId];
      if (!event || event._type !== "scenario") return;
      state.storyboard.scenes.push(buildSceneFromEvent(event));
    });
  });
}

function addScene(scene: Omit<StoryboardScene, "id"> & { id?: EntityId }) {
  const id = scene.id ?? nanoid();
  store.update((state) => {
    state.storyboard.enabled = true;
    state.storyboard.scenes.push({
      ...scene,
      id,
      camera: scene.camera ?? { type: "none" },
    });
  });
  return id;
}

function updateScene(id: EntityId, patch: Partial<StoryboardScene>) {
  store.update((state) => {
    const scene = state.storyboard.scenes.find((item) => item.id === id);
    if (!scene) return;
    Object.assign(scene, patch);
  });
}

function deleteScene(id: EntityId) {
  store.update((state) => {
    state.storyboard.scenes = state.storyboard.scenes.filter((scene) => scene.id !== id);
  });
  displayedSceneIds.value.delete(id);
  if (activeScene.value?.id === id) activeScene.value = null;
}

function reorderScenes(sceneIds: EntityId[]) {
  store.update((state) => {
    const knownIds = new Set(state.storyboard.scenes.map((scene) => scene.id));
    sceneIds
      .filter((id) => knownIds.has(id))
      .forEach((id, index) => {
        const scene = state.storyboard.scenes.find((item) => item.id === id);
        if (scene) scene.order = index + 1;
      });
  });
}
```

Add these names to the returned object:

```ts
addScene,
createScenesFromEvents,
deleteScene,
reorderScenes,
updateScene,
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add front_kalknegar/src/scenariostore/storyboard.ts front_kalknegar/src/scenariostore/storyboard.test.ts
git commit -m "feat: add storyboard scene mutations"
```

---

### Task 4: Storyboard Editor Panel

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/StoryboardPanel.vue`
- Create: `front_kalknegar/src/modules/scenarioeditor/StoryboardSceneList.vue`
- Create: `front_kalknegar/src/modules/scenarioeditor/StoryboardSceneForm.vue`
- Modify: `front_kalknegar/src/modules/scenarioeditor/MapEditorDesktopPanel.vue`
- Modify: `front_kalknegar/src/modules/scenarioeditor/MapEditorMobilePanel.vue`

- [ ] **Step 1: Create the scene list component**

Create `front_kalknegar/src/modules/scenarioeditor/StoryboardSceneList.vue`:

```vue
<script setup lang="ts">
import type { ResolvedStoryboardScene } from "@/scenariostore/storyboard";
import { calculateStoryboardDurationMs } from "@/scenariostore/storyboard";
import type { StoryboardSettings } from "@/types/scenarioModels";

const props = defineProps<{
  scenes: ResolvedStoryboardScene[];
  selectedId?: string | null;
  settings: StoryboardSettings;
}>();

const emit = defineEmits<{
  select: [sceneId: string];
  moveUp: [sceneId: string];
  moveDown: [sceneId: string];
  delete: [sceneId: string];
}>();

function durationLabel(scene: ResolvedStoryboardScene) {
  const ms = calculateStoryboardDurationMs({
    title: scene.title,
    body: scene.body,
    durationMs: scene.durationMs,
    defaultSceneDurationMs: props.settings.defaultSceneDurationMs,
    autoDuration: props.settings.autoDuration,
  });
  return `${Math.round(ms / 1000)}s`;
}
</script>

<template>
  <ol class="space-y-2">
    <li
      v-for="(scene, index) in scenes"
      :key="scene.id"
      class="rounded-md border p-3 text-sm"
      :class="scene.id === selectedId ? 'border-red-900 bg-red-50' : 'border-sidebar-border bg-sidebar'"
    >
      <button class="w-full text-right" type="button" @click="emit('select', scene.id)">
        <div class="flex items-center justify-between gap-3">
          <span class="font-medium">{{ scene.title || 'بدون عنوان' }}</span>
          <span class="text-muted-foreground text-xs">{{ durationLabel(scene) }}</span>
        </div>
        <p v-if="scene.body" class="text-muted-foreground mt-1 line-clamp-2">
          {{ scene.body }}
        </p>
        <p v-if="scene.linkedEventMissing" class="mt-1 text-xs text-red-700">
          رویداد لینک شده یافت نشد
        </p>
      </button>

      <div class="mt-3 flex items-center gap-2">
        <button type="button" class="rounded border px-2 py-1 text-xs" :disabled="index === 0" @click="emit('moveUp', scene.id)">
          بالا
        </button>
        <button type="button" class="rounded border px-2 py-1 text-xs" :disabled="index === scenes.length - 1" @click="emit('moveDown', scene.id)">
          پایین
        </button>
        <button type="button" class="mr-auto rounded border border-red-300 px-2 py-1 text-xs text-red-700" @click="emit('delete', scene.id)">
          حذف
        </button>
      </div>
    </li>
  </ol>
</template>
```

- [ ] **Step 2: Create the scene form component**

Create `front_kalknegar/src/modules/scenarioeditor/StoryboardSceneForm.vue`:

```vue
<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { StoryboardScene } from "@/types/scenarioModels";

const props = defineProps<{ scene?: StoryboardScene | null }>();
const emit = defineEmits<{
  save: [patch: Partial<StoryboardScene>];
  unlink: [];
}>();

const form = reactive({
  title: "",
  body: "",
  startTime: undefined as number | undefined,
  durationSeconds: undefined as number | undefined,
  pausePlayback: false,
});

watch(
  () => props.scene,
  (scene) => {
    form.title = scene?.title ?? "";
    form.body = scene?.body ?? "";
    form.startTime = scene?.startTime;
    form.durationSeconds = scene?.durationMs ? Math.round(scene.durationMs / 1000) : undefined;
    form.pausePlayback = scene?.pausePlayback ?? false;
  },
  { immediate: true },
);

const hasScene = computed(() => Boolean(props.scene));

function save() {
  if (!hasScene.value) return;
  emit("save", {
    title: form.title,
    body: form.body,
    startTime: form.startTime,
    durationMs: form.durationSeconds ? form.durationSeconds * 1000 : undefined,
    pausePlayback: form.pausePlayback,
  });
}
</script>

<template>
  <form v-if="scene" class="space-y-3" @submit.prevent="save">
    <label class="block text-sm">
      <span class="mb-1 block text-xs text-muted-foreground">عنوان</span>
      <input v-model="form.title" class="w-full rounded border px-3 py-2" />
    </label>

    <label class="block text-sm">
      <span class="mb-1 block text-xs text-muted-foreground">متن روایت</span>
      <textarea v-model="form.body" class="min-h-28 w-full rounded border px-3 py-2" />
    </label>

    <label class="block text-sm">
      <span class="mb-1 block text-xs text-muted-foreground">زمان سناریو</span>
      <input v-model.number="form.startTime" type="number" class="w-full rounded border px-3 py-2" />
    </label>

    <label class="block text-sm">
      <span class="mb-1 block text-xs text-muted-foreground">مدت نمایش دستی، ثانیه</span>
      <input v-model.number="form.durationSeconds" type="number" min="1" class="w-full rounded border px-3 py-2" />
    </label>

    <label class="flex items-center gap-2 text-sm">
      <input v-model="form.pausePlayback" type="checkbox" />
      <span>توقف پخش بعد از این صحنه</span>
    </label>

    <div class="flex gap-2">
      <button type="submit" class="rounded bg-red-900 px-3 py-2 text-sm text-white">
        ذخیره
      </button>
      <button v-if="scene.linkedEventId" type="button" class="rounded border px-3 py-2 text-sm" @click="emit('unlink')">
        قطع لینک رویداد
      </button>
    </div>
  </form>
  <p v-else class="text-muted-foreground text-sm">یک صحنه را انتخاب کنید.</p>
</template>
```

- [ ] **Step 3: Create the main panel**

Create `front_kalknegar/src/modules/scenarioeditor/StoryboardPanel.vue`:

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { useStoryboard } from "@/scenariostore/storyboard";
import StoryboardSceneForm from "@/modules/scenarioeditor/StoryboardSceneForm.vue";
import StoryboardSceneList from "@/modules/scenarioeditor/StoryboardSceneList.vue";
import type { StoryboardScene } from "@/types/scenarioModels";

const activeScenario = injectStrict(activeScenarioKey);
const storyboard = useStoryboard(activeScenario.store);
const selectedSceneId = ref<string | null>(null);

const selectedScene = computed(() =>
  activeScenario.store.state.storyboard.scenes.find((scene) => scene.id === selectedSceneId.value),
);

function addIndependentScene() {
  selectedSceneId.value = storyboard.addScene({
    title: "صحنه جدید",
    body: "",
    startTime: activeScenario.store.state.currentTime,
    camera: { type: "none" },
  });
}

function moveScene(sceneId: string, direction: -1 | 1) {
  const ids = storyboard.resolvedScenes.value.map((scene) => scene.id);
  const index = ids.indexOf(sceneId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return;
  const reordered = [...ids];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  storyboard.reorderScenes(reordered);
}

function updateSelectedScene(patch: Partial<StoryboardScene>) {
  if (!selectedSceneId.value) return;
  storyboard.updateScene(selectedSceneId.value, patch);
}

function unlinkSelectedScene() {
  updateSelectedScene({ linkedEventId: undefined });
}
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold">استوری برد</h2>
      <div class="flex gap-2">
        <button type="button" class="rounded border px-2 py-1 text-xs" @click="storyboard.createScenesFromEvents()">
          ساخت از رویدادها
        </button>
        <button type="button" class="rounded border px-2 py-1 text-xs" @click="addIndependentScene">
          افزودن صحنه
        </button>
      </div>
    </header>

    <StoryboardSceneList
      :scenes="storyboard.resolvedScenes.value"
      :settings="activeScenario.store.state.storyboard.settings"
      :selected-id="selectedSceneId"
      @select="selectedSceneId = $event"
      @move-up="moveScene($event, -1)"
      @move-down="moveScene($event, 1)"
      @delete="storyboard.deleteScene($event)"
    />

    <StoryboardSceneForm
      :scene="selectedScene"
      @save="updateSelectedScene"
      @unlink="unlinkSelectedScene"
    />
  </section>
</template>
```

- [ ] **Step 4: Add desktop tab**

In `front_kalknegar/src/modules/scenarioeditor/MapEditorDesktopPanel.vue`, import:

```ts
import StoryboardPanel from "@/modules/scenarioeditor/StoryboardPanel.vue";
```

Change tab labels from:

```vue
v-for="tab in ['آرایش نبرد', 'رویدادها', 'لایه‌ها', 'تنظیمات', 'فیلتر']"
```

to:

```vue
v-for="tab in ['آرایش نبرد', 'رویدادها', 'استوری برد', 'لایه‌ها', 'تنظیمات', 'فیلتر']"
```

Add a `TabPanel` after the events panel:

```vue
<TabPanel class="p-2 pb-6">
  <StoryboardPanel />
</TabPanel>
```

- [ ] **Step 5: Add mobile tab**

In `front_kalknegar/src/modules/scenarioeditor/MapEditorMobilePanel.vue`, import:

```ts
import StoryboardPanel from "@/modules/scenarioeditor/StoryboardPanel.vue";
```

Change tab labels from:

```vue
v-for="tab in ['آرایش نبرد', 'رویدادها', 'لایه‌ها', 'تنظیمات', 'فیلتر', 'جزئیات']"
```

to:

```vue
v-for="tab in ['آرایش نبرد', 'رویدادها', 'استوری برد', 'لایه‌ها', 'تنظیمات', 'فیلتر', 'جزئیات']"
```

Add a `TabPanel` after the events panel:

```vue
<TabPanel class="p-4 pb-10">
  <StoryboardPanel />
</TabPanel>
```

- [ ] **Step 6: Run type check**

Run:

```powershell
cd front_kalknegar
npm run type-check
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add front_kalknegar/src/modules/scenarioeditor/StoryboardPanel.vue front_kalknegar/src/modules/scenarioeditor/StoryboardSceneList.vue front_kalknegar/src/modules/scenarioeditor/StoryboardSceneForm.vue front_kalknegar/src/modules/scenarioeditor/MapEditorDesktopPanel.vue front_kalknegar/src/modules/scenarioeditor/MapEditorMobilePanel.vue
git commit -m "feat: add storyboard editor panel"
```

---

### Task 5: Narrative Overlay and Normal Playback Triggers

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/StoryboardOverlay.vue`
- Modify: `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`
- Modify: `front_kalknegar/src/scenariostore/storyboard.ts`
- Modify: `front_kalknegar/src/scenariostore/storyboard.test.ts`

- [ ] **Step 1: Add trigger state test**

Append:

```ts
describe("normal storyboard playback triggers", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("shows a scene once when current time crosses its start time", () => {
    const store = useNewScenarioStore(
      prepareScenario(
        baseScenario({
          storyboard: {
            enabled: true,
            settings: {
              defaultSceneDurationMs: 6000,
              autoDuration: true,
              showMode: "toast",
            },
            scenes: [{ id: "scene-1", title: "Crossed", startTime: 2000 }],
          },
        }),
      ),
    );
    const storyboard = useStoryboard(store);

    expect(storyboard.detectTriggeredScenes(1500)).toHaveLength(0);
    const triggered = storyboard.detectTriggeredScenes(2500);
    triggered.forEach((scene) => storyboard.showScene(scene));

    expect(storyboard.activeScene.value?.id).toBe("scene-1");
    expect(storyboard.detectTriggeredScenes(3000)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run focused tests**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: PASS if Task 2 implementation already supports this; otherwise fix `detectTriggeredScenes`.

- [ ] **Step 3: Create overlay component**

Create `front_kalknegar/src/modules/scenarioeditor/StoryboardOverlay.vue`:

```vue
<script setup lang="ts">
import { computed, watch } from "vue";
import { calculateStoryboardDurationMs, type ResolvedStoryboardScene } from "@/scenariostore/storyboard";
import type { StoryboardSettings } from "@/types/scenarioModels";

const props = defineProps<{
  scene: ResolvedStoryboardScene | null;
  settings: StoryboardSettings;
}>();

const emit = defineEmits<{ close: [] }>();

let closeTimer: ReturnType<typeof setTimeout> | undefined;

const durationMs = computed(() => {
  if (!props.scene) return props.settings.defaultSceneDurationMs;
  return calculateStoryboardDurationMs({
    title: props.scene.title,
    body: props.scene.body,
    durationMs: props.scene.durationMs,
    defaultSceneDurationMs: props.settings.defaultSceneDurationMs,
    autoDuration: props.settings.autoDuration,
  });
});

watch(
  () => props.scene?.id,
  () => {
    if (closeTimer) clearTimeout(closeTimer);
    if (!props.scene) return;
    closeTimer = setTimeout(() => emit("close"), durationMs.value);
  },
  { immediate: true },
);
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <article
      v-if="scene"
      class="pointer-events-auto mx-auto mb-20 max-w-2xl rounded-md border border-red-900/20 bg-white/95 p-4 text-right shadow-lg"
      dir="rtl"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-950">{{ scene.title }}</h2>
          <p v-if="scene.body" class="mt-2 whitespace-pre-line text-sm leading-7 text-gray-700">
            {{ scene.body }}
          </p>
        </div>
        <button type="button" class="rounded px-2 text-lg text-gray-500 hover:text-gray-900" @click="emit('close')">
          ×
        </button>
      </div>
    </article>
  </transition>
</template>
```

- [ ] **Step 4: Mount overlay and trigger on time changes**

In `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`, import:

```ts
import StoryboardOverlay from "@/modules/scenarioeditor/StoryboardOverlay.vue";
import { useStoryboard } from "@/scenariostore/storyboard";
```

Create instance near `activeScenario`:

```ts
const storyboard = useStoryboard(activeScenario.store);
```

Inside the absolute `main` overlay, after the header and before `MapEditorDetailsPanel`, add:

```vue
<div class="pointer-events-none absolute inset-x-4 bottom-0 z-40 flex justify-center">
  <StoryboardOverlay
    :scene="storyboard.activeScene.value"
    :settings="state.storyboard.settings"
    @close="storyboard.clearActiveScene()"
  />
</div>
```

Add a watcher after playback watcher:

```ts
watch(
  () => state.currentTime,
  (currentTime) => {
    if (!state.storyboard.enabled) return;
    if (state.storyboard.settings.showMode !== "toast") return;
    const triggered = storyboard.detectTriggeredScenes(currentTime);
    const nextScene = triggered[0];
    if (nextScene) storyboard.showScene(nextScene);
  },
);
```

- [ ] **Step 5: Run focused tests and type check**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
npm run type-check
```

Expected: both PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add front_kalknegar/src/modules/scenarioeditor/StoryboardOverlay.vue front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue front_kalknegar/src/scenariostore/storyboard.ts front_kalknegar/src/scenariostore/storyboard.test.ts
git commit -m "feat: show storyboard overlay during playback"
```

---

### Task 6: Story Playback Controls and Scene-by-Scene Playback

**Files:**
- Create: `front_kalknegar/src/modules/scenarioeditor/StoryboardPlaybackControls.vue`
- Modify: `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`
- Modify: `front_kalknegar/src/scenariostore/storyboard.ts`
- Modify: `front_kalknegar/src/scenariostore/storyboard.test.ts`

- [ ] **Step 1: Add story playback tests**

Append:

```ts
describe("story playback mode", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts, advances, and stops story playback by scene order", () => {
    const store = useNewScenarioStore(
      prepareScenario(
        baseScenario({
          storyboard: {
            enabled: true,
            settings: {
              defaultSceneDurationMs: 6000,
              autoDuration: true,
              showMode: "cinematic",
            },
            scenes: [
              { id: "scene-2", title: "Second", startTime: 2000, order: 2 },
              { id: "scene-1", title: "First", startTime: 1000, order: 1 },
            ],
          },
        }),
      ),
    );
    const storyboard = useStoryboard(store);

    storyboard.startStoryPlayback();
    expect(storyboard.activeScene.value?.id).toBe("scene-1");
    expect(storyboard.storyPlaybackRunning.value).toBe(true);

    storyboard.nextStoryScene();
    expect(storyboard.activeScene.value?.id).toBe("scene-2");

    storyboard.nextStoryScene();
    expect(storyboard.storyPlaybackRunning.value).toBe(false);
    expect(storyboard.activeScene.value).toBe(null);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: FAIL because story playback methods do not exist.

- [ ] **Step 3: Add playback methods**

In `useStoryboard`, add:

```ts
function showStorySceneAt(index: number) {
  const scene = resolvedScenes.value[index];
  if (!scene) {
    storyPlaybackRunning.value = false;
    activeScene.value = null;
    return;
  }
  storyPlaybackIndex.value = index;
  showScene(scene);
}

function startStoryPlayback() {
  store.update((state) => {
    state.storyboard.enabled = true;
    state.storyboard.settings.showMode = "cinematic";
  });
  resetDisplayedScenes();
  storyPlaybackRunning.value = true;
  showStorySceneAt(0);
}

function stopStoryPlayback() {
  storyPlaybackRunning.value = false;
  activeScene.value = null;
}

function nextStoryScene() {
  const nextIndex = storyPlaybackIndex.value + 1;
  if (nextIndex >= resolvedScenes.value.length) {
    stopStoryPlayback();
    return;
  }
  showStorySceneAt(nextIndex);
}

function previousStoryScene() {
  showStorySceneAt(Math.max(0, storyPlaybackIndex.value - 1));
}
```

Return:

```ts
nextStoryScene,
previousStoryScene,
startStoryPlayback,
stopStoryPlayback,
```

- [ ] **Step 4: Create playback controls**

Create `front_kalknegar/src/modules/scenarioeditor/StoryboardPlaybackControls.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{
  running: boolean;
  hasScenes: boolean;
}>();

const emit = defineEmits<{
  start: [];
  stop: [];
  previous: [];
  next: [];
}>();
</script>

<template>
  <div class="pointer-events-auto flex items-center gap-2 rounded-md border bg-white/95 p-2 shadow">
    <button
      v-if="!running"
      type="button"
      class="rounded bg-red-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      :disabled="!hasScenes"
      @click="emit('start')"
    >
      پخش استوری
    </button>
    <template v-else>
      <button type="button" class="rounded border px-2 py-1 text-sm" @click="emit('previous')">
        قبلی
      </button>
      <button type="button" class="rounded border px-2 py-1 text-sm" @click="emit('next')">
        بعدی
      </button>
      <button type="button" class="rounded border border-red-300 px-2 py-1 text-sm text-red-700" @click="emit('stop')">
        توقف
      </button>
    </template>
  </div>
</template>
```

- [ ] **Step 5: Mount controls in map editor**

In `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`, import:

```ts
import StoryboardPlaybackControls from "@/modules/scenarioeditor/StoryboardPlaybackControls.vue";
```

Inside the absolute `main` overlay header, after `MapTimeController`, add:

```vue
<StoryboardPlaybackControls
  :running="storyboard.storyPlaybackRunning.value"
  :has-scenes="storyboard.resolvedScenes.value.length > 0"
  @start="storyboard.startStoryPlayback()"
  @stop="storyboard.stopStoryPlayback()"
  @previous="storyboard.previousStoryScene()"
  @next="storyboard.nextStoryScene()"
/>
```

Add a watcher to set map time when story scene changes:

```ts
watch(
  () => storyboard.activeScene.value?.startTime,
  (sceneTime) => {
    if (!storyboard.storyPlaybackRunning.value) return;
    if (sceneTime === undefined) return;
    setCurrentTime(sceneTime);
  },
);
```

- [ ] **Step 6: Run tests and type check**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
npm run type-check
```

Expected: both PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add front_kalknegar/src/modules/scenarioeditor/StoryboardPlaybackControls.vue front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue front_kalknegar/src/scenariostore/storyboard.ts front_kalknegar/src/scenariostore/storyboard.test.ts
git commit -m "feat: add storyboard playback controls"
```

---

### Task 7: Camera Application

**Files:**
- Modify: `front_kalknegar/src/scenariostore/storyboard.ts`
- Modify: `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`

- [ ] **Step 1: Add camera helper to composable**

In `front_kalknegar/src/scenariostore/storyboard.ts`, add optional dependencies:

```ts
export interface StoryboardCameraAdapter {
  zoomToUnits: (unitIds: EntityId[], maxZoom?: number) => void;
  zoomToGeometry: (geometry: unknown, maxZoom?: number) => void;
  zoomToEventWhere: (eventId: EntityId, maxZoom?: number) => void;
}
```

Change the `useStoryboard` signature:

```ts
export function useStoryboard(
  store: NewScenarioStore,
  cameraAdapter?: StoryboardCameraAdapter,
) {
```

Add:

```ts
function applySceneCamera(scene: ResolvedStoryboardScene) {
  if (!cameraAdapter || !scene.camera || scene.camera.type === "none") return;

  if (scene.camera.type === "units") {
    cameraAdapter.zoomToUnits(scene.camera.units, scene.camera.maxZoom);
    return;
  }

  if (scene.camera.type === "geometry") {
    cameraAdapter.zoomToGeometry(scene.camera.geometry, scene.camera.maxZoom);
    return;
  }

  if (scene.camera.type === "eventWhere" && scene.linkedEventId) {
    cameraAdapter.zoomToEventWhere(scene.linkedEventId, scene.camera.maxZoom);
  }
}
```

Call it at the end of `showScene` after setting `activeScene.value`:

```ts
applySceneCamera(resolved);
```

- [ ] **Step 2: Wire map camera adapter**

In `front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue`, import:

```ts
import { useGeoStore } from "@/stores/geoStore";
```

Create geo store:

```ts
const geoStore = useGeoStore();
```

Change storyboard initialization to:

```ts
const storyboard = useStoryboard(activeScenario.store, {
  zoomToUnits: (unitIds, maxZoom) => {
    const units = unitIds
      .map((id) => activeScenario.helpers.getUnitById(id))
      .filter(Boolean);
    if (units.length) geoStore.zoomToUnits(units, { duration: 900, maxZoom });
  },
  zoomToGeometry: (geometry, maxZoom) => {
    geoStore.zoomToGeometry(geometry, { duration: 900, maxZoom });
  },
  zoomToEventWhere: (eventId, maxZoom) => {
    const event = activeScenario.store.state.eventMap[eventId];
    const where = event?.where;
    if (!where) return;
    if (where.type === "units") {
      const units = where.units
        .map((id) => activeScenario.helpers.getUnitById(id))
        .filter(Boolean);
      if (units.length) geoStore.zoomToUnits(units, { duration: 900, maxZoom: maxZoom ?? where.maxZoom });
    } else if (where.type === "geometry") {
      geoStore.zoomToGeometry(where.geometry, { duration: 900, maxZoom: maxZoom ?? where.maxZoom });
    }
  },
});
```

- [ ] **Step 3: Run type check**

Run:

```powershell
cd front_kalknegar
npm run type-check
```

Expected: PASS. If geometry typing is stricter than `unknown`, import the project geometry type used by `GeometryWhere["geometry"]` and use it in `StoryboardCameraAdapter`.

- [ ] **Step 4: Commit**

Run:

```powershell
git add front_kalknegar/src/scenariostore/storyboard.ts front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue
git commit -m "feat: apply storyboard scene camera"
```

---

### Task 8: Final Verification

**Files:**
- Verify all storyboard files and touched editor files.

- [ ] **Step 1: Run storyboard tests**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/storyboard.test.ts --run
```

Expected: PASS.

- [ ] **Step 2: Run related scenario store tests**

Run:

```powershell
cd front_kalknegar
npm run test:unit -- src/scenariostore/index.test.ts src/scenariostore/upgrade.test.ts src/services/api/scenarioApiService.test.ts --run
```

Expected: PASS.

- [ ] **Step 3: Run type check**

Run:

```powershell
cd front_kalknegar
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```powershell
cd front_kalknegar
npm run build
```

Expected: PASS.

- [ ] **Step 5: Manual smoke test**

Run:

```powershell
cd front_kalknegar
npm run dev
```

Open `http://127.0.0.1:5180` and verify:

- Existing scenario without storyboard opens.
- New "استوری برد" tab appears on desktop and mobile panel layouts.
- "ساخت از رویدادها" creates scenes from existing scenario events.
- "افزودن صحنه" creates an independent scene.
- Editing title/body/duration persists after scenario save and reload.
- Normal playback crossing a scene time displays the overlay once.
- Story playback starts from the first ordered scene and next/previous controls change scenes.
- Linked event camera moves the map when the event has `where`.

- [ ] **Step 6: Commit final fixes if needed**

If verification required fixes, stage only storyboard-related files:

```powershell
git add front_kalknegar/src/types/scenarioModels.ts front_kalknegar/src/types/internalModels.ts front_kalknegar/src/scenariostore/newScenarioStore.ts front_kalknegar/src/scenariostore/io.ts front_kalknegar/src/scenariostore/storyboard.ts front_kalknegar/src/scenariostore/storyboard.test.ts front_kalknegar/src/modules/scenarioeditor/StoryboardPanel.vue front_kalknegar/src/modules/scenarioeditor/StoryboardSceneList.vue front_kalknegar/src/modules/scenarioeditor/StoryboardSceneForm.vue front_kalknegar/src/modules/scenarioeditor/StoryboardOverlay.vue front_kalknegar/src/modules/scenarioeditor/StoryboardPlaybackControls.vue front_kalknegar/src/modules/scenarioeditor/MapEditorDesktopPanel.vue front_kalknegar/src/modules/scenarioeditor/MapEditorMobilePanel.vue front_kalknegar/src/modules/scenarioeditor/ScenarioEditorMap.vue
git commit -m "fix: stabilize storyboard mode"
```

If no fixes were required, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers optional scenario data, independent and event-linked scenes, smart/manual duration, default compatibility, editor UI, normal overlay playback, story playback mode, camera behavior, deleted linked-event fallback, and tests.
- Placeholder scan: The plan contains concrete file paths, test code, implementation snippets, commands, and expected outcomes.
- Type consistency: Public types use `Storyboard*` names; composable methods are introduced before UI tasks call them; `StoryboardOverlay` receives `ResolvedStoryboardScene | null`; scene IDs use `EntityId`/`string` consistently at Vue boundaries.
