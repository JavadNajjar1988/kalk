<template>
  <div class="bg-teal-50/80 dark:bg-teal-950/50 flex min-h-screen flex-col">
    <!-- AppBar Header (Dashboard Style) -->
    <header class="fixed top-0 left-0 right-0 z-50">
      <div class="flex h-16 items-center px-4">
        <!-- Right Section (Logo) -->
        <div class="flex items-center gap-2">
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-blue-600 dark:text-blue-400">
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
                class="flex h-10 w-full rounded-full border border-blue-300/60 dark:border-blue-400/30 bg-blue-100/40 dark:bg-blue-400/15 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/30 dark:supports-[backdrop-filter]:bg-blue-400/20 px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-blue-500 dark:placeholder:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div class="relative">
            <button 
              @click="showProfileMenu = !showProfileMenu"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
            >
              <div class="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                {{ userInfo.name.charAt(0) }}
              </div>
            </button>

            <!-- Profile Dropdown Menu -->
            <div 
              v-if="showProfileMenu"
              class="absolute left-0 top-full translate-y-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-blue-200/40 dark:border-blue-700/40 z-50"
              style="max-height: 200px; overflow-y: auto;"
            >
              <div class="py-1">
                <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                  <div class="font-medium">{{ userInfo.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ userInfo.username }}</div>
                </div>
                <button 
                  @click="logout"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  خروج از سیستم
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 bg-teal-50/80 dark:bg-teal-950/50 backdrop-blur-md transition-all duration-300">
      <!-- Hero Content Section -->
      <div class="p-6 pt-20 bg-blue-50/20 dark:bg-blue-400/10 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/20 dark:supports-[backdrop-filter]:bg-blue-400/15 border border-blue-300/60 dark:border-blue-400/30 shadow-lg shadow-blue-500/5 min-h-screen">
        <!-- Interactive Map Section -->
        <div class="relative w-full mb-8 flex justify-center items-center py-8">
          <div class="w-4/5 max-w-6xl">
            <InteractiveMap />
          </div>
        </div>
        
        <!-- Tactical Graphics Button -->
        <div class="flex justify-center mb-8">
          <button
            @click="goToTacticalGraphics"
            class="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-1"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            ساخت گرافیک تاکتیکال
          </button>
        </div>
        
        <!-- Dashboard Stats Cards -->
        <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 mb-8">
          <div class="rounded-xl border border-blue-200/30 dark:border-blue-700/30 bg-blue-100/60 dark:bg-blue-900/10 backdrop-blur-xl text-card-foreground shadow-lg shadow-blue-500/5">
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
          
          <div class="rounded-xl border border-blue-200/30 dark:border-blue-700/30 bg-blue-100/60 dark:bg-blue-900/10 backdrop-blur-xl text-card-foreground shadow-lg shadow-blue-500/5">
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
          
          <div class="rounded-xl border border-blue-200/30 dark:border-blue-700/30 bg-blue-100/60 dark:bg-blue-900/10 backdrop-blur-xl text-card-foreground shadow-lg shadow-blue-500/5">
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
          
          <div class="rounded-xl border border-blue-200/30 dark:border-blue-700/30 bg-blue-100/60 dark:bg-blue-900/10 backdrop-blur-xl text-card-foreground shadow-lg shadow-blue-500/5">
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
          <div class="bg-blue-100/60 dark:bg-blue-900/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-blue-500/5 border border-blue-200/30 dark:border-blue-700/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
            <div class="text-center mb-8">
              <h2 class="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300 mb-3">
                مدیریت سناریوها
              </h2>
            </div>
            
            <!-- View Toggle and Tab Navigation -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <!-- Action Buttons and Dots Menu -->
              <div class="flex items-center gap-3 mb-4 sm:mb-0">
                <!-- Create New Scenario Button -->
                <button
                  @click="newScenario"
                  class="px-4 py-2 rounded-xl bg-emerald-100/10 dark:bg-emerald-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-emerald-300/10 dark:supports-[backdrop-filter]:bg-emerald-400/3 border border-emerald-300/60 dark:border-emerald-400/30 shadow-lg shadow-emerald-500/5 hover:bg-emerald-200/20 dark:hover:bg-emerald-800/20 transition-all duration-200 flex items-center gap-2"
                >
                  <svg class="h-4 w-4 text-emerald-700 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="text-sm font-medium text-emerald-700 dark:text-emerald-300">ایجاد سناریو جدید</span>
                </button>

                <!-- Load File Button -->
                <button
                  @click="showImport = true"
                  class="px-4 py-2 rounded-xl bg-green-100/10 dark:bg-green-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-green-300/10 dark:supports-[backdrop-filter]:bg-green-400/3 border border-green-300/60 dark:border-green-400/30 shadow-lg shadow-green-500/5 hover:bg-green-200/20 dark:hover:bg-green-800/20 transition-all duration-200 flex items-center gap-2"
                >
                  <svg class="h-4 w-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span class="text-sm font-medium text-green-700 dark:text-green-300"> بارگذاری سناریو</span>
                </button>

                <!-- Tactical Symbols Button -->
                <RouterLink
                  :to="{ name: TACTICAL_SYMBOL_DEFINITION_ROUTE }"
                  class="px-4 py-2 rounded-xl bg-purple-100/10 dark:bg-purple-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-purple-300/10 dark:supports-[backdrop-filter]:bg-purple-400/3 border border-purple-300/60 dark:border-purple-400/30 shadow-lg shadow-purple-500/5 hover:bg-purple-200/20 dark:hover:bg-purple-800/20 transition-all duration-200 flex items-center gap-2"
                >
                  <svg class="h-4 w-4 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-medium text-purple-700 dark:text-purple-300">نمادهای تاکتیکال</span>
                </RouterLink>

                <!-- Dots Menu -->
                <div class="relative">
                  <button 
                    @click="toggleTabMenu"
                    class="px-4 py-2 rounded-xl bg-blue-100/10 dark:bg-blue-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/10 dark:supports-[backdrop-filter]:bg-blue-400/3 border border-blue-300/60 dark:border-blue-400/30 shadow-lg shadow-blue-500/5 hover:bg-blue-200/20 dark:hover:bg-blue-800/20 transition-all duration-200 flex items-center gap-2"
                  >
                    <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {{ activeTab === 'all' ? 'همه' : 'اخیر' }}
                    </span>
                    <svg class="h-4 w-4 text-blue-700 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div 
                    v-if="showTabMenu" 
                    class="absolute top-full right-0 mt-2 w-48 bg-blue-100/10 dark:bg-blue-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/10 dark:supports-[backdrop-filter]:bg-blue-400/3 rounded-2xl p-1 border border-blue-300/60 dark:border-blue-400/30 shadow-lg shadow-blue-500/5 z-50"
                    dir="LTR"
                  >
                    <div class="flex flex-col gap-1">
                      <button 
                        @click="activeTab = 'all'; showTabMenu = false"
                        :class="activeTab === 'all' ? 'bg-blue-200/60 dark:bg-blue-800/60 shadow-lg shadow-blue-500/10' : 'hover:bg-blue-200/40 dark:hover:bg-blue-800/40'"
                        class="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300 text-right flex items-center justify-end w-full"
                      >
                        همه
                      </button>
                      <button 
                        @click="activeTab = 'recent'; showTabMenu = false"
                        :class="activeTab === 'recent' ? 'bg-blue-200/60 dark:bg-blue-800/60 shadow-lg shadow-blue-500/10' : 'hover:bg-blue-200/40 dark:hover:bg-blue-800/40'"
                        class="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300 text-right flex items-center justify-end w-full"
                      >
                        اخیر
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- View Toggle -->
              <div class="bg-blue-100/10 dark:bg-blue-400/2 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/10 dark:supports-[backdrop-filter]:bg-blue-400/3 rounded-2xl p-1 border border-blue-300/60 dark:border-blue-400/30 shadow-lg shadow-blue-500/5">
                <div class="flex gap-1">
                  <button 
                    @click="viewMode = 'cards'"
                    :class="viewMode === 'cards' ? 'bg-blue-200/60 dark:bg-blue-800/60 shadow-lg shadow-blue-500/10' : 'hover:bg-blue-200/40 dark:hover:bg-blue-800/40'"
                    class="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-blue-700 dark:text-blue-300 flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    کارتی
                  </button>
                  <button 
                    @click="viewMode = 'table'"
                    :class="viewMode === 'table' ? 'bg-blue-200/60 dark:bg-blue-800/60 shadow-lg shadow-blue-500/10' : 'hover:bg-blue-200/40 dark:hover:bg-blue-800/40'"
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
              :showAllScenarios="showAllScenarios"
              :currentPage="currentPage"
              :totalScenarios="totalScenarios"
              :serverScenarios="serverScenarios"
              @toggle-dropdown="toggleDropdown"
              @new-scenario="newScenario"
              @delete-scenario="deleteScenario"
              @edit-scenario="editScenario"
              @run-scenario="runScenario"
              @download-scenario="saveScenario"
            />

            <!-- Server block removed; now integrated into ScenarioManagementContent -->
            
            <!-- View All Button for Cards Mode -->
            <div v-if="viewMode === 'cards'" class="text-center mt-8">
              <button 
                @click="showAllScenarios = !showAllScenarios"
                class="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 dark:bg-blue-400/5 backdrop-blur-sm border border-blue-300/30 dark:border-blue-600/30 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span class="text-sm font-semibold text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors duration-200">
                  {{ showAllScenarios ? 'نمایش کمتر' : 'مشاهده همه سناریوها' }}
                </span>
                <svg 
                  class="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-200 transform group-hover:translate-x-0.5" 
                  :class="{ 'rotate-180': showAllScenarios }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <!-- Pagination for Table Mode -->
            <div v-if="viewMode === 'table' && totalScenarios > 10" class="flex items-center justify-between mt-8 px-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-600 dark:text-slate-400">
                  نمایش {{ (currentPage - 1) * 10 + 1 }} تا {{ Math.min(currentPage * 10, totalScenarios) }} از {{ totalScenarios }} سناریو
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="currentPage = Math.max(1, currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white/60 dark:bg-slate-700/60 border border-slate-200/50 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300"
                >
                  قبلی
                </button>
                <div class="flex items-center gap-1">
                  <button 
                    v-for="page in visiblePages" 
                    :key="page"
                    @click="currentPage = page"
                    :class="[
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      page === currentPage 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-white/60 dark:bg-slate-700/60 border border-slate-200/50 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                    ]"
                  >
                    {{ page }}
                  </button>
                </div>
                <button 
                  @click="currentPage = Math.min(totalPages, currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white/60 dark:bg-slate-700/60 border border-slate-200/50 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300"
                >
                  بعدی
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <LoadScenarioModal v-model="showImport" />
    <DeleteConfirmModal 
      v-model="showDeleteModal" 
      :scenario-name="selectedScenarioForDelete?.name || ''"
      @confirm="confirmDeleteScenario"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import InteractiveMap from "@/components/InteractiveMap.vue";
