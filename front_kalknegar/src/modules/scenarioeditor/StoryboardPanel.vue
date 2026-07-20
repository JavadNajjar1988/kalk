<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PanelHeading from "@/components/PanelHeading.vue";
import HeadingDescription from "@/components/HeadingDescription.vue";
import { Button } from "@/components/ui/button";
import { useScenario } from "@/scenariostore";
import { useStoryboard } from "@/scenariostore/storyboard";
import type { EntityId } from "@/types/base";
import type { StoryboardScene } from "@/types/scenarioModels";
import StoryboardSceneList from "@/modules/scenarioeditor/StoryboardSceneList.vue";
import StoryboardSceneForm from "@/modules/scenarioeditor/StoryboardSceneForm.vue";

const { scenario } = useScenario();
const store = scenario.value.store;
const storyboard = useStoryboard(store);
const selectedSceneId = ref<EntityId | null>(null);

const state = computed(() => store.state.storyboard);
const scenes = storyboard.resolvedScenes;
const selectedScene = computed(
  () => scenes.value.find((scene) => scene.id === selectedSceneId.value) ?? null,
);

const defaultDurationSeconds = computed({
  get: () => Math.round(state.value.settings.defaultSceneDurationMs / 1000),
  set: (value: number) => {
    updateSettings({
      defaultSceneDurationMs: Math.max(1, Math.round(value || 1)) * 1000,
    });
  },
});

watch(
  scenes,
  (nextScenes) => {
    if (!nextScenes.length) {
      selectedSceneId.value = null;
      return;
    }
    if (
      !selectedSceneId.value ||
      !nextScenes.some((scene) => scene.id === selectedSceneId.value)
    ) {
      selectedSceneId.value = nextScenes[0].id;
    }
  },
  { immediate: true },
);

function updateEnabled(enabled: boolean) {
  store.update((draft) => {
    draft.storyboard.enabled = enabled;
  });
}

function updateSettings(settings: Partial<typeof store.state.storyboard.settings>) {
  store.update((draft) => {
    Object.assign(draft.storyboard.settings, settings);
  });
}

function createScenesFromEvents() {
  storyboard.createScenesFromEvents();
  selectedSceneId.value = scenes.value[0]?.id ?? null;
}

function addIndependentScene() {
  const id = storyboard.addScene({
    title: "صحنه جدید",
    body: "",
    startTime: store.state.currentTime,
    order: scenes.value.length + 1,
    camera: { type: "none" },
  });
  selectedSceneId.value = id;
}

function deleteScene(sceneId: EntityId) {
  storyboard.deleteScene(sceneId);
  const remainingScenes = scenes.value.filter((scene) => scene.id !== sceneId);
  selectedSceneId.value = remainingScenes[0]?.id ?? null;
}

function moveScene(sceneId: EntityId, direction: -1 | 1) {
  const orderedIds = scenes.value.map((scene) => scene.id);
  const currentIndex = orderedIds.indexOf(sceneId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) return;
  const [movedId] = orderedIds.splice(currentIndex, 1);
  orderedIds.splice(nextIndex, 0, movedId);
  storyboard.reorderScenes(orderedIds);
}

function updateScene(sceneId: EntityId, patch: Partial<Omit<StoryboardScene, "id">>) {
  storyboard.updateScene(sceneId, patch);
}

function unlinkScene(sceneId: EntityId) {
  storyboard.updateScene(sceneId, {
    linkedEventId: undefined,
    camera: { type: "none" },
  });
}
</script>

<template>
  <section class="space-y-5" dir="rtl">
    <div>
      <PanelHeading>استوری‌بورد</PanelHeading>
      <HeadingDescription>
        متن‌های کوتاه روایی را به زمان‌های سناریو یا رویدادها وصل کنید.
      </HeadingDescription>
    </div>

    <div class="bg-background space-y-3 rounded-md border p-4">
      <label class="flex items-center gap-2 text-sm font-medium">
        <input
          :checked="state.enabled"
          type="checkbox"
          class="border-input size-4 rounded"
          @change="updateEnabled(($event.target as HTMLInputElement).checked)"
        />
        فعال‌سازی استوری‌بورد
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block text-sm font-medium">
          حالت نمایش
          <select
            :value="state.settings.showMode"
            class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
            @change="
              updateSettings({
                showMode: ($event.target as HTMLSelectElement).value as
                  | 'toast'
                  | 'cinematic',
              })
            "
          >
            <option value="toast">کارت کوتاه روی نقشه</option>
            <option value="cinematic">پخش استوری</option>
          </select>
        </label>

        <label class="block text-sm font-medium">
          مدت پیش‌فرض (ثانیه)
          <input
            v-model.number="defaultDurationSeconds"
            type="number"
            min="1"
            step="1"
            class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <input
          :checked="state.settings.autoDuration"
          type="checkbox"
          class="border-input size-4 rounded"
          @change="
            updateSettings({ autoDuration: ($event.target as HTMLInputElement).checked })
          "
        />
        تعیین خودکار مدت نمایش بر اساس طول متن
      </label>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" @click="createScenesFromEvents">
        ساخت از رویدادها
      </Button>
      <Button type="button" size="sm" @click="addIndependentScene"> افزودن صحنه </Button>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
      <StoryboardSceneList
        :scenes="scenes"
        :selected-scene-id="selectedSceneId"
        @select="selectedSceneId = $event"
        @move-up="moveScene($event, -1)"
        @move-down="moveScene($event, 1)"
        @delete="deleteScene"
      />

      <StoryboardSceneForm
        :scene="selectedScene"
        @save="updateScene"
        @unlink="unlinkScene"
      />
    </div>
  </section>
</template>
