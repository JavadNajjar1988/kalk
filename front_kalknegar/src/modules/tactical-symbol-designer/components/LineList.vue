<template>
  <div class="line-list">
    <div v-if="lines.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
      هیچ خطی تعریف نشده است
    </div>
    
    <div v-else class="space-y-3 max-h-64 overflow-y-auto">
      <div
        v-for="line in lines"
        :key="line.id"
        class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <div class="flex items-center space-x-3 space-x-reverse">
          <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">خط {{ line.id }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              ({{ line.startX.toFixed(1) }}, {{ line.startY.toFixed(1) }}) → ({{ line.endX.toFixed(1) }}, {{ line.endY.toFixed(1) }})
            </div>
          </div>
        </div>
        
        <button
          @click="deleteLine(line.id)"
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
</template>

<script setup lang="ts">
import type { Line, Point } from '../types';

interface Props {
  lines: Line[];
  points: Point[];
}

interface Emits {
  (e: 'delete-line', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Methods
const deleteLine = (id: string) => {
  if (confirm('آیا از حذف این خط اطمینان دارید؟')) {
    emit('delete-line', id);
  }
};
</script>