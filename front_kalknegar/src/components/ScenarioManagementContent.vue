<template>
  <!-- Cards View -->
  <div v-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
    <!-- Recent Scenario Cards -->
    <template v-if="activeTab === 'all' || activeTab === 'recent'">
      <!-- عملیات بیت المقدس -->
      <div class="group relative bg-blue-100/60 dark:bg-blue-900/60 rounded-2xl border border-blue-200/30 dark:border-blue-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/40 shadow-lg hover:shadow-xl transition-all duration-400 cursor-pointer hover:-translate-y-1 backdrop-blur-xl">
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', 1)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
             <div v-if="dropdownOpen === 1" class="absolute top-full left-0 mt-1.5 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
               <button @click="$emit('edit-scenario', 1)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 <span class="font-medium">ویرایش</span>
               </button>
               <button @click="$emit('run-scenario', 1)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span class="font-medium">اجرا</span>
               </button>
               <button @click="$emit('download-scenario', 1)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="font-medium">دانلود</span>
              </button>
               <button @click="$emit('delete-scenario', 1)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                 <span class="font-medium">حذف</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-base text-slate-800 dark:text-slate-100 leading-tight truncate">عملیات بیت المقدس</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">آخرین تغییر: ۲ روز پیش</p>
            </div>
          </div>
          
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
            شبیه‌سازی یکی از مهم‌ترین عملیات تاریخی دفاع مقدس
          </p>
          
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
              در حال اجرا
            </span>
            <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 group">
              <span>ادامه کار</span>
              <svg class="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- عملیات مرصاد -->
      <div class="group relative bg-blue-100/60 dark:bg-blue-900/60 rounded-2xl border border-blue-200/30 dark:border-blue-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/40 shadow-lg hover:shadow-xl transition-all duration-400 cursor-pointer hover:-translate-y-1 backdrop-blur-xl">
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', 2)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
             <div v-if="dropdownOpen === 2" class="absolute top-full left-0 mt-1.5 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
               <button @click="$emit('edit-scenario', 2)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 <span class="font-medium">ویرایش</span>
               </button>
               <button @click="$emit('run-scenario', 2)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span class="font-medium">اجرا</span>
               </button>
               <button @click="$emit('download-scenario', 2)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 <span class="font-medium">دانلود</span>
               </button>
               <button @click="$emit('delete-scenario', 2)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
                 <span class="font-medium">حذف</span>
               </button>
             </div>
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-base text-slate-800 dark:text-slate-100 leading-tight truncate">عملیات مرصاد</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">آخرین تغییر: ۱ هفته پیش</p>
            </div>
          </div>
          
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
            تحلیل و بررسی عملیات مرصاد ۱۳۶۷
          </p>
          
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
              تکمیل شده
            </span>
            <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200 group">
              <span>مشاهده</span>
              <svg class="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Sample Scenario Cards -->
    <template v-if="activeTab === 'all' || activeTab === 'samples'">
      <!-- آزادسازی خرمشهر – عملیات بیت‌المقدس -->
      <div class="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-400/70 dark:hover:border-teal-500/70 shadow-lg hover:shadow-xl transition-all duration-400 hover:-translate-y-1">
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', 3)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
             <div v-if="dropdownOpen === 3" class="absolute top-full left-0 mt-1.5 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
               <button @click="$emit('edit-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 <span class="font-medium">ویرایش</span>
               </button>
               <button @click="$emit('run-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span class="font-medium">اجرا</span>
               </button>
               <button @click="$emit('download-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 <span class="font-medium">دانلود</span>
               </button>
               <button @click="$emit('delete-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
                 <span class="font-medium">حذف</span>
               </button>
             </div>
          </div>
        </div>
        <router-link :to="getScenarioTo('Operation_Beit_ol_Moqaddas_1982_FA')" class="block h-full" draggable="false">
          <div class="relative h-40 overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="/scenarios/images/خرمشهر.jpg"
              alt="آزادسازی خرمشهر – عملیات بیت‌المقدس"
              draggable="false"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div class="absolute top-2.5 left-2.5">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-slate-700 border border-white/20 shadow-sm">
                نمونه
              </span>
            </div>
            <div class="absolute bottom-2.5 left-2.5 right-2.5">
              <h4 class="text-white font-semibold text-sm leading-tight drop-shadow-md">
                آزادسازی خرمشهر – عملیات بیت‌المقدس
              </h4>
              <p class="text-slate-200 text-xs mt-0.5 font-medium drop-shadow-sm">(۱۳۶۱)</p>
            </div>
          </div>
          <div class="p-4">
            <p class="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2 mb-3">
              این سناریو پیشروی مشترک ارتش جمهوری اسلامی ایران و سپاه پاسداران از شرق کارون تا آزادسازی خرمشهر.
            </p>
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                آماده
              </span>
              <div class="flex items-center gap-1 text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-200">
                <span class="text-xs font-medium">مشاهده</span>
                <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M15.293 6.707a1 1 0 010 1.414L11.414 12l3.879 3.879a1 1 0 01-1.414 1.414l-4.586-4.586a1 1 0 010-1.414l4.586-4.586a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </router-link>
      </div>
      
      <!-- عملیات مرصاد -->
      <div class="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-400/70 dark:hover:border-teal-500/70 shadow-lg hover:shadow-xl transition-all duration-400 hover:-translate-y-1">
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', 4)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
             <div v-if="dropdownOpen === 4" class="absolute top-full left-0 mt-1.5 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
               <button @click="$emit('edit-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 <span class="font-medium">ویرایش</span>
               </button>
               <button @click="$emit('run-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span class="font-medium">اجرا</span>
               </button>
               <button @click="$emit('download-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 <span class="font-medium">دانلود</span>
               </button>
               <button @click="$emit('delete-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
                 <span class="font-medium">حذف</span>
               </button>
             </div>
          </div>
        </div>
        <router-link :to="getScenarioTo('Operation_Mersad_1988_FA')" class="block h-full" draggable="false">
          <div class="relative h-40 overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="/scenarios/images/مرصاد.jpg"
              alt="عملیات مرصاد (۱۳۶۷) – مقابله با تهاجم منافقین/حمایت عراق"
              draggable="false"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div class="absolute top-2.5 left-2.5">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-slate-700 border border-white/20 shadow-sm">
                نمونه
              </span>
            </div>
            <div class="absolute bottom-2.5 left-2.5 right-2.5">
              <h4 class="text-white font-semibold text-sm leading-tight drop-shadow-md">
                عملیات مرصاد (۱۳۶۷)
              </h4>
              <p class="text-slate-200 text-xs mt-0.5 font-medium drop-shadow-sm">مقابله با تهاجم منافقین</p>
            </div>
          </div>
          <div class="p-4">
            <p class="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2 mb-3">
              این سناریو محور نفوذ نیروهای منافقین (با پشتیبانی عراق) از مرز قصرشیرین به‌سوی کرند غرب.
            </p>
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                آماده
              </span>
              <div class="flex items-center gap-1 text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-200">
                <span class="text-xs font-medium">مشاهده</span>
                <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M15.293 6.707a1 1 0 010 1.414L11.414 12l3.879 3.879a1 1 0 01-1.414 1.414l-4.586-4.586a1 1 0 010-1.414l4.586-4.586a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </router-link>
      </div>
      
      <!-- Create New Scenario Card -->
      <div class="group relative bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl border-2 border-dashed border-slate-300/60 dark:border-slate-600/40 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-400 hover:-translate-y-1 shadow-lg hover:shadow-xl backdrop-blur-sm">
        <button
          type="button"
          @click="$emit('new-scenario')"
          class="text-center p-6 w-full h-full flex flex-col items-center justify-center hover:bg-emerald-50/70 dark:hover:bg-emerald-900/20 rounded-2xl transition-all duration-400 min-h-[260px] relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-100/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-400 shadow-lg shadow-emerald-500/20">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              ایجاد سناریوی جدید
            </h4>
            <p class="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-xs">
              شروع پروژه جدید با قالب آزاد
            </p>
          </div>
        </button>
      </div>
      
      <!-- Load Scenario Card -->
      <div class="group relative bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl border border-slate-300/60 dark:border-slate-600/40 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-400 hover:-translate-y-1 shadow-lg hover:shadow-xl backdrop-blur-sm">
        <div class="p-6 h-full flex flex-col min-h-[260px] relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-green-100/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <div class="relative z-10 flex flex-col h-full">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-green-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              بارگذاری فایل
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              بارگذاری سناریو از فایل محلی
            </p>
            <div class="flex-1">
              <LoadScenarioPanel @loaded="loadScenario" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Load from URL Card -->
      <div class="group relative bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl border border-slate-300/60 dark:border-slate-600/40 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-400 hover:-translate-y-1 shadow-lg hover:shadow-xl backdrop-blur-sm">
        <div class="p-6 h-full flex flex-col min-h-[260px] relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-violet-100/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <div class="relative z-10 flex flex-col h-full">
            <div class="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              بارگذاری از لینک
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              اتصال به آدرس وب و بارگیری مستقیم
            </p>
            <div class="flex-1">
              <LoadScenarioFromUrlPanel @loaded="loadScenario" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
  
  <!-- Table View -->
  <div v-if="viewMode === 'table'" class="bg-white/60 dark:bg-slate-700/60 rounded-2xl border border-slate-200/50 dark:border-slate-600/30 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th class="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">نام سناریو</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">وضعیت</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">آخرین تغییر</th>
            <th class="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">عملیات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-600">
          <template v-if="activeTab === 'all' || activeTab === 'recent'">
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center ml-3">
                    <div class="h-5 w-5 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">عملیات بیت المقدس</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">شبیه‌سازی یکی از مهم‌ترین عملیات تاریخی</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">در حال اجرا</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">اخیر</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">۲ روز پیش</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">ادامه کار</button>
                  <div class="relative">
                    <button @click="$emit('toggle-dropdown', 5)" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <svg class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                     <div v-if="dropdownOpen === 5" class="absolute top-full right-0 mt-1 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
                       <button @click="$emit('edit-scenario', 5)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         <span class="font-medium">ویرایش</span>
                       </button>
                       <button @click="$emit('run-scenario', 5)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <span class="font-medium">اجرا</span>
                       </button>
                       <button @click="$emit('download-scenario', 5)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span class="font-medium">دانلود</span>
                       </button>
                       <button @click="$emit('delete-scenario', 5)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                         <span class="font-medium">حذف</span>
                       </button>
                     </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center ml-3">
                    <div class="h-5 w-5 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">عملیات مرصاد</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">تحلیل و بررسی عملیات مرصاد ۱۳۶۷</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">تکمیل شده</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">اخیر</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">۱ هفته پیش</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <button class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">مشاهده</button>
                  <div class="relative">
                    <button @click="$emit('toggle-dropdown', 6)" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <svg class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                     <div v-if="dropdownOpen === 6" class="absolute top-full right-0 mt-1 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
                       <button @click="$emit('edit-scenario', 6)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         <span class="font-medium">ویرایش</span>
                       </button>
                       <button @click="$emit('run-scenario', 6)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <span class="font-medium">اجرا</span>
                       </button>
                       <button @click="$emit('download-scenario', 6)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span class="font-medium">دانلود</span>
                       </button>
                       <button @click="$emit('delete-scenario', 6)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                         <span class="font-medium">حذف</span>
                       </button>
                     </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          
          <template v-if="activeTab === 'all' || activeTab === 'samples'">
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center ml-3">
                    <div class="h-5 w-5 rounded-full bg-teal-500"></div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">آزادسازی خرمشهر – عملیات بیت‌المقدس (۱۳۶۱)</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">این سناریو پیشروی مشترک ارتش جمهوری اسلامی ایران و سپاه</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">آماده</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">نمونه</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                <router-link :to="getScenarioTo('Operation_Beit_ol_Moqaddas_1982_FA')" class="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300">مشاهده</router-link>
                  <div class="relative">
                    <button @click="$emit('toggle-dropdown', 7)" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <svg class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                     <div v-if="dropdownOpen === 7" class="absolute top-full right-0 mt-1 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
                       <button @click="$emit('edit-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         <span class="font-medium">ویرایش</span>
                       </button>
                       <button @click="$emit('run-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <span class="font-medium">اجرا</span>
                       </button>
                       <button @click="$emit('download-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span class="font-medium">دانلود</span>
                       </button>
                       <button @click="$emit('delete-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                         <span class="font-medium">حذف</span>
                       </button>
                     </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center ml-3">
                    <div class="h-5 w-5 rounded-full bg-teal-500"></div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">عملیات مرصاد (۱۳۶۷) – مقابله با تهاجم منافقین</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">این سناریو محور نفوذ نیروهای منافقین</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">آماده</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">نمونه</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                <router-link :to="getScenarioTo('Operation_Mersad_1988_FA')" class="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300">مشاهده</router-link>
                  <div class="relative">
                    <button @click="$emit('toggle-dropdown', 8)" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <svg class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                     <div v-if="dropdownOpen === 8" class="absolute top-full right-0 mt-1 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 py-1.5 z-[99999] animate-in fade-in duration-200">
                       <button @click="$emit('edit-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors duration-200 text-blue-600 dark:text-blue-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         <span class="font-medium">ویرایش</span>
                       </button>
                       <button @click="$emit('run-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors duration-200 text-purple-600 dark:text-purple-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <span class="font-medium">اجرا</span>
                       </button>
                       <button @click="$emit('download-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2.5 transition-colors duration-200 text-green-600 dark:text-green-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span class="font-medium">دانلود</span>
                       </button>
                       <button @click="$emit('delete-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors duration-200 text-red-600 dark:text-red-400">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                         <span class="font-medium">حذف</span>
                       </button>
                     </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { MAP_EDIT_MODE_ROUTE } from "@/router/names";
import LoadScenarioPanel from "@/modules/scenarioeditor/LoadScenarioPanel.vue";
import LoadScenarioFromUrlPanel from "@/modules/scenarioeditor/LoadScenarioFromUrlPanel.vue";
import { useBrowserScenarios } from "@/composables/browserScenarios";

defineProps<{
  activeTab: string
  viewMode: string
  dropdownOpen: number | null
}>()

defineEmits<{
  'toggle-dropdown': [id: number]
  'new-scenario': []
  'load-scenario': [scenario: any]
  'delete-scenario': [id: number]
  'edit-scenario': [id: number]
  'run-scenario': [id: number]
  'download-scenario': [id: number]
}>()

const router = useRouter();
const { loadScenario } = useBrowserScenarios();

const getScenarioTo = (scenarioId: string) => {
  return {
    name: MAP_EDIT_MODE_ROUTE,
    params: { scenarioId: `demo-${scenarioId}` },
  };
};
</script>