import ScenarioManagementContent from "@/components/ScenarioManagementContent.vue";
import { Button } from "@/components/ui/button";
import { useRouter } from "vue-router";
import { ref, computed, onMounted, onUnmounted } from "vue";
import LoadScenarioModal from "@/components/LoadScenarioModal.vue";
import DeleteConfirmModal from "@/components/DeleteConfirmModal.vue";
import { NEW_SCENARIO_ROUTE, MAP_EDIT_MODE_ROUTE, TACTICAL_GRAPHICS_ROUTE } from "@/router/names";
import { useDark, useToggle } from "@vueuse/core";
import { scenarioApiService } from "@/services/api/scenarioApiService";
import { useIndexedDb } from "@/scenariostore/localdb";

const router = useRouter();

// Theme management
const isDark = useDark();
const toggleDark = useToggle(isDark);

// State for sidebar and search
const sidebarOpen = ref(false);
const searchQuery = ref('');
const showSearch = ref(false);
const showImport = ref(false);

// Profile management
const showProfileMenu = ref(false);
const userInfo = ref({
  name: 'کاربر',
  username: 'user',
  role: 'operator'
});

// Get user info from token
const getUserInfoFromToken = () => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userInfo.value = {
        name: payload.sub === 'admin' ? 'مدیر سیستم' : 'اپراتور سیستم',
        username: payload.sub || 'user',
        role: payload.roles?.includes('ADMIN') ? 'admin' : 'operator'
      };
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
};

