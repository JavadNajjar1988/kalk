<script setup lang="ts">
import type { EntityId } from "@/types/base";
import type { ResolvedStoryboardScene } from "@/scenariostore/storyboard";
import { useTimeFormatStore } from "@/stores/timeFormatStore";

defineProps<{
  scenes: ResolvedStoryboardScene[];
  selectedSceneId?: EntityId | null;
}>();

defineEmits<{
  select: [sceneId: EntityId];
  "move-up": [sceneId: EntityId];
  "move-down": [sceneId: EntityId];
  delete: [sceneId: EntityId];
}>();

const fmt = useTimeFormatStore();
</script>

<template>
  <div class="space-y-2">
    <p
      v-if="!scenes.length"
      class="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm"
    >
      هنوز صحنه‌ای برای استوری‌بورد تعریف نشده است.
    </p>
    <article
      v-for="(scene, index) in scenes"
      :key="scene.id"
      class="bg-background rounded-md border p-3 text-right transition-colors"
      :class="
        scene.id === selectedSceneId
          ? 'border-red-900 ring-1 ring-red-900'
          : 'border-border hover:border-red-900/40'
      "
    >
      <button
        type="button"
        class="block w-full text-right"
        @click="$emit('select', scene.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-foreground truncate text-sm font-semibold">
              {{ scene.title || "صحنه بدون عنوان" }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              <span v-if="scene.startTime !== undefined">
                {{ fmt.scenarioDateFormatter.format(scene.startTime) }}
              </span>
              <span v-else>بدون زمان شروع</span>
              <span v-if="scene.linkedEventId"> · متصل به رویداد</span>
              <span v-if="scene.linkedEventMissing" class="text-red-700">
                · رویداد حذف شده
              </span>
            </p>
          </div>
          <span
            class="bg-muted text-muted-foreground shrink-0 rounded px-2 py-0.5 text-xs"
          >
            {{ scene.order ?? index + 1 }}
          </span>
        </div>
      </button>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border px-2 py-1 text-xs disabled:opacity-40"
          :disabled="index === 0"
          @click="$emit('move-up', scene.id)"
        >
          بالا
        </button>
        <button
          type="button"
          class="rounded border px-2 py-1 text-xs disabled:opacity-40"
          :disabled="index === scenes.length - 1"
          @click="$emit('move-down', scene.id)"
        >
          پایین
        </button>
        <button
          type="button"
          class="mr-auto rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
          @click="$emit('delete', scene.id)"
        >
          حذف
        </button>
      </div>
    </article>
  </div>
</template>
