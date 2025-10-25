<template>
  <!-- Cards View -->
  <div v-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
    <!-- Recent Scenario Cards -->
    <template v-if="activeTab === 'all' || activeTab === 'recent'">
           
      
    </template>
    
    <!-- Sample Scenario Cards -->
    <template v-if="activeTab === 'all' || activeTab === 'samples'">
      <!-- Show all scenarios if showAllScenarios is true, otherwise show only first 2 -->
      <template v-for="(scenario, index) in getVisibleScenarios()" :key="scenario.id">
        <!-- آزادسازی خرمشهر – عملیات بیت‌المقدس -->
        <div v-if="scenario.id === 1" class="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-400/70 dark:hover:border-teal-500/70 shadow-lg hover:shadow-xl transition-all duration-400 hover:-translate-y-1 backdrop-blur-xl">
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', 3)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
             <div v-if="dropdownOpen === 3" class="absolute top-full left-0 mt-1.5 w-40 bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10 backdrop-blur-xl rounded-xl shadow-xl border border-blue-200/30 dark:border-blue-700/30 py-1.5 z-[99999] animate-in fade-in duration-200">
               <button @click="$emit('edit-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 <span class="font-medium">ویرایش</span>
               </button>
               <button @click="$emit('run-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                 </svg>
                 <span class="font-medium">اجرا</span>
               </button>
               <button @click="$emit('download-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 <span class="font-medium">ذخیره سناریو</span>
               </button>
               <button @click="$emit('delete-scenario', 3)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
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
            <div class="absolute inset-0 bg-black/30" />
            <div class="absolute top-2.5 left-2.5">
              
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
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
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
        <div v-else-if="scenario.id === 2" class="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-400/70 dark:hover:border-teal-500/70 shadow-lg hover:shadow-xl transition-all duration-400 hover:-translate-y-1 backdrop-blur-xl">
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', 4)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
             <div v-if="dropdownOpen === 4" class="absolute top-full left-0 mt-1.5 w-40 bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10 backdrop-blur-xl rounded-xl shadow-xl border border-blue-200/30 dark:border-blue-700/30 py-1.5 z-[99999] animate-in fade-in duration-200">
               <button @click="$emit('edit-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
                 <span class="font-medium">ویرایش</span>
               </button>
               <button @click="$emit('run-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                 </svg>
                 <span class="font-medium">اجرا</span>
               </button>
               <button @click="$emit('download-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                 <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 <span class="font-medium">ذخیره سناریو</span>
               </button>
               <button @click="$emit('delete-scenario', 4)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
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
            <div class="absolute inset-0 bg-black/30" />
            <div class="absolute top-2.5 left-2.5">
             
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
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
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
      </template>
      
      <!-- Load from URL Card -->
      
    </template>

    <!-- Server Scenarios (from API) -->
    <template v-if="(activeTab === 'all' || activeTab === 'recent') && serverScenarios && serverScenarios.length">
      <div 
        v-for="srv in serverScenarios" 
        :key="srv.id" 
        class="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-400/70 dark:hover:border-teal-500/70 shadow-lg hover:shadow-xl transition-all duration-400 hover:-translate-y-1 backdrop-blur-xl"
      >
        <!-- Action Menu Button -->
        <div class="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div class="relative">
            <button @click="$emit('toggle-dropdown', `server-${srv.id}`)" class="p-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 shadow-md">
              <svg class="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            <div v-if="dropdownOpen === `server-${srv.id}`" class="absolute top-full left-0 mt-1.5 w-40 bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10 backdrop-blur-xl rounded-xl shadow-xl border border-blue-200/30 dark:border-blue-700/30 py-1.5 z-[99999] animate-in fade-in duration-200">
              <button @click="$emit('edit-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span class="font-medium">ویرایش</span>
              </button>
              <button @click="$emit('run-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="font-medium">اجرا</span>
              </button>
              <button @click="$emit('download-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span class="font-medium">ذخیره سناریو</span>
              </button>
              <button @click="$emit('delete-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span class="font-medium">حذف</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- قسمت تصویر -->
        <router-link :to="getServerScenarioTo(srv.id)" class="block" draggable="false">
          <div class="relative h-40 overflow-hidden">
            <img 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              :src="resolveScenarioImage(srv.image)" 
              :alt="srv.name || 'سناریو'"
              @error="handleImageError"
            />
            <div class="absolute inset-0 bg-black/20"/>
            
            <!-- نمایش تصویر پیش‌فرض اگر تصویر اصلی وجود نداشته باشد -->
            <div v-if="!srv.image || srv.image.trim() === ''" class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
              <div class="text-center text-white">
                <svg class="w-16 h-16 mx-auto mb-2 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium">سناریو</p>
              </div>
            </div>
            
            <!-- عنوان سناریو - همیشه نمایش داده شود -->
            <div class="absolute bottom-2.5 left-2.5 right-2.5 z-10">
              <h4 class="text-white font-semibold text-sm leading-tight drop-shadow-md truncate">{{ srv.name || 'سناریو' }}</h4>
            </div>
          </div>
        </router-link>
        
        <!-- قسمت توضیحات و دکمه‌ها -->
        <div class="p-4">
          <p class="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2 mb-3">
            {{ srv.description && srv.description.trim() ? srv.description : 'این سناریو جدید است و هنوز توضیحات اضافه نشده است. برای ویرایش روی دکمه مشاهده کلیک کنید.' }}
          </p>
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
              ثبت شده
            </span>
            <router-link :to="getServerScenarioTo(srv.id)" class="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700">
              <span class="text-xs font-medium">مشاهده</span>
              <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M15.293 6.707a1 1 0 010 1.414L11.414 12l3.879 3.879a1 1 0 01-1.414 1.414l-4.586-4.586a1 1 0 010-1.414l4.586-4.586a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </router-link>
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
            <tr v-for="srv in serverScenarios" :key="srv.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center ml-3">
                    <div class="h-5 w-5 rounded-full bg-teal-500"></div>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ srv.name || 'سناریو' }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {{ srv.description && srv.description.trim() ? srv.description : 'این سناریو جدید است و هنوز توضیحات اضافه نشده است.' }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">ثبت شده</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">سرور</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                  <router-link :to="getServerScenarioTo(srv.id)" class="text-teal-600 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300">مشاهده</router-link>
                  <div class="relative">
                    <button @click="$emit('toggle-dropdown', `server-table-${srv.id}`)" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <svg class="h-4 w-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div v-if="dropdownOpen === `server-table-${srv.id}`" class="absolute top-full right-0 mt-1 w-40 bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10 backdrop-blur-xl rounded-xl shadow-xl border border-blue-200/30 dark:border-blue-700/30 py-1.5 z-[99999] animate-in fade-in duration-200">
                      <button @click="$emit('edit-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="font-medium">ویرایش</span>
                      </button>
                      <button @click="$emit('run-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="font-medium">اجرا</span>
                      </button>
                      <button @click="$emit('download-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="font-medium">ذخیره سناریو</span>
                      </button>
                      <button @click="$emit('delete-scenario', srv.id)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
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
            <template v-for="(scenario, index) in getPaginatedScenarios()" :key="scenario.id">
            <tr v-if="scenario.id === 1" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
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
                     <div v-if="dropdownOpen === 7" class="absolute top-full right-0 mt-1 w-40 bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10 backdrop-blur-xl rounded-xl shadow-xl border border-blue-200/30 dark:border-blue-700/30 py-1.5 z-[99999] animate-in fade-in duration-200">
                       <button @click="$emit('edit-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         <span class="font-medium">ویرایش</span>
                       </button>
                       <button @click="$emit('run-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span class="font-medium">اجرا</span>
                       </button>
                       <button @click="$emit('download-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span class="font-medium">ذخیره سناریو</span>
                       </button>
                       <button @click="$emit('delete-scenario', 7)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
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
            <tr v-else-if="scenario.id === 2" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
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
                     <div v-if="dropdownOpen === 8" class="absolute top-full right-0 mt-1 w-40 bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10 backdrop-blur-xl rounded-xl shadow-xl border border-blue-200/30 dark:border-blue-700/30 py-1.5 z-[99999] animate-in fade-in duration-200">
                       <button @click="$emit('edit-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                         <span class="font-medium">ویرایش</span>
                       </button>
                       <button @click="$emit('run-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                         </svg>
                         <span class="font-medium">اجرا</span>
                       </button>
                       <button @click="$emit('download-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
                         <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span class="font-medium">ذخیره سناریو</span>
                       </button>
                       <button @click="$emit('delete-scenario', 8)" class="w-full text-right px-3 py-2 text-xs hover:bg-blue-100/60 dark:hover:bg-blue-800/30 flex items-center gap-2.5 transition-colors duration-200 text-foreground">
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

defineEmits<{
  'toggle-dropdown': [id: number | string]
  'new-scenario': []
  'load-scenario': [scenario: any]
  'delete-scenario': [id: number | string]
  'edit-scenario': [id: number | string]
  'run-scenario': [id: number | string]
  'download-scenario': [id: number | string]
}>()

const props = defineProps<{
  activeTab: string
  viewMode: string
  dropdownOpen: number | string | null
  showAllScenarios?: boolean
  currentPage?: number
  totalScenarios?: number
  serverScenarios?: Array<{ id: string; name: string; description?: string; image?: string }>
}>()

const router = useRouter();
const { loadScenario } = useBrowserScenarios();

const envApiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
const envApiDevHost = (import.meta as any).env?.VITE_API_DEV_HOST as string | undefined;
const apiBaseUrl =
  (envApiUrl && envApiUrl.trim().length > 0
    ? envApiUrl.trim().replace(/\/+$/, "")
    : import.meta.env.DEV
      ? (envApiDevHost && envApiDevHost.trim().length > 0
          ? envApiDevHost.trim().replace(/\/+$/, "")
          : "http://127.0.0.1:8000")
      : typeof window !== "undefined" ? window.location.origin.replace(/\/+$/, "") : "");

function resolveBackendUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalized}`;
}

const getScenarioTo = (scenarioId: string) => {
  return {
    name: MAP_EDIT_MODE_ROUTE,
    params: { scenarioId: `demo-${scenarioId}` },
  };
};

const getServerScenarioTo = (scenarioId: string) => {
  return {
    name: MAP_EDIT_MODE_ROUTE,
    params: { scenarioId: scenarioId },
  };
};

function resolveScenarioImage(src?: string) {
  // استفاده از تصویر پیش‌فرض SVG به جای JPG
  const fallback = "/scenarios/images/default-scenario.svg";
  
  if (!src || typeof src !== "string" || src.trim() === "") {
    return fallback;
  }
  
  const trimmed = src.trim();
  
  // Handle base64 data URLs (for preview)
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }
  
  // Handle full URLs (including API URLs) - use them directly
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  
  // Handle API paths - use them directly as they are valid URLs
  if (
    trimmed.startsWith("/api/scenarios/images/") ||
    trimmed.startsWith("/scenarios/images/")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  
  // Handle filename - check if it has extension, if not add .jpg
  let filename = trimmed;
  if (!filename.includes('.')) {
    filename = filename + '.jpg';
  }
  
  // Treat as file name under public/scenarios/images
  return `/scenarios/images/${filename}`;
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  const fallback = "/scenarios/images/default-scenario.svg";
  if (img.src !== fallback) {
    img.src = fallback;
  }
}

// Sample scenarios data
const scenarios = [
  { id: 1, name: 'آزادسازی خرمشهر – عملیات بیت‌المقدس', year: '۱۳۶۱' },
  { id: 2, name: 'عملیات مرصاد', year: '۱۳۶۷' }
];

// Get visible scenarios for cards view
const getVisibleScenarios = () => {
  if (props.showAllScenarios) {
    return scenarios;
  }
  return scenarios.slice(0, 2);
};

// Get paginated scenarios for table view
const getPaginatedScenarios = () => {
  const page = props.currentPage || 1;
  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  return scenarios.slice(startIndex, endIndex);
};
</script>