// Logout function
const logout = () => {
  // Clear token from localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('access_token_exp');
  sessionStorage.removeItem('access_token');
  localStorage.removeItem('persist:sajed-root');
  
  // Close profile menu
  showProfileMenu.value = false;
  
  // Send logout message to parent (React Dashboard)
  if (window.parent !== window) {
    try {
      window.parent.postMessage({
        type: 'LOGOUT_REQUEST',
        origin: 'vue',
        timestamp: Date.now()
      }, window.location.origin);
    } catch (error) {
      console.error('Error sending logout message:', error);
    }
  }
  
  // Redirect to login
  console.log('User logged out');
  window.location.replace(`${window.location.origin}/auth/login`);
};

// State for scenarios section
const activeTab = ref('all');
const viewMode = ref('cards');
const dropdownOpen = ref<number | string | null>(null);
const showTabMenu = ref(false);
const showDeleteModal = ref(false);
const selectedScenarioForDelete = ref<{ id: number | string; name: string } | null>(null);

// State for view controls
const showAllScenarios = ref(false);
const currentPage = ref(1);
const totalScenarios = ref(2); // تعداد کل سناریوها

  // Server scenarios (from backend)
  const serverScenarios = ref<Array<{ id: string; name: string; description?: string }>>([]);

// Computed properties for pagination
const totalPages = computed(() => Math.ceil(totalScenarios.value / 10));
const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Sidebar toggle function
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

