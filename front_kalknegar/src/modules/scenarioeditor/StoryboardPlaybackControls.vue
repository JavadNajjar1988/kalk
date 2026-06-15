<script setup lang="ts">
import {
  PhPlay as IconPlay,
  PhSkipBack as IconPrevious,
  PhSkipForward as IconNext,
  PhStop as IconStop,
} from "@phosphor-icons/vue";

defineProps<{
  running: boolean;
  hasScenes: boolean;
}>();

defineEmits<{
  start: [];
  stop: [];
  previous: [];
  next: [];
}>();
</script>

<template>
  <div
    class="pointer-events-auto flex items-center gap-1 rounded-md border bg-white/95 p-1.5 text-sm shadow dark:bg-slate-950/95"
    dir="rtl"
  >
    <button
      v-if="!running"
      type="button"
      class="inline-flex items-center gap-1 rounded bg-red-900 px-2.5 py-1.5 text-white disabled:opacity-50"
      :disabled="!hasScenes"
      title="پخش استوری"
      @click="$emit('start')"
    >
      <IconPlay class="size-4" aria-hidden="true" />
      <span class="hidden lg:inline">پخش استوری</span>
    </button>
    <template v-else>
      <button
        type="button"
        class="hover:bg-muted rounded border p-1.5"
        title="صحنه قبلی"
        @click="$emit('previous')"
      >
        <IconPrevious class="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="hover:bg-muted rounded border p-1.5"
        title="صحنه بعدی"
        @click="$emit('next')"
      >
        <IconNext class="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="rounded border border-red-300 p-1.5 text-red-700 hover:bg-red-50"
        title="توقف"
        @click="$emit('stop')"
      >
        <IconStop class="size-4" aria-hidden="true" />
      </button>
    </template>
  </div>
</template>
