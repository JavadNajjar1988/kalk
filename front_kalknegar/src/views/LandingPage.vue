<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/60 via-slate-50 to-blue-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950 text-foreground">
    <!-- AppBar Header (Dashboard Style) -->
    <header class="fixed top-0 left-0 right-0 z-50">
      <div class="flex h-16 items-center px-4">
        <!-- Right Section (Logo) -->
        <div class="flex items-center gap-2">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              کالک نگار
            </h1>
          </div>
        </div>

        <!-- Center Section (Search) -->
        <div class="flex-1 flex justify-center px-6">
          <div class="w-full max-w-lg relative">
            <div class="relative">
              <svg class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="جستجو در سناریوها..."
                class="flex h-10 w-full rounded-full border border-blue-200 dark:border-blue-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-blue-400 dark:placeholder:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                v-model="searchQuery"
              />
            </div>
          </div>
        </div>

        <!-- Left Section (Actions) -->
        <div class="flex items-center gap-2">
          <!-- Theme Toggle Button -->
          <button 
            @click="toggleTheme"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            <svg v-if="isDark" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          
          <!-- Profile Button -->
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
            <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              ک
            </div>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 pt-16 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-blue-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950 transition-all duration-300" :class="sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'">
      <!-- Hero Content Section -->
      <div class="p-6">
        <!-- Interactive Map Section -->
        <div class="relative w-full mb-8 flex justify-center items-center py-8">
          <div class="w-4/5 max-w-6xl">
            <InteractiveMap />
          </div>
        </div>
        
        <!-- Dashboard Stats Cards -->
        <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mb-8">
          <div class="rounded-xl border border-blue-200/50 dark:border-blue-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-card-foreground shadow-lg shadow-blue-500/10">
            <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none text-blue-600 dark:text-blue-400">سناریوهای فعال</p>
                <p class="text-3xl font-bold text-blue-800 dark:text-blue-200">۵</p>
                <p class="text-xs text-blue-500 dark:text-blue-300">۲ در حال اجرا</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="rounded-xl border border-cyan-200/50 dark:border-cyan-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-card-foreground shadow-lg shadow-cyan-500/10">
            <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none text-cyan-600 dark:text-cyan-400">نبردهای تاریخی</p>
                <p class="text-3xl font-bold text-cyan-800 dark:text-cyan-200">۳</p>
                <p class="text-xs text-cyan-500 dark:text-cyan-300">آماده بررسی</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <div class="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center">
                  <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="rounded-xl border border-sky-200/50 dark:border-sky-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-card-foreground shadow-lg shadow-sky-500/10">
            <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none text-sky-600 dark:text-sky-400">نیروها</p>
                <p class="text-3xl font-bold text-sky-800 dark:text-sky-200">۲۴۵</p>
                <p class="text-xs text-sky-500 dark:text-sky-300">واحد در دسترس</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-sky-500/20 flex items-center justify-center">
                <div class="h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center">
                  <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div class="rounded-xl border border-indigo-200/50 dark:border-indigo-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-card-foreground shadow-lg shadow-indigo-500/10">
            <div class="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none text-indigo-600 dark:text-indigo-400">عملیات</p>
                <p class="text-3xl font-bold text-indigo-800 dark:text-indigo-200">۸</p>
                <p class="text-xs text-indigo-500 dark:text-indigo-300">در حال انجام</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Scenario Management Section -->
        <div class="mt-8">
          <div class="bg-gradient-to-br from-slate-50/80 to-blue-50/80 dark:from-slate-800/40 dark:to-blue-900/40 backdrop-blur-lg rounded-3xl border border-blue-200/40 dark:border-blue-700/30 shadow-lg shadow-blue-500/10 p-8">
            <div class="text-center mb-8">
              <h2 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-3">
                مدیریت سناریوها
              </h2>
            </div>
            
            <!-- View Toggle and Tab Navigation -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <!-- Tab Navigation -->
              <div class="bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-1 border border-blue-200/50 dark:border-blue-600/30 shadow-lg shadow-blue-500/10 mb-4 sm:mb-0">
                <div class="flex gap-1">
                  <button 
                    @click="activeTab = 'all'"
                    :class="activeTab === 'all' ? 'bg-white dark:bg-slate-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/70 dark:hover:bg-slate-600/50'"
                    class="px-6 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300"
                  >
                    همه
                  </button>
                  <button 
                    @click="activeTab = 'recent'"
                    :class="activeTab === 'recent' ? 'bg-white dark:bg-slate-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/70 dark:hover:bg-slate-600/50'"
                    class="px-6 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300"
                  >
                    اخیر
                  </button>
                  <button 
                    @click="activeTab = 'samples'"
                    :class="activeTab === 'samples' ? 'bg-white dark:bg-slate-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/70 dark:hover:bg-slate-600/50'"
                    class="px-6 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300"
                  >
                    نمونه
                  </button>
                </div>
              </div>
              
              <!-- View Toggle -->
              <div class="bg-white/70 dark:bg-slate-700/50 backdrop-blur-sm rounded-2xl p-1 border border-blue-200/50 dark:border-blue-600/30 shadow-lg shadow-blue-500/10">
                <div class="flex gap-1">
                  <button 
                    @click="viewMode = 'cards'"
                    :class="viewMode === 'cards' ? 'bg-white dark:bg-slate-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/70 dark:hover:bg-slate-600/50'"
                    class="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300 flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    کارتی
                  </button>
                  <button 
                    @click="viewMode = 'table'"
                    :class="viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow-lg shadow-blue-500/20' : 'hover:bg-white/70 dark:hover:bg-slate-600/50'"
                    class="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300 flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                    </svg>
                    جدول
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Cards/Table View Content -->
            <ScenarioManagementContent 
              :activeTab="activeTab" 
              :viewMode="viewMode" 
              :dropdownOpen="dropdownOpen"
              @toggle-dropdown="toggleDropdown"
              @new-scenario="newScenario"
              @delete-scenario="deleteScenario"
              @edit-scenario="editScenario"
              @run-scenario="runScenario"
              @download-scenario="downloadScenario"
            />
            
            <div class="text-center mt-8">
              <button class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-200">
                مشاهده همه سناریوها ←
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    <ImportModal v-model="showImport" />
  </div>