// Dropdown toggle function
const toggleDropdown = (cardId: number | string) => {
  if (dropdownOpen.value === cardId) {
    dropdownOpen.value = null;
  } else {
    dropdownOpen.value = cardId;
  }
};

// Tab menu toggle function
const toggleTabMenu = () => {
  showTabMenu.value = !showTabMenu.value;
};

// New scenario creation
const newScenario = () => {
  router.push({ name: NEW_SCENARIO_ROUTE });
};

const goToTacticalSymbols = () => {
  router.push({ name: TACTICAL_SYMBOL_DEFINITION_ROUTE });
};

// Scenario actions
const deleteScenario = (scenarioId: number | string) => {
  // Check if it's a server scenario (string ID)
  if (typeof scenarioId === 'string') {
    // For server scenarios, we need to get the name from serverScenarios
    const serverScenario = serverScenarios.value.find(s => s.id === scenarioId);
    const scenarioName = serverScenario?.name || 'سناریو سرور';
    selectedScenarioForDelete.value = { id: scenarioId, name: scenarioName };
    showDeleteModal.value = true;
    return;
  }

  // For sample scenarios (number ID), use existing logic
  const scenarioNameMap: Record<number, string> = {
    1: 'عملیات بیت المقدس',
    2: 'عملیات مرصاد',
    3: 'آزادسازی خرمشهر – عملیات بیت‌المقدس',
    4: 'عملیات مرصاد (۱۳۶۷)',
    5: 'عملیات بیت المقدس',
    6: 'عملیات مرصاد',
    7: 'آزادسازی خرمشهر – عملیات بیت‌المقدس',
    8: 'عملیات مرصاد (۱۳۶۷)'
  };
  
  const scenarioName = scenarioNameMap[scenarioId] || 'سناریو';
  selectedScenarioForDelete.value = { id: scenarioId, name: scenarioName };
  showDeleteModal.value = true;
};

const confirmDeleteScenario = async () => {
  if (!selectedScenarioForDelete.value) return;
  
  try {
    const scenarioId = selectedScenarioForDelete.value.id;
    
    // Check if it's a server scenario (string ID)
    if (typeof scenarioId === 'string') {
      // For server scenarios, delete from API
      try {
        await scenarioApiService.remove(scenarioId);
        
        // Remove from local list
        const index = serverScenarios.value.findIndex(s => s.id === scenarioId);
        if (index > -1) {
          serverScenarios.value.splice(index, 1);
        }
        
        console.log('سناریو سرور با موفقیت حذف شد');
        alert('سناریو با موفقیت حذف شد');
      } catch (error) {
        console.error('خطا در حذف سناریو از سرور:', error);
        alert('خطا در حذف سناریو از سرور');
      }
    } else {
      // For demo scenarios, we can't actually delete them from the server
      // Instead, we'll show a message that they are demo scenarios
      console.log('سناریوهای demo قابل حذف نیستند. این سناریوها برای نمایش هستند.');
      
      // Show a notification to the user
      alert('سناریوهای demo قابل حذف نیستند. این سناریوها برای نمایش و آموزش هستند.');
    }
    
    // Close the modal
    showDeleteModal.value = false;
  } catch (error) {
    console.error('خطا در حذف سناریو:', error);
  }
};

