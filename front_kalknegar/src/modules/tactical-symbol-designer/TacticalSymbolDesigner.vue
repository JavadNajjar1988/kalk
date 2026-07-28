<template>
  <div class="tactical-symbol-designer min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4 space-x-reverse">
            <button
              @click="goBack"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="بازگشت"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                طراحی نمادهای تاکتیکال
              </h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                ابزار ترسیم و تعریف نمادهای تاکتیکال
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Drawing Canvas -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">بافت طراحی</h2>
            <DrawingCanvas 
              :points="points" 
              :lines="lines"
              :mode="mode"
              @update:points="updatePoints"
              @update:lines="updateLines"
              @update:mode="updateMode"
            />
          </div>
        </div>

        <!-- Properties Panel -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">ابزارها</h2>
            <Toolbar 
              :mode="mode" 
              @update:mode="updateMode"
              @clear-canvas="clearCanvas"
            />
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">نقاط</h2>
            <PointList 
              :points="points" 
              @select-point="selectPoint"
              @update-point="updatePoint"
              @delete-point="deletePoint"
            />
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">خط‌ها</h2>
            <LineList 
              :lines="lines" 
              :points="points"
              @delete-line="deleteLine"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { goToPreviousStep } from '@/utils/navigation';
import DrawingCanvas from './components/DrawingCanvas.vue';
import Toolbar from './components/Toolbar.vue';
import PointList from './components/PointList.vue';
import LineList from './components/LineList.vue';
import { useTacticalSymbolDesignerStore } from './stores';
import type { Point, Line } from './types';

const router = useRouter();
const store = useTacticalSymbolDesignerStore();

// State
const mode = ref<'point' | 'line' | 'polyline'>('point');
const selectedPointId = ref<string | null>(null);

// Computed
const points = computed(() => store.points);
const lines = computed(() => store.lines);

// Methods
const goBack = () => {
  goToPreviousStep(router, '/');
};

const updatePoints = (newPoints: Point[]) => {
  store.setPoints(newPoints);
};

const updateLines = (newLines: Line[]) => {
  store.setLines(newLines);
};

const updateMode = (newMode: 'point' | 'line' | 'polyline') => {
  mode.value = newMode;
};

const clearCanvas = () => {
  store.clearCanvas();
};

const selectPoint = (id: string) => {
  selectedPointId.value = id;
};

const updatePoint = (id: string, updates: Partial<Point>) => {
  store.updatePoint(id, updates);
};

const deletePoint = (id: string) => {
  store.deletePoint(id);
};

const deleteLine = (id: string) => {
  store.deleteLine(id);
};
</script>
