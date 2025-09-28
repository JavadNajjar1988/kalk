<template>
  <header class="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-5">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);" />
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);" />
    </div>
    
    <!-- Navigation Bar -->
    <nav class="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-4 rtl:space-x-reverse">
          <div class="flex items-center space-x-2 rtl:space-x-reverse">
            <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">ک</span>
            </div>
            <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100">
              کالک نگار
            </h1>
          </div>
        </div>

        <!-- Navigation Actions -->
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <!-- Help Button -->
          <button
            class="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            @click="showHelp"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          <!-- Settings Button -->
          <button
            class="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            @click="showSettings"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative z-10 px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="max-w-7xl mx-auto text-center">
        <div class="mb-8">
          <h1 class="text-4xl sm:text-6xl md:text-7xl font-bold text-slate-800 dark:text-slate-100 mb-6 leading-tight">
            <span class="text-red-500">
              کالک نگار
            </span>
          </h1>
          <p class="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            ابزار پیشرفته مدیریت و بازسازی نبردهای تاریخی، طراحی سناریوهای نظامی و ایجاد آرایش نیروها
          </p>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            @click="navigateToScenarios"
          >
            شروع کار با سناریوها
          </button>
          <button
            class="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            @click="showImport = true"
          >
            وارد کردن نقشه/داده
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div class="bg-purple-100 dark:bg-purple-900/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
            <div class="text-3xl font-bold text-purple-800 dark:text-purple-300 mb-2">۳</div>
            <div class="text-purple-700 dark:text-purple-400">سناریوی آماده</div>
          </div>
          <div class="bg-green-100 dark:bg-green-900/30 rounded-2xl p-6 border border-green-200 dark:border-green-700">
            <div class="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">۲۴۵</div>
            <div class="text-green-700 dark:text-green-400">واحد نظامی</div>
          </div>
        </div>
      </div>
    </section>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Emits
const emit = defineEmits(['navigate-to-scenarios', 'show-import', 'show-help', 'show-settings'])

// Local state
const showImport = ref(false)

// Methods
const navigateToScenarios = () => {
  emit('navigate-to-scenarios')
}

const showHelp = () => {
  emit('show-help')
}

const showSettings = () => {
  emit('show-settings')
}
</script>
