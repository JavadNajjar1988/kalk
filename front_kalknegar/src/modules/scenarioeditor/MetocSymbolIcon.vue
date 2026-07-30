<script setup lang="ts">
import { ref, watch } from "vue";
import { renderMetocIcon } from "./metocRenderer";

const props = withDefaults(
  defineProps<{
    sidc: string;
    size?: number;
    label?: string;
  }>(),
  { size: 32, label: "" },
);

const source = ref("");
const failed = ref(false);

watch(
  () => [props.sidc, props.size] as const,
  async ([sidc, size]) => {
    source.value = "";
    failed.value = false;
    try {
      source.value = await renderMetocIcon(sidc, size);
    } catch {
      failed.value = true;
    }
  },
  { immediate: true },
);
</script>

<template>
  <img
    v-if="source"
    :src="source"
    :alt="label"
    class="h-full w-full object-contain"
    draggable="false"
  />
  <span
    v-else
    class="flex h-full w-full items-center justify-center text-[9px] text-slate-400"
    :title="failed ? 'نماد قابل نمایش نیست' : 'در حال بارگذاری نماد'"
  >
    METOC
  </span>
</template>
