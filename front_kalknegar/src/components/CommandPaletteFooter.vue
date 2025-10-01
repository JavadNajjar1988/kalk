<template>
  <div
    class="flex flex-wrap items-center justify-between bg-cyan-100/30 dark:bg-cyan-800/30 backdrop-blur-sm px-4 py-2.5 text-xs text-cyan-700 dark:text-cyan-300"
  >
    <div class="flex">
      تایپ کنید

      <kbd
        :class="[
          'mx-1 flex h-5 w-5 items-center justify-center rounded border bg-cyan-50/80 dark:bg-cyan-900/80 backdrop-blur-sm font-semibold sm:mx-2',
          rawQuery.startsWith('@')
            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
            : 'border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300',
        ]"
        >@</kbd
      >
      <span class="sm:hidden">برای مکان‌ها،</span>
      <span class="hidden sm:inline">برای جستجوی مکان‌ها،</span>
      <button class="flex" @click="emit('click-actions')">
        <kbd
          :class="[
            'mx-1 flex h-5 w-5 items-center justify-center rounded border bg-cyan-50/80 dark:bg-cyan-900/80 backdrop-blur-sm font-semibold sm:ml-2',
            rawQuery.startsWith('#') || rawQuery.startsWith('>')
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300',
          ]"
          >#</kbd
        >
        <kbd
          :class="[
            'mx-0.5 flex h-5 w-5 items-center justify-center rounded border bg-cyan-50/80 dark:bg-cyan-900/80 backdrop-blur-sm font-semibold sm:mr-2',
            rawQuery.startsWith('>')
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300',
          ]"
          >&gt;</kbd
        >
        <span class="">برای عملیات</span>
      </button>
      <kbd
        class="hidden sm:flex"
        :class="[
          'mx-1 flex h-5 w-5 items-center justify-center rounded border bg-cyan-50/80 dark:bg-cyan-900/80 backdrop-blur-sm font-semibold sm:mx-2',
          rawQuery === '?'
            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
            : 'border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300',
        ]"
        >?</kbd
      >
      <span class="hidden sm:flex">برای راهنما.</span>
    </div>
    <div><ToggleField v-model="uiStore.searchGeoMode">حالت مکان</ToggleField></div>
  </div>
</template>
<script setup lang="ts">
import ToggleField from "@/components/ToggleField.vue";
import { useUiStore } from "@/stores/uiStore";

const emit = defineEmits(["click-actions"]);
const uiStore = useUiStore();
const props = defineProps<{
  rawQuery: string;
}>();
</script>
