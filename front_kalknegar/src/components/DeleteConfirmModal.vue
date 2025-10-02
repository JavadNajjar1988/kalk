<template>
  <NewSimpleModal
    v-model="open"
    dialog-title="تایید حذف سناریو"
    @cancel="onCancel"
    class="sm:max-w-md"
  >
    <div class="overflow-x-hidden" dir="rtl">
      <div class="flex items-center gap-3 mb-4">
        <div class="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            حذف سناریو
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            این عمل قابل بازگشت نیست
          </p>
        </div>
      </div>
      
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-6 text-right">
        آیا مطمئن هستید که می‌خواهید سناریوی 
        <span class="font-semibold text-red-600 dark:text-red-400">{{ scenarioName }}</span> 
        را برای همیشه حذف کنید؟
      </p>
      
      <div class="flex gap-3 justify-end">
        <button
          @click="onCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
        >
          انصراف
        </button>
        <button
          @click="onConfirm"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          حذف سناریو
        </button>
      </div>
    </div>
  </NewSimpleModal>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import NewSimpleModal from "@/components/NewSimpleModal.vue";

const props = withDefaults(defineProps<{ 
  modelValue: boolean;
  scenarioName?: string;
}>(), { 
  modelValue: false,
  scenarioName: ''
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const open = useVModel(props, "modelValue", emit);

function onConfirm() {
  emit("confirm");
  open.value = false;
}

function onCancel() {
  emit("cancel");
  open.value = false;
}
</script>
