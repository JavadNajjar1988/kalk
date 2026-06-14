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
    if (scene.startTime === undefined) return false;
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

  return {
    activeScene,
    resolvedScenes,
    displayedSceneIds,
    storyPlaybackRunning,
    storyPlaybackIndex,
    addScene,
    clearActiveScene,
    createScenesFromEvents,
    deleteScene,
    detectTriggeredScenes,
    markDisplayed,
    reorderScenes,
    resetDisplayedScenes,
    showScene,
    updateScene,
  };
}
