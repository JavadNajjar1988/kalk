<script setup lang="ts">
import ToggleField from "@/components/ToggleField.vue";
import { useUiStore } from "@/stores/uiStore";
withDefaults(
  defineProps<{ showNextToggle?: boolean; submitLabel?: string; cancelLabel?: string }>(),
  {
    submitLabel: "ذخیره",
    cancelLabel: "لغو",
  },
);
const emit = defineEmits(["cancel"]);
const uiStore = useUiStore();
</script>

<template>
  <div class="mt-6 flex items-center justify-between gap-x-6">
    <div>
      <ToggleField v-if="showNextToggle" v-model="uiStore.goToNextOnSubmit">
        رفتن به بعدی هنگام ذخیره
      </ToggleField>
    </div>
    <div class="flex items-center gap-x-6">
      <button
        type="button"
        class="text-sm/6 font-semibold text-slate-900 dark:text-slate-200"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="submit"
        class="rounded-md bg-blue-300/60 dark:bg-blue-400/30 backdrop-blur px-3 py-2 text-sm font-semibold text-blue-900 dark:text-blue-50 shadow-2xs hover:bg-blue-300/70 dark:hover:bg-blue-400/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
      >
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>
