<template>
  <div class="toolbar">
    <div class="flex flex-wrap gap-2">
      <button 
        @click="setMode('point')"
        :class="['px-3 py-2 rounded text-sm', mode === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300']"
      >
        نقطه
      </button>
      <button 
        @click="setMode('line')"
        :class="['px-3 py-2 rounded text-sm', mode === 'line' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300']"
      >
        خط
      </button>
      <button 
        @click="setMode('polyline')"
        :class="['px-3 py-2 rounded text-sm', mode === 'polyline' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300']"
      >
        پلی‌لاین
      </button>
      <button 
        @click="clearCanvas"
        class="px-3 py-2 bg-red-600 text-white rounded text-sm"
      >
        پاک کردن
      </button>
    </div>
    
    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
      <p class="mb-1"><strong>راهنمای استفاده:</strong></p>
      <ul class="list-disc mr-4 space-y-1">
        <li>حالت "نقطه": برای ایجاد نقاط تکی</li>
        <li>حالت "خط": برای اتصال دو نقطه با یک خط</li>
        <li>حالت "پلی‌لاین": برای ترسیم خطوط پیوسته</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  mode: 'point' | 'line' | 'polyline';
}

interface Emits {
  (e: 'update:mode', mode: 'point' | 'line' | 'polyline'): void;
  (e: 'clear-canvas'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Methods
const setMode = (newMode: 'point' | 'line' | 'polyline') => {
  emit('update:mode', newMode);
};

const clearCanvas = () => {
  if (confirm('آیا از پاک کردن تمام نقاط و خطوط اطمینان دارید؟')) {
    emit('clear-canvas');
  }
};
</script>