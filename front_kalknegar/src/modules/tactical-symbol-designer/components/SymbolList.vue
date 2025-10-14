<template>
  <div class="symbol-list">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">نمادهای ایجاد شده</h3>
      <button
        @click="createNewSymbol"
        class="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        نماد جدید
      </button>
    </div>

    <div v-if="symbols.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium">هیچ نمادی یافت نشد</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        برای شروع، یک نماد جدید ایجاد کنید.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="symbol in symbols"
        :key="symbol.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">{{ symbol.name }}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ symbol.description || 'بدون توضیحات' }}
            </p>
            <div class="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span class="ml-3">{{ symbol.points.length }} نقطه</span>
              <span>{{ symbol.lines.length }} خط</span>
            </div>
          </div>
          
          <div class="flex space-x-2 space-x-reverse">
            <button
              @click="editSymbol(symbol)"
              class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="ویرایش"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="deleteSymbol(symbol.id)"
              class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="حذف"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TacticalSymbol } from '../types';

interface Props {
  symbols: TacticalSymbol[];
}

interface Emits {
  (e: 'create'): void;
  (e: 'edit', symbol: TacticalSymbol): void;
  (e: 'delete', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Methods
const createNewSymbol = () => {
  emit('create');
};

const editSymbol = (symbol: TacticalSymbol) => {
  emit('edit', symbol);
};

const deleteSymbol = (id: string) => {
  if (confirm('آیا از حذف این نماد اطمینان دارید؟')) {
    emit('delete', id);
  }
};
</script>