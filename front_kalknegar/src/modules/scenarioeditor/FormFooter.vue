<script setup lang="ts">
import ToggleField from "@/components/ToggleField.vue";
import { useUiStore } from "@/stores/uiStore";
withDefaults(
  defineProps<{
    showNextToggle?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    submitDisabled?: boolean;
  }>(),
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
        :disabled="submitDisabled"
        class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>
