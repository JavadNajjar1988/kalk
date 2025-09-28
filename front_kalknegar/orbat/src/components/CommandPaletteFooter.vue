<template>
  <div
    class="flex flex-wrap items-center justify-between bg-gray-50 px-4 py-2.5 text-xs text-gray-700"
  >
    <div class="flex">
      تایپ کنید

      <kbd
        :class="[
          'mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:mx-2',
          rawQuery.startsWith('@')
            ? 'border-indigo-600 text-indigo-600'
            : 'border-gray-400 text-gray-900',
        ]"
        >@</kbd
      >
      <span class="sm:hidden">برای مکان‌ها،</span>
      <span class="hidden sm:inline">برای جستجوی مکان‌ها،</span>
      <button class="flex" @click="emit('click-actions')">
        <kbd
          :class="[
            'mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:ml-2',
            rawQuery.startsWith('#') || rawQuery.startsWith('>')
              ? 'border-indigo-600 text-indigo-600'
              : 'border-gray-400 text-gray-900',
          ]"
          >#</kbd
        >
        <kbd
          :class="[
            'mx-0.5 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:mr-2',
            rawQuery.startsWith('>')
              ? 'border-indigo-600 text-indigo-600'
              : 'border-gray-400 text-gray-900',
          ]"
          >&gt;</kbd
        >
        <span class="">برای عملیات</span>
      </button>
      <kbd
        class="hidden sm:flex"
        :class="[
          'mx-1 flex h-5 w-5 items-center justify-center rounded border bg-white font-semibold sm:mx-2',
          rawQuery === '?'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-gray-400 text-gray-900',
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