const editScenario = async (scenarioId: number | string) => {
  try {
    // Check if it's a server scenario (string ID)
    if (typeof scenarioId === 'string') {
      // For server scenarios, navigate directly to editor
      await router.push({ 
        name: MAP_EDIT_MODE_ROUTE, 
        params: { scenarioId: scenarioId } 
      });
      return;
    }

    // For sample scenarios (number ID), use existing logic
    const scenarioMap: Record<number, string> = {
      1: 'Operation_Beit_ol_Moqaddas_1982_FA',
      2: 'Operation_Mersad_1988_FA',
      3: 'Operation_Beit_ol_Moqaddas_1982_FA',
      4: 'Operation_Mersad_1988_FA',
      5: 'Operation_Beit_ol_Moqaddas_1982_FA',
      6: 'Operation_Mersad_1988_FA',
      7: 'Operation_Beit_ol_Moqaddas_1982_FA',
      8: 'Operation_Mersad_1988_FA'
    };
    
    const actualId = scenarioMap[scenarioId];
    if (!actualId) {
      console.error('سناریو یافت نشد:', scenarioId);
      return;
    }

    // Load demo scenario from JSON file
    const base = (import.meta as any).env?.BASE_URL || "/";
    const idUrlMap: Record<string, string> = {
      Operation_Beit_ol_Moqaddas_1982_FA: `${base}scenarios/Operation_Beit_ol_Moqaddas_1982_FA.json`,
      Operation_Mersad_1988_FA: `${base}scenarios/Operation_Mersad_1988_FA.json`,
    };
    
    const url = idUrlMap[actualId];
    if (!url) {
      console.error('URL سناریو یافت نشد:', actualId);
      return;
    }

    // Fetch scenario data from JSON file
    const response = await fetch(url);
    if (!response.ok) {
      console.error('خطا در بارگذاری سناریو:', response.statusText);
      return;
    }
    
    const scenarioData = await response.json();
    
    // Store scenario data in localStorage for the new scenario page to use
    localStorage.setItem('editingScenario', JSON.stringify(scenarioData));
    router.push({ name: NEW_SCENARIO_ROUTE });
  } catch (error) {
    console.error('خطا در ویرایش سناریو:', error);
  }
};

