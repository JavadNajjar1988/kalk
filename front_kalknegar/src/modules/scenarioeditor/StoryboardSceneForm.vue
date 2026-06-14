<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { injectStrict } from "@/utils";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import type { EntityId, ScenarioTime } from "@/types/base";
import type { ResolvedStoryboardScene } from "@/scenariostore/storyboard";
import type { StoryboardCamera, StoryboardScene } from "@/types/scenarioModels";
import { useTimeFormatStore } from "@/stores/timeFormatStore";
import { Button } from "@/components/ui/button";

const props = defineProps<{
  scene: ResolvedStoryboardScene | null;
}>();

const emit = defineEmits<{
  save: [sceneId: EntityId, patch: Partial<Omit<StoryboardScene, "id">>];
  unlink: [sceneId: EntityId];
}>();

const { store } = injectStrict(activeScenarioKey);
const { getModalTimestamp } = injectStrict(timeModalKey);
const fmt = useTimeFormatStore();

const draft = reactive({
  title: "",
  body: "",
  startTime: undefined as ScenarioTime | undefined,
  durationSeconds: undefined as number | undefined,
  order: undefined as number | undefined,
  pausePlayback: false,
  cameraType: "none" as StoryboardCamera["type"],
  maxZoom: undefined as number | undefined,
});

const formattedTime = computed(() =>
  draft.startTime === undefined
    ? "تنظیم نشده"
    : fmt.scenarioDateFormatter.format(draft.startTime),
);

watch(
  () => props.scene?.id,
  () => {
    const scene = props.scene;
    draft.title = scene?.title ?? "";
    draft.body = scene?.body ?? "";
    draft.startTime = scene?.startTime;
    draft.durationSeconds =
      scene?.durationMs && scene.durationMs > 0
        ? Math.round(scene.durationMs / 1000)
        : undefined;
    draft.order = scene?.order;
    draft.pausePlayback = scene?.pausePlayback ?? false;
    draft.cameraType = scene?.camera?.type ?? "none";
    draft.maxZoom =
      scene?.camera && "maxZoom" in scene.camera ? scene.camera.maxZoom : undefined;
  },
  { immediate: true },
);

async function chooseTime() {
  const newTimestamp = await getModalTimestamp(
    draft.startTime ?? store.state.currentTime,
    {
      timeZone: store.state.info.timeZone,
      title: "تنظیم زمان صحنه استوری‌بورد",
    },
  );
  if (newTimestamp !== undefined) {
    draft.startTime = newTimestamp;
  }
}

function buildCamera(): StoryboardCamera | undefined {
  if (draft.cameraType === "eventWhere") {
    return {
      type: "eventWhere",
      ...(draft.maxZoom ? { maxZoom: draft.maxZoom } : {}),
    };
  }
  return { type: "none" };
}

function save() {
  if (!props.scene) return;
  emit("save", props.scene.id, {
    title: draft.title.trim(),
    body: draft.body.trim() || undefined,
    startTime: draft.startTime,
    durationMs:
      draft.durationSeconds && draft.durationSeconds > 0
        ? Math.round(draft.durationSeconds * 1000)
        : undefined,
    order: draft.order && draft.order > 0 ? Math.round(draft.order) : undefined,
    pausePlayback: draft.pausePlayback,
    camera: buildCamera(),
  });
}
</script>

<template>
  <form
    v-if="scene"
    class="bg-background space-y-4 rounded-md border p-4"
    dir="rtl"
    @submit.prevent="save"
  >
    <header class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-foreground text-sm font-semibold">ویرایش صحنه</h3>
        <p v-if="scene.linkedEventId" class="text-muted-foreground mt-1 text-xs">
          این صحنه به یک رویداد سناریو متصل است.
        </p>
      </div>
      <button
        v-if="scene.linkedEventId"
        type="button"
        class="text-xs text-red-700 underline-offset-4 hover:underline"
        @click="$emit('unlink', scene.id)"
      >
        قطع اتصال
      </button>
    </header>

    <label class="block text-sm font-medium">
      عنوان
      <input
        v-model="draft.title"
        type="text"
        class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
      />
    </label>

    <label class="block text-sm font-medium">
      متن
      <textarea
        v-model="draft.body"
        rows="5"
        class="bg-background mt-1 w-full resize-y rounded-md border px-3 py-2 text-sm leading-7"
      />
    </label>

    <div class="grid gap-3 sm:grid-cols-2">
      <div class="text-sm font-medium">
        زمان شروع
        <div class="mt-1 flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" @click="chooseTime">
            انتخاب زمان
          </Button>
          <button
            type="button"
            class="text-muted-foreground text-xs underline-offset-4 hover:underline"
            @click="draft.startTime = undefined"
          >
            پاک کردن
          </button>
        </div>
        <p class="text-muted-foreground mt-1 text-xs">{{ formattedTime }}</p>
      </div>

      <label class="block text-sm font-medium">
        مدت نمایش (ثانیه)
        <input
          v-model.number="draft.durationSeconds"
          type="number"
          min="1"
          step="1"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="خودکار"
        />
      </label>

      <label class="block text-sm font-medium">
        ترتیب
        <input
          v-model.number="draft.order"
          type="number"
          min="1"
          step="1"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="خودکار"
        />
      </label>

      <label class="block text-sm font-medium">
        دوربین
        <select
          v-model="draft.cameraType"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="none">بدون حرکت دوربین</option>
          <option value="eventWhere" :disabled="!scene.linkedEventId">
            موقعیت رویداد متصل
          </option>
        </select>
      </label>

      <label class="block text-sm font-medium">
        حداکثر زوم
        <input
          v-model.number="draft.maxZoom"
          type="number"
          min="1"
          max="22"
          step="1"
          class="bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
          :disabled="draft.cameraType === 'none'"
        />
      </label>

      <label class="mt-6 flex items-center gap-2 text-sm">
        <input
          v-model="draft.pausePlayback"
          type="checkbox"
          class="border-input size-4 rounded"
        />
        مکث پخش روی این صحنه
      </label>
    </div>

    <div class="flex justify-end">
      <Button type="submit" size="sm">ذخیره صحنه</Button>
    </div>
  </form>

  <div
    v-else
    class="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm"
    dir="rtl"
  >
    یک صحنه را برای ویرایش انتخاب کنید.
  </div>
</template>