</template>

<script setup lang="ts">
import InteractiveMap from "@/components/InteractiveMap.vue";
import ScenarioManagementContent from "@/components/ScenarioManagementContent.vue";
import { Button } from "@/components/ui/button";
import { useRouter } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";
import ImportModal from "@/components/ImportModal.vue";
import { NEW_SCENARIO_ROUTE } from "@/router/names";
import { useDark, useToggle } from "@vueuse/core";

const router = useRouter();

// Theme management
const isDark = useDark();
const toggleDark = useToggle(isDark);

// State for sidebar and search
const sidebarOpen = ref(false);
const searchQuery = ref('');
const showImport = ref(false);

// State for scenarios section
const activeTab = ref('all');
const viewMode = ref('cards');
const dropdownOpen = ref(null);

// Sidebar toggle function
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

// Dropdown toggle function
const toggleDropdown = (cardId) => {
  if (dropdownOpen.value === cardId) {
    dropdownOpen.value = null;
  } else {
    dropdownOpen.value = cardId;
  }
};

// New scenario creation
const newScenario = () => {
  router.push({ name: NEW_SCENARIO_ROUTE });
};

// Scenario actions
const deleteScenario = (scenarioId) => {
  console.log('حذف سناریو:', scenarioId);
  // TODO: Implement delete functionality
};

const editScenario = (scenarioId) => {
  console.log('ویرایش سناریو:', scenarioId);
  // TODO: Implement edit functionality
};

const downloadScenario = (scenarioId) => {
  console.log('دانلود سناریو:', scenarioId);
  // TODO: Implement download functionality
};

const runScenario = (scenarioId) => {
  console.log('اجرای سناریو:', scenarioId);
  // TODO: Implement run functionality
};

// Theme toggle function
const toggleTheme = () => {
  toggleDark();
};

// Persian date and time
const persianDate = ref('');
const persianTime = ref('');

// Update Persian date/time
const updateDateTime = () => {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    calendar: 'persian',
    locale: 'fa-IR'
  };
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'persian',
    locale: 'fa-IR'
  };
  
  try {
    persianDate.value = new Intl.DateTimeFormat('fa-IR-u-ca-persian', options).format(now);
    persianTime.value = new Intl.DateTimeFormat('fa-IR', timeOptions).format(now);
  } catch {
    // Fallback if Persian calendar is not supported
    persianDate.value = 'تاریخ شمسی';
    persianTime.value = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  }
};

// Navigation functions
const navigateToScenarios = () => {
  const scenariosElement = document.getElementById('scenarios');
  if (scenariosElement) {
    scenariosElement.scrollIntoView({ behavior: 'smooth' });
  }
};

// Initialize date/time and set interval
let dateTimeInterval: number;

onMounted(() => {
  updateDateTime();
  dateTimeInterval = setInterval(updateDateTime, 60000); // Update every minute
});

onUnmounted(() => {
  if (dateTimeInterval) {
    clearInterval(dateTimeInterval);
  }
});
</script>