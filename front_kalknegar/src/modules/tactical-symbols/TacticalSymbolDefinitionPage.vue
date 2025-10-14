<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
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
                سیستم تعریف نمادهای تاکتیکال
              </h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                تعریف و مدیریت نمادهای تاکتیکال سفارشی
              </p>
            </div>
          </div>
          <div class="flex space-x-3 space-x-reverse">
            <button
              @click="goToSymbolDesigner"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>طراحی نماد</span>
            </button>
            <button
              @click="showCreateModal = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>نماد جدید</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Info Banner -->
      <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <div class="flex items-start space-x-3 space-x-reverse">
          <svg class="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">راهنمای استفاده</h3>
            <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
              برای طراحی نمادهای تاکتیکال و ترسیم نقاط و خطوط، از دکمه "طراحی نماد" استفاده کنید. 
              برای مدیریت نمادهای موجود، از دکمه "نماد جدید" یا ویرایش نمادهای موجود استفاده کنید.
            </p>
          </div>
        </div>
      </div>

      <!-- Categories Tabs -->
      <div class="mb-8">
        <nav class="flex space-x-8 space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectedCategory = category.id"
            :class="[
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              selectedCategory === category.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            {{ category.name }}
          </button>
        </nav>
      </div>

      <!-- Symbols Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="symbol in filteredSymbols"
          :key="symbol.id"
          @click="selectSymbol(symbol)"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ symbol.name }}
            </h3>
            <div class="flex space-x-2 space-x-reverse">
              <button
                @click.stop="editSymbol(symbol)"
                class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="ویرایش"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click.stop="deleteSymbol(symbol)"
                class="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="حذف"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {{ symbol.description || 'بدون توضیحات' }}
          </p>
          
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{{ symbol.anchorPoints.length }} نقطه لنگر</span>
            <span>{{ symbol.pointLogic.length }} منطق نقطه</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredSymbols.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">هیچ نمادی یافت نشد</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          برای شروع، یک نماد جدید ایجاد کنید.
        </p>
        <div class="mt-6 flex justify-center space-x-3 space-x-reverse">
          <button
            @click="goToSymbolDesigner"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            طراحی نماد
          </button>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            نماد جدید
          </button>
        </div>
      </div>
    </main>

    <!-- Create/Edit Modal -->
    <TacticalSymbolDefinitionView
      v-if="showCreateModal || showEditModal"
      :symbol="editingSymbol"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTacticalSymbolStore } from './stores';
import type { TacticalSymbolDefinition } from './types';
import TacticalSymbolDefinitionView from './TacticalSymbolDefinitionView.vue';

const router = useRouter();
const store = useTacticalSymbolStore();

// State
const selectedCategory = ref('all');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingSymbol = ref<TacticalSymbolDefinition | null>(null);

// Computed
const categories = computed(() => store.categories);
const filteredSymbols = computed(() => {
  if (selectedCategory.value === 'all') {
    return store.symbols;
  }
  return store.symbols.filter(symbol => symbol.category === selectedCategory.value);
});

// Methods
const goBack = () => {
  router.push('/');
};

const goToSymbolDesigner = () => {
  router.push('/symbol-designer');
};

const selectSymbol = (symbol: TacticalSymbolDefinition) => {
  store.selectSymbol(symbol);
  // Navigate to symbol editor
  router.push(`/tactical-symbols/${symbol.id}`);
};

const editSymbol = (symbol: TacticalSymbolDefinition) => {
  editingSymbol.value = symbol;
  showEditModal.value = true;
};

const deleteSymbol = (symbol: TacticalSymbolDefinition) => {
  if (confirm(`آیا از حذف نماد "${symbol.name}" اطمینان دارید؟`)) {
    store.deleteSymbol(symbol.id);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingSymbol.value = null;
};

const handleSave = (symbol: TacticalSymbolDefinition) => {
  if (editingSymbol.value) {
    store.updateSymbol(symbol.id, symbol);
  } else {
    store.addSymbol(symbol);
  }
  closeModal();
};

// Lifecycle
onMounted(() => {
  store.loadSampleData();
});
</script>