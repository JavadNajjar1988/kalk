<template>
  <div class="point-list">
    <div v-if="points.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
      هیچ نقطه‌ای تعریف نشده است
    </div>
    
    <div v-else class="space-y-3 max-h-64 overflow-y-auto">
      <div
        v-for="point in points"
        :key="point.id"
        class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <div class="flex items-center space-x-3 space-x-reverse">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">نقطه {{ point.id }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">({{ point.x.toFixed(1) }}, {{ point.y.toFixed(1) }})</div>
          </div>
        </div>
        
        <div class="flex space-x-2 space-x-reverse">
          <button
            @click="selectPoint(point.id)"
            class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="انتخاب"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </button>
          <button
            @click="deletePoint(point.id)"
            class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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
</template>

<script setup lang="ts">
import type { Point } from '../types';

interface Props {
  points: Point[];
}

interface Emits {
  (e: 'select-point', id: string): void;
  (e: 'update-point', id: string, updates: Partial<Point>): void;
  (e: 'delete-point', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Methods
const selectPoint = (id: string) => {
  emit('select-point', id);
};

const updatePoint = (id: string, updates: Partial<Point>) => {
  emit('update-point', id, updates);
};

const deletePoint = (id: string) => {
  if (confirm('آیا از حذف این نقطه اطمینان دارید؟')) {
    emit('delete-point', id);
  }
};
</script>