<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";
import {
  calculateStoryboardDurationMs,
  type ResolvedStoryboardScene,
} from "@/scenariostore/storyboard";
import type { StoryboardSettings } from "@/types/scenarioModels";

const props = defineProps<{
  scene: ResolvedStoryboardScene | null;
  settings: StoryboardSettings;
}>();

const emit = defineEmits<{
  close: [];
}>();

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

function clearCloseTimer() {
  if (!closeTimer) return;
  clearTimeout(closeTimer);
  closeTimer = undefined;
}

watch(
  () => props.scene?.id,
  () => {
    clearCloseTimer();
    if (!props.scene) return;
    closeTimer = setTimeout(() => emit("close"), durationMs.value);
  },
  { immediate: true },
);

onBeforeUnmount(clearCloseTimer);
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
      class="pointer-events-auto mx-auto mb-20 max-w-2xl rounded-md border border-red-900/20 bg-white/95 p-4 text-right text-gray-950 shadow-lg backdrop-blur dark:bg-slate-950/95 dark:text-slate-50"
      dir="rtl"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-base font-semibold">{{ scene.title }}</h2>
          <p
            v-if="scene.body"
            class="mt-2 text-sm leading-7 whitespace-pre-line text-gray-700 dark:text-slate-200"
          >
            {{ scene.body }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded px-2 text-lg text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          aria-label="بستن"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
    </article>
  </transition>
</template>
