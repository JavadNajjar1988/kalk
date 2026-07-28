<template>
  <div class="symbol-designer-page min-h-screen bg-gray-50 dark:bg-gray-900">
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
      <div v-if="currentView === 'list'" class="space-y-6">
        <SymbolList 
          :symbols="symbols" 
          @create="showDesigner"
          @edit="editSymbol"
          @delete="deleteSymbol"
        />
        
        <!-- Export/Import section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">خروجی/ورودی</h2>
          <ExportImport 
            :symbols="symbols"
            @import-symbols="importSymbols"
            @error="handleError"
            @success="handleSuccess"
          />
        </div>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              @error="handleError"
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
          
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات نماد</h2>
            <SymbolForm 
              :symbol="editingSymbol"
              @save="saveSymbol"
              @cancel="cancelEditing"
              @error="handleError"
            />
          </div>
          
          <!-- Export/Import section in designer view -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">خروجی/ورودی</h2>
            <ExportImport 
              :current-symbol="editingSymbol"
              :symbols="symbols"
              @import-symbol="importSymbol"
              @error="handleError"
              @success="handleSuccess"
            />
          </div>
        </div>
      </div>
    </main>
    
    <!-- Global error/success messages -->
    <div class="fixed bottom-4 left-4 z-50">
      <div v-if="globalError" class="mb-2 p-3 bg-red-500 text-white rounded-lg shadow-lg">
        <p class="text-sm">{{ globalError }}</p>
      </div>
      <div v-if="globalSuccess" class="mb-2 p-3 bg-green-500 text-white rounded-lg shadow-lg">
        <p class="text-sm">{{ globalSuccess }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { goToPreviousStep } from '@/utils/navigation';
import DrawingCanvas from './components/DrawingCanvas.vue';
import Toolbar from './components/Toolbar.vue';
import PointList from './components/PointList.vue';
import LineList from './components/LineList.vue';
import SymbolForm from './components/SymbolForm.vue';
import SymbolList from './components/SymbolList.vue';
import ExportImport from './components/ExportImport.vue';
import { useTacticalSymbolDesignerStore } from './stores';
import type { Point, Line, TacticalSymbol } from './types';

const router = useRouter();
const store = useTacticalSymbolDesignerStore();

// State
const currentView = ref<'list' | 'designer'>('list');
const mode = ref<'point' | 'line' | 'polyline'>('point');
const selectedPointId = ref<string | null>(null);
const editingSymbol = ref<TacticalSymbol | null>(null);
const symbols = ref<TacticalSymbol[]>([]);
const globalError = ref<string | null>(null);
const globalSuccess = ref<string | null>(null);

// Computed
const points = computed(() => store.points);
const lines = computed(() => store.lines);

// Methods
const goBack = () => {
  goToPreviousStep(router, '/');
};

const showDesigner = () => {
  currentView.value = 'designer';
  editingSymbol.value = null;
  store.clearCanvas();
};

const editSymbol = (symbol: TacticalSymbol) => {
  currentView.value = 'designer';
  editingSymbol.value = symbol;
  store.loadSymbol({
    points: symbol.points,
    lines: symbol.lines
  });
};

const saveSymbol = (symbol: TacticalSymbol) => {
  try {
    // Add points and lines from the store
    const symbolToSave: TacticalSymbol = {
      ...symbol,
      points: store.points,
      lines: store.lines
    };
    
    // Check if we're editing or creating
    if (editingSymbol.value) {
      // Update existing symbol
      const index = symbols.value.findIndex(s => s.id === symbol.id);
      if (index !== -1) {
        symbols.value[index] = symbolToSave;
      }
    } else {
      // Add new symbol
      symbols.value.push(symbolToSave);
    }
    
    // Return to list view
    currentView.value = 'list';
    globalSuccess.value = 'نماد با موفقیت ذخیره شد';
    setTimeout(() => {
      globalSuccess.value = null;
    }, 3000);
  } catch (err) {
    globalError.value = err instanceof Error ? err.message : 'An unknown error occurred while saving symbol';
    setTimeout(() => {
      globalError.value = null;
    }, 5000);
  }
};

const deleteSymbol = (id: string) => {
  symbols.value = symbols.value.filter(s => s.id !== id);
};

const cancelEditing = () => {
  currentView.value = 'list';
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

const importSymbols = (importedSymbols: TacticalSymbol[]) => {
  symbols.value = [...symbols.value, ...importedSymbols];
};

const importSymbol = (importedSymbol: TacticalSymbol) => {
  // If we're editing, update the current symbol
  if (currentView.value === 'designer' && editingSymbol.value) {
    editingSymbol.value = importedSymbol;
    store.loadSymbol({
      points: importedSymbol.points,
      lines: importedSymbol.lines
    });
  } else {
    // Otherwise, add to the list
    symbols.value.push(importedSymbol);
  }
};

const handleError = (message: string) => {
  globalError.value = message;
  setTimeout(() => {
    globalError.value = null;
  }, 5000);
};

const handleSuccess = (message: string) => {
  globalSuccess.value = message;
  setTimeout(() => {
    globalSuccess.value = null;
  }, 3000);
};

// Load sample data
onMounted(() => {
  // In a real application, this would load from a database or API
  symbols.value = [];
});
</script>
