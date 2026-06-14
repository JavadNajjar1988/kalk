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

export function buildSceneFromEvent(
  event: NScenarioEvent | ScenarioEvent,
): StoryboardScene {
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

export interface StoryboardCameraAdapter {
  zoomToUnits: (unitIds: EntityId[], maxZoom?: number) => void;
  zoomToGeometry: (
    geometry: Extract<StoryboardCamera, { type: "geometry" }>["geometry"],
    maxZoom?: number,
  ) => void;
  zoomToEventWhere: (eventId: EntityId, maxZoom?: number) => void;
}

export function getTriggeredStoryboardScenes(
  input: TriggeredScenesInput,
): StoryboardScene[] {
  if (input.currentTime < input.previousTime) return [];

  return sortStoryboardScenes(input.scenes).filter((scene) => {
    if (scene.startTime === undefined) return false;
    if (input.displayedSceneIds.has(scene.id)) return false;
    return scene.startTime > input.previousTime && scene.startTime <= input.currentTime;
  });
}

export function useStoryboard(
  store: NewScenarioStore,
  cameraAdapter?: StoryboardCameraAdapter,
) {
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
    applySceneCamera(resolved);
  }

  function clearActiveScene() {
    activeScene.value = null;
  }

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

  function updateScene(id: EntityId, patch: Partial<Omit<StoryboardScene, "id">>) {
    store.update((state) => {
      const scene = state.storyboard.scenes.find((item) => item.id === id);
      if (!scene) return;
      const safePatch = { ...(patch as Partial<StoryboardScene>) };
      delete safePatch.id;
      Object.assign(scene, safePatch);
    });
  }

  function deleteScene(id: EntityId) {
    store.update((state) => {
      state.storyboard.scenes = state.storyboard.scenes.filter(
        (scene) => scene.id !== id,
      );
    });
    displayedSceneIds.value.delete(id);
    if (activeScene.value?.id === id) activeScene.value = null;
  }

  function reorderScenes(sceneIds: EntityId[]) {
    store.update((state) => {
      const scenesById = new Map(
        state.storyboard.scenes.map((scene) => [scene.id, scene]),
      );
      const prioritizedIds: EntityId[] = [];
      const seenIds = new Set<EntityId>();

      sceneIds.forEach((id) => {
        if (!scenesById.has(id) || seenIds.has(id)) return;
        prioritizedIds.push(id);
        seenIds.add(id);
      });

      const prioritizedScenes = prioritizedIds.map((id) => scenesById.get(id)!);
      const remainingScenes = sortStoryboardScenes(
        state.storyboard.scenes.filter((scene) => !seenIds.has(scene.id)),
      );

      [...prioritizedScenes, ...remainingScenes].forEach((scene, index) => {
        scene.order = index + 1;
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
    nextStoryScene,
    previousStoryScene,
    reorderScenes,
    resetDisplayedScenes,
    showScene,
    startStoryPlayback,
    stopStoryPlayback,
    updateScene,
  };
}