const saveScenario = async (scenarioId: number | string) => {
  try {
    // Check if it's a server scenario (string ID)
    if (typeof scenarioId === 'string') {
      // For server scenarios, we need to fetch from API
      try {
        const scenarioData = await scenarioApiService.getById(scenarioId);
        const blob = new Blob([JSON.stringify(scenarioData, null, 2)], {
          type: 'application/json'
        });
        
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${(scenarioData as any).name || scenarioId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        console.log('سناریو سرور با موفقیت ذخیره شد');
      } catch (error) {
        console.error('خطا در دریافت سناریو از سرور:', error);
      }
      return;
    }

    // For sample scenarios (number ID), use existing logic
    const scenarioMap: Record<number, string> = {
      1: 'Operation_Beit_ol_Moqaddas_1982_FA',
      2: 'Operation_Mersad_1988_FA',
      3: 'Operation_Beit_ol_Moqaddas_1982_FA',
      4: 'Operation_Mersad_1988_FA',
      5: 'Operation_Beit_ol_Moqaddas_1982_FA',
      6: 'Operation_Mersad_1988_FA',
      7: 'Operation_Beit_ol_Moqaddas_1982_FA',
      8: 'Operation_Mersad_1988_FA'
    };
    
    const actualId = scenarioMap[scenarioId];
    if (!actualId) {
      console.error('سناریو یافت نشد:', scenarioId);
      return;
    }

    // Load demo scenario from JSON file
    const base = (import.meta as any).env?.BASE_URL || "/";
    const idUrlMap: Record<string, string> = {
      Operation_Beit_ol_Moqaddas_1982_FA: `${base}scenarios/Operation_Beit_ol_Moqaddas_1982_FA.json`,
      Operation_Mersad_1988_FA: `${base}scenarios/Operation_Mersad_1988_FA.json`,
    };
    
    const url = idUrlMap[actualId];
    if (!url) {
      console.error('URL سناریو یافت نشد:', actualId);
      return;
    }

    // Fetch scenario data from JSON file
    const response = await fetch(url);
    if (!response.ok) {
      console.error('خطا در بارگذاری سناریو:', response.statusText);
      return;
    }
    
    const scenarioData = await response.json();
    
    // Create and download the JSON file
    const blob = new Blob([JSON.stringify(scenarioData, null, 2)], {
      type: 'application/json'
    });
    
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${scenarioData.name || actualId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    
    console.log('سناریو با موفقیت ذخیره شد');
  } catch (error) {
    console.error('خطا در ذخیره سناریو:', error);
  }
};

const runScenario = (scenarioId: number | string) => {
  // Check if it's a server scenario (string ID)
  if (typeof scenarioId === 'string') {
    // For server scenarios, navigate directly to editor
    router.push({ 
      name: MAP_EDIT_MODE_ROUTE, 
      params: { scenarioId: scenarioId } 
    });
    return;
  }

  // For sample scenarios (number ID), use existing logic
  const scenarioMap: Record<number, string> = {
    1: 'demo-Operation_Beit_ol_Moqaddas_1982_FA',
    2: 'demo-Operation_Mersad_1988_FA',
    3: 'demo-Operation_Beit_ol_Moqaddas_1982_FA',
    4: 'demo-Operation_Mersad_1988_FA',
    5: 'demo-Operation_Beit_ol_Moqaddas_1982_FA',
    6: 'demo-Operation_Mersad_1988_FA',
    7: 'demo-Operation_Beit_ol_Moqaddas_1982_FA',
    8: 'demo-Operation_Mersad_1988_FA'
  };
  
  const actualId = scenarioMap[scenarioId];
  if (actualId) {
    router.push({ 
      name: MAP_EDIT_MODE_ROUTE, 
      params: { scenarioId: actualId } 
    });
  }
};

// Theme toggle function
const toggleTheme = () => {
  toggleDark();
};

// Add this new method
const goToTacticalGraphics = () => {
  router.push({ name: TACTICAL_GRAPHICS_ROUTE });
};

// Persian date and time
const persianDate = ref('');
const persianTime = ref('');

// Update Persian date/time
const updateDateTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    calendar: 'persian'
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
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
let dateTimeInterval: NodeJS.Timeout;

onMounted(() => {
  updateDateTime();
  dateTimeInterval = setInterval(updateDateTime, 60000); // Update every minute
  
  // Initialize user info
  getUserInfoFromToken();
  // Load scenarios from API
  scenarioApiService
    .list()
    .then((items) => {
      serverScenarios.value = items as any;
      // Optionally update totalScenarios to include server items
      try { totalScenarios.value = Math.max(totalScenarios.value, serverScenarios.value.length); } catch {}
    })
    .catch((e) => console.error('Failed to load scenarios from API:', e));
  // React to auth updates from bridge
  const applied = () => getUserInfoFromToken();
  const cleared = () => getUserInfoFromToken();
  window.addEventListener('kalk-auth-applied', applied as any);
  window.addEventListener('kalk-auth-cleared', cleared as any);
  
  // Close tab menu when clicking outside
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target && !target.closest('.relative')) {
      showTabMenu.value = false;
      showProfileMenu.value = false;
    }
  });
});

onUnmounted(() => {
  if (dateTimeInterval) {
    clearInterval(dateTimeInterval);
  }
  window.removeEventListener('kalk-auth-applied', getUserInfoFromToken as any);
  window.removeEventListener('kalk-auth-cleared', getUserInfoFromToken as any);
});
</script>
