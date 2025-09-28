<template>
  <nav class="bg-slate-900 border-b border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-12">
        <!-- Left Section - Logo, Menu, Scenario Name -->
        <div class="flex items-center flex-1 min-w-0">
          <!-- Back Button -->
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors mr-2"
            @click="onBackToScenarios"
            title="بازگشت به لیست سناریوها"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Main Menu -->
          <div class="flex items-center min-w-0 flex-1">
            <button
              class="flex items-center text-white hover:text-slate-300 transition-colors mr-4 hidden sm:flex"
              @click="toggleMainMenu"
            >
              <div class="w-7 h-7 mr-2">
                <svg viewBox="41 41 118 118" fill="currentColor" class="w-full h-full">
                  <path d="m100 45 55 25v60l-55 25-55-25V70z" stroke-width="6" stroke="currentColor"/>
                  <path d="m45 70 110 60m-110 0 110-60" stroke-width="6" stroke="currentColor"/>
                  <circle cx="100" cy="70" r="10" fill="currentColor"/>
                </svg>
              </div>
              نقشه‌کش آرایش نبرد
            </button>

            <!-- Scenario Name -->
            <div class="text-sm text-slate-400 ml-2 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap hidden sm:block">
              {{ scenario?.name || 'سناریو بدون نام' }}
            </div>
          </div>
        </div>

        <!-- Center Section - Mode Toggle -->
        <div class="flex items-center mx-2">
          <div class="bg-slate-800 rounded-lg p-1 flex">
            <button
              v-for="mode in modes"
              :key="mode.value"
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              :class="currentMode === mode.value 
                ? 'bg-green-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'"
              @click="onModeChange(mode.value)"
              :title="mode.title"
            >
              <component :is="mode.icon" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Right Section - Actions -->
        <div class="flex items-center space-x-1 rtl:space-x-reverse">
          <!-- Undo/Redo -->
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors hidden sm:inline-flex"
            @click="handleUndo"
            title="واگرد (Ctrl+Z)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            class="p-2 text-slate-400 hover:text-white transition-colors hidden sm:inline-flex"
            @click="handleRedo"
            title="تکرار (Ctrl+Shift+Z)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>

          <div class="w-px h-6 bg-slate-700 mx-2"></div>

          <!-- Search -->
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors"
            @click="handleSearch"
            title="جستجو (Ctrl+K)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <!-- Help -->
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors hidden sm:inline-flex"
            @click="handleHelp"
            title="راهنما"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <!-- View Options -->
          <button
            class="p-2 text-slate-400 hover:text-white transition-colors"
            @click="toggleViewMenu"
            title="گزینه‌های نمایش"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Menu Dropdown -->
    <div
      v-if="showMainMenu"
      class="absolute top-12 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-48"
    >
      <div class="py-2">
        <button class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          فایل
        </button>
        <button class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          ویرایش
        </button>
        <button class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          نمایش
        </button>
        <div class="border-t border-slate-200 dark:border-slate-700 my-2"></div>
        <button class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          ابزارها
        </button>
        <button class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          راهنما
        </button>
      </div>
    </div>

    <!-- View Menu Dropdown -->
    <div
      v-if="showViewMenu"
      class="absolute top-12 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-48"
    >
      <div class="py-2">
        <button
          class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
          @click="onToggleToolbar"
        >
          نوار ابزار نقشه
          <span v-if="showToolbar" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            فعال
          </span>
        </button>
        <button
          class="w-full px-4 py-2 text-right text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
          @click="onToggleTimeline"
        >
          خط زمان
          <span v-if="showTimeline" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            فعال
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  scenario?: {
    name?: string
  }
  currentMode: 'map' | 'grid' | 'chart'
  showTimeline: boolean
  showToolbar: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentMode: 'map',
  showTimeline: false,
  showToolbar: false
})

// Emits
const emit = defineEmits<{
  'mode-change': [mode: 'map' | 'grid' | 'chart']
  'toggle-timeline': []
  'toggle-toolbar': []
  'back-to-scenarios': []
  'search': []
  'help': []
}>()

// Local state
const showMainMenu = ref(false)
const showViewMenu = ref(false)

// Computed
const modes = computed(() => [
  {
    value: 'map' as const,
    title: 'نمای نقشه',
    icon: 'MapIcon'
  },
  {
    value: 'grid' as const,
    title: 'نمای جدولی',
    icon: 'GridIcon'
  },
  {
    value: 'chart' as const,
    title: 'نمای چارت',
    icon: 'ChartIcon'
  }
])

// Methods
const onModeChange = (mode: 'map' | 'grid' | 'chart') => {
  emit('mode-change', mode)
}

const onToggleTimeline = () => {
  emit('toggle-timeline')
  showViewMenu.value = false
}

const onToggleToolbar = () => {
  emit('toggle-toolbar')
  showViewMenu.value = false
}

const onBackToScenarios = () => {
  emit('back-to-scenarios')
}

const handleSearch = () => {
  emit('search')
}

const handleHelp = () => {
  emit('help')
}

const handleUndo = () => {
  console.log('Undo action')
}

const handleRedo = () => {
  console.log('Redo action')
}

const toggleMainMenu = () => {
  showMainMenu.value = !showMainMenu.value
  showViewMenu.value = false
}

const toggleViewMenu = () => {
  showViewMenu.value = !showViewMenu.value
  showMainMenu.value = false
}

// Close menus when clicking outside
const closeMenus = () => {
  showMainMenu.value = false
  showViewMenu.value = false
}

// Add click outside listener
document.addEventListener('click', closeMenus)
</script>
