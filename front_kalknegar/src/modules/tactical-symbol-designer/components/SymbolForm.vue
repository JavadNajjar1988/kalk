<template>
  <div class="symbol-form">
    <form @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نام نماد
          </label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            :class="{ 'border-red-500': errors.name }"
            placeholder="نام نماد را وارد کنید"
            required
          />
          <div v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.name }}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            توضیحات
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            :class="{ 'border-red-500': errors.description }"
            placeholder="توضیحات نماد را وارد کنید"
          ></textarea>
          <div v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.description }}
          </div>
        </div>

        <div class="flex justify-end space-x-3 space-x-reverse">
          <button
            type="button"
            @click="handleCancel"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            انصراف
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ editing ? 'به‌روزرسانی' : 'ایجاد' }}
          </button>
        </div>
      </div>
    </form>
    
    <!-- Error message -->
    <div v-if="formError" class="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
      <p class="text-sm text-red-800 dark:text-red-200">{{ formError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TacticalSymbol } from '../types';

interface Props {
  symbol?: TacticalSymbol | null;
}

interface Emits {
  (e: 'save', symbol: TacticalSymbol): void;
  (e: 'cancel'): void;
  (e: 'error', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const form = ref({
  name: '',
  description: ''
});

const errors = ref<Record<string, string>>({});
const formError = ref<string | null>(null);

// Computed
const editing = computed(() => !!props.symbol);
const isFormValid = computed(() => {
  return validateForm();
});

// Methods
const validateForm = (): boolean => {
  errors.value = {};
  formError.value = null;
  
  // Validate name
  if (!form.value.name.trim()) {
    errors.value.name = 'نام نماد الزامی است';
  } else if (form.value.name.trim().length < 3) {
    errors.value.name = 'نام نماد باید حداقل 3 کاراکتر باشد';
  } else if (form.value.name.trim().length > 100) {
    errors.value.name = 'نام نماد نمی‌تواند بیشتر از 100 کاراکتر باشد';
  }
  
  // Validate description
  if (form.value.description && form.value.description.length > 500) {
    errors.value.description = 'توضیحات نماد نمی‌تواند بیشتر از 500 کاراکتر باشد';
  }
  
  return Object.keys(errors.value).length === 0;
};

const handleSubmit = () => {
  try {
    if (!validateForm()) {
      formError.value = 'لطفاً خطاهای فرم را برطرف کنید';
      emit('error', formError.value);
      return;
    }
    
    const symbolData: TacticalSymbol = {
      id: props.symbol?.id || Date.now().toString(),
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      points: props.symbol?.points || [],
      lines: props.symbol?.lines || [],
      createdAt: props.symbol?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    emit('save', symbolData);
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'An unknown error occurred while saving symbol';
    emit('error', formError.value);
  }
};

const handleCancel = () => {
  emit('cancel');
};

// Watchers
watch(() => props.symbol, (newSymbol) => {
  if (newSymbol) {
    form.value.name = newSymbol.name;
    form.value.description = newSymbol.description || '';
  } else {
    form.value.name = '';
    form.value.description = '';
  }
}, { immediate: true });
</script>