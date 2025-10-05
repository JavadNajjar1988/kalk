<template>
  <div class="min-h-screen flex flex-col bg-teal-50/80 dark:bg-teal-950/50 text-foreground">
    <!-- Simple Modern Header with Blue-Green Icy Theme -->
    <header class="relative z-50 bg-blue-100/40 dark:bg-blue-400/15 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/30 dark:supports-[backdrop-filter]:bg-blue-400/20 border-b border-blue-300/40 dark:border-blue-400/20 shadow-lg shadow-blue-500/3 py-4">
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Logo/Icon -->
            <div class="w-10 h-10 bg-blue-200/60 dark:bg-blue-800/60 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/5 border border-blue-300/20 dark:border-blue-600/20">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            
            <!-- Title -->
            <h1 class="text-lg font-bold text-blue-700 dark:text-blue-300">
              ایجاد سناریوی جدید
            </h1>
          </div>

          <!-- Profile Section -->
          <div class="flex items-center gap-3">
            <!-- User Info -->
            <div class="hidden sm:flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300">
              <span>{{ userInfo.name }}</span>
              <span class="text-blue-400 dark:text-blue-400">•</span>
              <span class="text-xs bg-blue-200/40 dark:bg-blue-800/40 px-2 py-1 rounded-full">
                {{ userInfo.role === 'admin' ? 'مدیر' : 'اپراتور' }}
              </span>
            </div>

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
                class="absolute right-0 top-full translate-y-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-blue-200/40 dark:border-blue-700/40 z-50"
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
      </div>
    </header>
    
    <!-- Main Content with Step-based Layout -->
    <main class="flex-1 bg-blue-50/20 dark:bg-blue-400/10 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/20 dark:supports-[backdrop-filter]:bg-blue-400/15 border border-blue-300/60 dark:border-blue-400/30 shadow-lg shadow-blue-500/5 min-h-screen transition-all duration-300">
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        
        <form class="space-y-8" @submit.prevent="create()">
          <!-- Single Box Container for Step Content -->
          <div class="bg-blue-100/60 dark:bg-blue-400/2 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-blue-500/5 border border-blue-200/30 dark:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
            <!-- Progress Steps -->
            <div class="mb-8">
              <div class="p-6">
                <div class="relative">
                  <!-- Background progress line aligned to centers -->
                  <div class="absolute h-1 bg-blue-500  rounded-full -z-10" :style="{ top: stepBarTop, left: stepBarLeft, right: stepBarRight }"></div>
                  <!-- Foreground progress line aligned to centers -->
                  <div class="absolute h-1 bg-white rounded-full -z-10 transition-all duration-500 ease-out" :style="{ top: stepBarTop, left: stepBarLeft, width: stepBarWidth }"></div>

                  <ul ref="stepsRef" class="flex items-center justify-between">
                    <li v-for="(label, idx) in stepLabels" :key="idx" class="flex flex-col items-center">
                      <div
                        :aria-current="currentStep === idx + 1 ? 'step' : undefined"
                        :class="[
                          currentStep >= idx + 1
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-200',
                          'w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 border-white/70 dark:border-blue-800/50 transition-all duration-300',
                        ]"
                      >
                        {{ toFaDigits(idx + 1) }}
                      </div>
                      <span
                        :class="[
                          currentStep >= idx + 1 ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400',
                          'mt-2 text-sm font-medium text-center'
                        ]"
                      >
                        {{ label }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <!-- Step 1: Basic Info -->
            <div v-show="currentStep === 1">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                     {{ toFaDigits(1) }}
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">اطلاعات پایه سناریو</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">لطفا اطلاعات سناریو را کامل وارد نمایید.</p>
              </div>
              <div class="space-y-6">
                <div class="grid gap-6 md:grid-cols-2">
                  <InputGroup label="نام" v-model="form.name" id="name-input" autofocus />
                  <div class="grid grid-cols-[1fr_auto] items-end gap-3">
                    <InputGroup label="شناسه سناریو" :disabled="true" :model-value="form.scenarioCode" />
                    <Button type="button" size="sm" class="bg-blue-400 hover:bg-blue-500 text-white" @click="regenerateScenarioCode()">تولید مجدد</Button>
                  </div>
                </div>

                <div class="grid gap-6 md:grid-cols-3">
                  <InputGroup label="نام نویسنده" v-model="form.authorName" />
                  <InputGroup label="تاریخ ایجاد (شمسی)" :model-value="form.createdDate" @update:model-value="onCreatedDateChange" placeholder="مثلاً 1403/07/10" />
                  <SimpleSelect v-model="form.purpose" :items="purposeItems" label="هدف سناریو" class="mt-1.5" />
                </div>

                <SimpleDivider class="mt-2 mb-2">نمادشناسی</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-2 items-end">
                  <RadioGroupList :items="standardSettings" v-model="newScenario.symbologyStandard" />
                </div>

                <SimpleMarkdownInput
                  label="توضیحات"
                  v-model="form.description"
                  description="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
                />

                <SimpleDivider class="mt-2 mb-2">تصویر پیش‌نمایش</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-3 items-start">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-heading mb-1">انتخاب تصویر</label>
                    <input
                      type="file"
                      accept="image/*"
                      @change="onPreviewImageChange"
                      class="block w-full text-sm file:mr-4 file:rounded-lg file:border file:border-blue-200/40 dark:file:border-blue-700/40 file:bg-white/70 dark:file:bg-blue-900/30 file:px-3 file:py-2 file:text-blue-700 dark:file:text-blue-200 file:hover:bg-white/90 dark:file:hover:bg-blue-900/50 rounded-lg border border-blue-200/40 dark:border-blue-700/40 bg-white/60 dark:bg-blue-900/20 backdrop-blur-sm"
                    />
                    <p class="mt-2 text-xs text-muted-foreground">فرمت‌های رایج تصویری پشتیبانی می‌شوند. اندازه مناسب: ۱۶:۹</p>
                  </div>
                  <div class="md:col-span-1">
                    <div
                      class="relative aspect-video w-full overflow-hidden rounded-xl border border-blue-200/40 dark:border-blue-700/40 bg-gradient-to-b from-blue-50/60 to-blue-100/40 dark:from-blue-900/30 dark:to-blue-900/10 shadow-sm"
                    >
                      <img v-if="previewImageUrl" :src="previewImageUrl" alt="Preview" class="h-full w-full object-cover" />
                      <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                        هنوز تصویری انتخاب نشده است
                      </div>
                    </div>
                  </div>
                </div>

                <SimpleDivider class="mt-2 mb-2">محدوده جغرافیایی</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-3 items-end">
                  <InputGroup label="کران جغرافیایی (BBox) — ترتیب: minX,minY,maxX,maxY" placeholder="مثلاً 44.5,25.1,63.3,39.8" v-model="form.bboxText" />
                  <div class="hidden md:block"></div>
                  <div class="hidden md:block"></div>
                </div>
              </div>
            </div>
            
            <!-- Step 2: ORBAT Configuration -->
            <div v-show="currentStep === 2">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    {{ toFaDigits(2) }}
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">آرایش نبرد اولیه</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">طرف‌ها و واحدهای ریشه.</p>
              </div>
              <div class="space-y-4">
                <ToggleField v-model="noInitialOrbat">
                  طرف‌ها و واحدهای ریشه را بعداً اضافه کن
                </ToggleField>
                <div v-if="!noInitialOrbat" class="grid gap-4 md:grid-cols-1 items-end">
                  <div class="md:col-span-2">
                    <StandardIdentitySelect v-model="selectedStandardIdentity" />
                  </div>
                 
                </div>
              </div>
              <div v-if="!noInitialOrbat" class="mt-3">
                <NewAccordionPanel
                  v-for="(sideData, idx) in form.sides"
                  :key="idx"
                  :label="`طرف ${idx + 1}: ${sideData.name || ''}`"
                >
                  <div class="grid gap-4 md:grid-cols-2">
                    <InputGroup v-model="sideData.name" label="نام طرف" />
                     <SymbolFillColorSelect
                        v-model="sideData.symbolOptions.fillColor"
                        :sid="String(sideData.standardIdentity)"
                      />
                  </div>
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                     
                    </div>
                    <div>
                     
                    </div>
                  </div>
                  <SimpleDivider class="mt-4 mb-4">واحدهای ریشه</SimpleDivider>
                  <div class="space-y-6">
                    <template v-for="(unit, i) in sideData.units">
                      <div class="flex items-end gap-4 md:grid md:grid-cols-2">
                        <InputGroup label="نام واحد ریشه" v-model="unit.rootUnitName" />
                        <NewMilitarySymbol
                          :size="32"
                          :sidc="unitSidc(unit, sideData)"
                          :options="{ ...sideData.symbolOptions, outlineWidth: 8 }"
                        />
                      </div>
                      <div class="mt-4 grid gap-4 md:grid-cols-2">
                        <SymbolCodeSelect
                          class=""
                          label="آیکون اصلی"
                          v-model="unit.rootUnitIcon"
                          :items="iconItems(sideData.standardIdentity)"
                          :symbol-options="sideData.symbolOptions"
                        />
                        <SymbolCodeSelect
                          class="w-full"
                          label="رده"
                          v-model="unit.rootUnitEchelon"
                          :items="echelonItems(sideData.standardIdentity)"
                          :symbol-options="sideData.symbolOptions"
                        />
                      </div>
                      <p class="text-muted-foreground text-sm">
                        نگران نباشید اگر نمی‌توانید آیکون مناسب را پیدا کنید. می‌توانید بعداً آن را تغییر دهید.
                      </p>
                      <SimpleDivider v-if="i < sideData.units.length - 1" />
                    </template>
                  </div>
                  <footer class="mt-6 flex justify-end gap-x-3">
                    <Button
                      variant="link"
                      type="button"
                      size="sm"
                      :disabled="!sideData.units.length"
                      @click="removeUnit(sideData, sideData.units[sideData.units.length - 1])"
                      class="text-red-500 hover:text-red-600 hover:bg-red-50/70 dark:hover:bg-red-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all duration-200 border border-red-200/50 dark:border-red-700/50"
                    >
                      حذف واحد
                    </Button>
                    <span class="text-gray-300">|</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      @click="addRootUnit(sideData)"
                      class="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all duration-200 border border-emerald-200/50 dark:border-emerald-700/50"
                    >
                      + افزودن واحد ریشه
                    </Button>
                  </footer>
                  <Button
                    variant="link"
                    size="sm"
                    v-if="idx === form.sides.length - 1"
                    @click="form.sides.pop()"
                    class="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50/70 dark:hover:bg-red-900/30 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all duration-200 border border-red-200/50 dark:border-red-700/50"
                  >
                    حذف طرف
                  </Button>
                </NewAccordionPanel>
                <footer class="mt-6 flex justify-center">
                  <Button type="button" variant="link" size="sm" @click="addSide()" class="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-200 border border-emerald-200/50 dark:border-emerald-700/50">
                    + افزودن طرف
                  </Button>
                </footer>
              </div>
            </div>
            
            <!-- Step 3: Time Settings -->
            <div v-show="currentStep === 3">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">زمان شروع سناریو</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">زمان شروع و منطقه زمانی را انتخاب کنید.</p>
              </div>
              <div class="space-y-6">
                <TimezoneSelect label="منطقه زمانی" v-model="timeZone" />
                <div class="grid grid-cols-3 gap-6">
                  <InputGroup label="سال" type="number" v-model="year" />
                  <InputGroup label="ماه" type="number" v-model="month" />
                  <InputGroup label="روز" type="number" v-model="day" />
                </div>
                <div class="grid grid-cols-2 gap-6">
                  <InputGroup label="ساعت" v-model="hour" type="number" min="0" max="23" />
                  <InputGroup label="دقیقه" v-model="minute" type="number" min="0" max="59" />
                </div>
                <div class="bg-blue-100/60 dark:bg-blue-900/60 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/20 dark:border-blue-700/20 shadow-xl shadow-blue-500/3">
                  <p class="text-blue-700 dark:text-blue-300 font-mono text-center text-lg font-semibold">{{ jalaliDateTimeFormatter(new Date(resDateTime.toISOString()).getTime()) }}</p>
                </div>
              </div>
            </div>
            
            <!-- Step 4: Weather Conditions -->
            <div v-show="currentStep === 4">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    {{ toFaDigits(4) }}
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">جو و وضعیت جوی</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">پارامترهای جوی را برای زمان شروع سناریو مشخص کنید. (زمان و منطقه زمانی از مرحله ۳ استفاده می‌شود)</p>
              </div>
              <div class="space-y-6">
                <!-- Sun / Brightness -->
                <div class="grid gap-6 md:grid-cols-3">
                  <SimpleSelect label="روشنایی" :items="sunPhaseItems" v-model="weather.sunPhase" />
                  <InputGroup label="زاویه خورشید (°)" type="number" v-model="weather.sunElevationDeg" />
                  <InputGroup label="وضعیت آسمان" placeholder="صاف / نیمه‌ابری / ابری" v-model="weather.sky" />
                </div>

                <!-- Temperature / Humidity / Pressure -->
                <div class="grid gap-6 md:grid-cols-3">
                  <InputGroup label="دما (°C)" type="number" v-model="weather.temperatureC" />
                  <InputGroup label="رطوبت نسبی (%)" type="number" v-model="weather.humidityPct" />
                  <InputGroup label="فشار (hPa)" type="number" v-model="weather.pressureHpa" />
                </div>

                <!-- Wind Surface and Upper -->
                <SimpleDivider>باد</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-4">
                  <InputGroup label="باد سطحی - سرعت (گره)" type="number" v-model="weather.windSurfaceSpeedKt" />
                  <InputGroup label="باد سطحی - سمت (°)" type="number" v-model="weather.windSurfaceDirDeg" />
                  <InputGroup label="باد لایه بالاتر - سرعت (گره)" type="number" v-model="weather.windUpperSpeedKt" />
                  <InputGroup label="باد لایه بالاتر - سمت (°)" type="number" v-model="weather.windUpperDirDeg" />
                </div>

                <!-- Precipitation -->
                <SimpleDivider>بارش</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-3">
                  <SimpleSelect label="نوع بارش" :items="precipitationTypeItems" v-model="weather.precipitationType" />
                  <InputGroup label="شدت (mm/h)" type="number" v-model="weather.precipitationIntensity" />
                  <InputGroup label="مدت (دقیقه)" type="number" v-model="weather.precipitationDurationMin" />
                </div>

                <!-- Clouds / Visibility -->
                <SimpleDivider>ابر و دید</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-3">
                  <InputGroup label="سقف ابر (ft)" type="number" v-model="weather.cloudCeilingFt" />
                  <InputGroup label="پوشش ابر (%)" type="number" v-model="weather.cloudCoveragePct" />
                  <InputGroup label="برد دید افقی (km)" type="number" v-model="weather.visibilityKm" />
                </div>

                <!-- Ground conditions -->
                <SimpleDivider>وضعیت زمین</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-3 items-end">
                  <SimpleSelect label="وضعیت زمین" :items="groundConditionItems" v-model="weather.groundCondition" />
                  <ToggleField v-model="weather.groundIcing">یخ‌زدگی سطح</ToggleField>
                  <InputGroup label="تلفات انرژی حرکت (%)" type="number" v-model="weather.movementEnergyLossPct" />
                </div>

                <!-- Air quality / Dust -->
                <SimpleDivider>کیفیت هوا / گردوغبار</SimpleDivider>
                <div class="grid gap-6 md:grid-cols-3">
                  <InputGroup label="شاخص کیفیت هوا (AQI)" type="number" v-model="weather.airQualityIndex" />
                  <SimpleSelect label="گردوغبار" :items="dustLevelItems" v-model="weather.dustLevel" />
                  <InputGroup label="کاهش دید به‌علت گردوغبار (%)" type="number" v-model="weather.visibilityReductionPct" />
                </div>
              </div>
            </div>

            

            <!-- Step 5: Final Review -->
            <div v-show="currentStep === 5">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    {{ toFaDigits(5) }}
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">مرور نهایی</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">خلاصه‌ای از تنظیمات سناریو را بررسی کنید و در صورت نیاز بازگردید و اصلاح کنید.</p>
              </div>
              <div class="space-y-4">
                <div class="rounded-xl border border-blue-200/40 dark:border-blue-700/40 p-4 bg-white/50 dark:bg-blue-900/20">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <div class="text-sm text-muted-foreground">نام سناریو</div>
                      <div class="font-semibold">{{ form.name }}</div>
                    </div>
                    <div>
                      <div class="text-sm text-muted-foreground">کد سناریو</div>
                      <div class="font-mono">{{ form.scenarioCode }}</div>
                    </div>
                    <div>
                      <div class="text-sm text-muted-foreground">زمان شروع</div>
                      <div>{{ toFaDigits(resDateTime.format()) }}</div>
                    </div>
                    <div>
                      <div class="text-sm text-muted-foreground">وضعیت جوی</div>
                      <div>{{ weather.sky || '-' }} | دید {{ toFaDigits(weather.visibilityKm || 0) }} km | دما {{ toFaDigits(weather.temperatureC || 0) }}°C</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
             <!-- Navigation Buttons -->
             <div class="flex justify-between mt-8 pt-6 border-t border-blue-200/20 dark:border-blue-700/20">
               <BaseButton 
                 v-if="currentStep > 1" 
                 @click="prevStep()" 
                 type="button"
                 class="bg-white/70 hover:bg-white/90 dark:bg-blue-800/60 dark:hover:bg-blue-800/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/3 hover:shadow-xl border border-blue-200/20 dark:border-blue-600/20 transition-all duration-300"
               >
                 مرحله قبل
               </BaseButton>
               
               <div class="flex-grow"></div>
               
               <BaseButton 
                 v-if="currentStep < totalSteps" 
                 @click="nextStep()" 
                 type="button"
                 class="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-blue-300/30"
               >
                 مرحله بعد
               </BaseButton>
             </div>
             
             <!-- Final Action Card - Inside the main container -->
             <div class="mt-8 pt-6 border-t border-blue-200/20 dark:border-blue-700/20">
               <div class="flex items-center justify-between">
                 <div class="text-sm text-blue-600 dark:text-blue-400">
                   آماده برای ایجاد سناریوی جدید؟
                 </div>
                 <div class="flex items-center gap-4">
                   <BaseButton @click="cancel()" type="button" class="bg-white/70 hover:bg-white/90 dark:bg-blue-800/60 dark:hover:bg-blue-800/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/3 hover:shadow-xl border border-blue-200/20 dark:border-blue-600/20 transition-all duration-300">
                     لغو
                   </BaseButton>
                   <BaseButton 
                     primary 
                     type="submit" 
                     :disabled="false"
                     class="bg-blue-400 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-semibold shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-blue-300/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                   >
                     ایجاد سناریو
                   </BaseButton>
                 </div>
               </div>
             </div>
           </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import FormCard from "@/components/FormCard.vue";
import InputGroup from "@/components/InputGroup.vue";
import SimpleSelect from "@/components/SimpleSelect.vue";
import SimpleMarkdownInput from "@/components/SimpleMarkdownInput.vue";
import TimezoneSelect from "@/components/TimezoneSelect.vue";
import { useYMDElements } from "@/composables/scenarioTime";
import RadioGroupList from "@/components/RadioGroupList.vue";
import BaseButton from "@/components/BaseButton.vue";
import { useRouter } from "vue-router";
import { MAP_EDIT_MODE_ROUTE } from "@/router/names";
import { useScenario } from "@/scenariostore";
import { createEmptyScenario } from "@/scenariostore/io";
import ToggleField from "@/components/ToggleField.vue";
import type { ScenarioInfo, SideData, UnitSymbolOptions } from "@/types/scenarioModels";
import { SID, type SidValue } from "@/symbology/values";
import { nanoid } from "@/utils";
import { Sidc } from "@/symbology/sidc";
import StandardIdentitySelect from "@/components/StandardIdentitySelect.vue";
import SimpleDivider from "@/components/SimpleDivider.vue";
import type { SymbolItem, SymbolValue } from "@/types/constants";
import { echelonItems } from "@/symbology/helpers";
import { scenarioApiService } from "@/services/api/scenarioApiService";
import SymbolCodeSelect from "@/components/SymbolCodeSelect.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import NewMilitarySymbol from "@/components/NewMilitarySymbol.vue";
import NewAccordionPanel from "@/components/NewAccordionPanel.vue";
import SymbolFillColorSelect from "@/components/SymbolFillColorSelect.vue";
import { toPersianDigits as toFaDigits } from "@/utils/persianNumbers";
import { formatPersianDateShort, jalaliDateTimeFormatter } from "@/utils/jalaliFormatters";

const router = useRouter();
const { scenario } = useScenario();

// Step management
const currentStep = ref(1);
const totalSteps = 5;

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
  
  // Close profile menu
  showProfileMenu.value = false;
  
  // Send logout message to parent (React Dashboard)
  if (window.parent !== window) {
    try {
      window.parent.postMessage({
        type: 'LOGOUT_REQUEST',
        origin: 'vue',
        timestamp: Date.now()
      }, '*');
    } catch (error) {
      console.error('Error sending logout message:', error);
    }
  }
  
  // Redirect to login or show message
  console.log('User logged out');
};

// Initialize user info on mount
onMounted(() => {
  getUserInfoFromToken();
});

// Close profile menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showProfileMenu.value = false;
  }
};

onMounted(() => {
  getUserInfoFromToken();
  // React to auth updates from bridge
  const applied = () => getUserInfoFromToken();
  const cleared = () => getUserInfoFromToken();
  window.addEventListener('kalk-auth-applied', applied as any);
  window.addEventListener('kalk-auth-cleared', cleared as any);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('kalk-auth-applied', getUserInfoFromToken as any);
  window.removeEventListener('kalk-auth-cleared', getUserInfoFromToken as any);
});

const standardSettings = [
  {
    value: "app6",
    name: "APP-6",
    description: "نسخه ناتو",
  },
  {
    value: "2525",
    name: "MIL-STD-2525D",
    description: "نسخه آمریکایی",
  },
];

const stepLabels = [
  "اطلاعات پایه",
  "آرایش نبرد",
  "زمان شروع",
  "جو و وضعیت جوی",
  "مرور نهایی",
];

const stepsRef = ref<HTMLElement | null>(null);
const stepBarTop = ref<string>("24px");
const stepBarLeft = ref<string>("8px");
const stepBarRight = ref<string>("8px");
const stepBarWidth = ref<string>("0px");

function computeStepBar() {
  const ul = stepsRef.value;
  if (!ul) return;
  const items = Array.from(ul.children) as HTMLElement[];
  if (items.length === 0) return;
  // vertical center of first circle
  const first = items[0].querySelector("div");
  const last = items[items.length - 1].querySelector("div");
  if (!first || !last) return;
  const firstRect = first.getBoundingClientRect();
  const ulRect = ul.getBoundingClientRect();
  const centerY = firstRect.top - ulRect.top + firstRect.height / 2;
  stepBarTop.value = `${centerY - 0.5}px`; // align 1px line through center

  // step-wise progress: when on step N, fill up to center of that step
  const progressIndex = currentStep.value - 1; // 0..totalSteps-1
  const firstCenterX = firstRect.left - ulRect.left + firstRect.width / 2;
  const lastRect = last.getBoundingClientRect();
  const lastCenterX = lastRect.left - ulRect.left + lastRect.width / 2;
  const totalWidth = lastCenterX - firstCenterX;
  const perSegment = totalWidth / (totalSteps - 1);
  stepBarWidth.value = `${firstCenterX + perSegment * progressIndex}px`;
}

onMounted(() => {
  nextTick(computeStepBar);
  window.addEventListener("resize", computeStepBar);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", computeStepBar);
});

interface RootUnit {
  rootUnitName?: string;
  rootUnitSidc?: string;
  rootUnitEchelon?: string;
  rootUnitIcon?: string;
}

interface InitialSideData extends SideData {
  symbolOptions: UnitSymbolOptions;
  units: RootUnit[];
}

interface NewScenarioForm extends ScenarioInfo {
  sides: InitialSideData[];
  scenarioCode: string;
  authorName?: string;
  createdDate?: string; // formatted Jalali date string
  purpose?: "operational" | "educational" | "training" | "";
  bboxText?: string; // "minX,minY,maxX,maxY"
}

const noInitialOrbat = ref(false);
const selectedStandardIdentity = ref<SidValue>(SID.Friend);
const selectedFillColor = ref<string | null>(null);

const newScenario = ref(
  createEmptyScenario({ addGroups: true, symbologyStandard: "app6" }),
);
const timeZone = ref(newScenario.value.timeZone || "UTC");
const { year, month, day, hour, minute, resDateTime } = useYMDElements({
  timestamp: newScenario.value.startTime!,
  isLocal: true,
  timeZone,
});

// Weather state
const sunPhaseItems = [
  { label: "روز", value: "day" },
  { label: "شب", value: "night" },
  { label: "طلوع", value: "dawn" },
  { label: "غروب", value: "dusk" },
];
const precipitationTypeItems = [
  { label: "بدون بارش", value: "none" },
  { label: "باران", value: "rain" },
  { label: "برف", value: "snow" },
  { label: "تگرگ", value: "hail" },
];
const groundConditionItems = [
  { label: "خشک", value: "dry" },
  { label: "نیمه‌مرطوب", value: "semi-wet" },
  { label: "گل‌آلود", value: "muddy" },
];
const dustLevelItems = [
  { label: "کم", value: "low" },
  { label: "متوسط", value: "medium" },
  { label: "زیاد", value: "high" },
];

const weather = reactive({
  // sun/brightness
  sunPhase: "day" as "day" | "night" | "dawn" | "dusk",
  sunElevationDeg: 30,
  // sky/clouds/visibility
  sky: "",
  cloudCeilingFt: 0,
  cloudCoveragePct: 0,
  visibilityKm: 10,
  visibilityReductionPct: 0,
  // temperature/humidity/pressure
  temperatureC: 20,
  humidityPct: 40,
  pressureHpa: 1013,
  // wind
  windSurfaceSpeedKt: 0,
  windSurfaceDirDeg: 0,
  windUpperSpeedKt: 0,
  windUpperDirDeg: 0,
  // precipitation
  precipitationType: "none" as "none" | "rain" | "snow" | "hail",
  precipitationIntensity: 0,
  precipitationDurationMin: 0,
  // ground
  groundCondition: "dry" as "dry" | "semi-wet" | "muddy",
  groundIcing: false,
  movementEnergyLossPct: 0,
  // air quality / dust
  airQualityIndex: 50,
  dustLevel: "low" as "low" | "medium" | "high",
});

function generateScenarioCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = nanoid(6).toUpperCase();
  return `SCN-${y}${m}${d}-${rand}`;
}

const form = reactive<NewScenarioForm>({
  name: "سناریوی جدید",
  description: "",
  scenarioCode: generateScenarioCode(),
  authorName: "",
  createdDate: "",
  purpose: "",
  bboxText: "",
  sides: [],
});

const purposeItems = [
  { label: "- انتخاب کنید -", value: "" },
  { label: "عملیاتی", value: "operational" },
  { label: "آموزشی", value: "educational" },
  { label: "تمرینی", value: "training" },
];

// Step navigation functions
const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
    nextTick(computeStepBar);
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    nextTick(computeStepBar);
  }
};

async function create() {
  const startTime = resDateTime.value.valueOf();
  newScenario.value.startTime = startTime;
  newScenario.value.name = form.name;
  newScenario.value.description = form.description;
  newScenario.value.layers = [{ name: "Features", id: nanoid(), features: [] }];
  newScenario.value.timeZone = timeZone.value;

  // Meta and settings mapping
  newScenario.value.meta = {
    ...(newScenario.value.meta ?? {}),
    lastModifiedDate: new Date().toISOString(),
    scenarioCode: form.scenarioCode,
    authorName: form.authorName || undefined,
    purpose: (form.purpose as any) || undefined,
    createdDate: form.createdDate
      ? new Date(form.createdDate).toISOString()
      : newScenario.value.meta?.createdDate || new Date().toISOString(),
  } as any;

  newScenario.value.settings = {
    ...(newScenario.value.settings ?? {}),
  } as any;
  
  if (form.bboxText && form.bboxText.trim().length > 0) {
    const nums = form.bboxText.split(",").map((s) => Number(s.trim()));
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
      (newScenario.value.settings as any).boundingBox = [nums[0], nums[1], nums[2], nums[3]];
    }
  }

  scenario.value.io.loadFromObject(newScenario.value);
  scenario.value.time.setCurrentTime(startTime);
  const { state, clearUndoRedoStack } = scenario.value.store;
  const {
    unitActions,
    helpers: { getSideById },
  } = scenario.value;
  if (!noInitialOrbat.value) {
    form.sides.forEach((sideData) => {
      const sideId = unitActions.addSide(sideData, { markAsNew: false });
      const parentId = getSideById(sideId).groups[0];
      sideData.units.forEach((u) => {
        const sidc = new Sidc("10031000000000000000");
        sidc.standardIdentity = sideData.standardIdentity;
        sidc.emt = u.rootUnitEchelon || "00";
        sidc.mainIcon = u.rootUnitIcon || "000000";
        unitActions.addUnit(
          {
            id: nanoid(),
            name: u.rootUnitName ?? "test",
            sidc: sidc.toString(),
            subUnits: [],
            _pid: "nn",
            _sid: "nn",
            _gid: "nn",
            equipment: [],
            personnel: [],
          },
          parentId,
        );
      });
    });
  }
  clearUndoRedoStack();

  const created = await scenarioApiService.create(scenario.value.io.serializeToObject());
  const scenarioId = created.id;

  await router.push({ name: MAP_EDIT_MODE_ROUTE, params: { scenarioId } });
}

function cancel() {
  router.back();
}

// Image preview state and handler
const previewImageUrl = ref<string | null>(null);
function onPreviewImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) {
    previewImageUrl.value = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImageUrl.value = String(e.target?.result || "");
  };
  reader.readAsDataURL(file);
}

const icons: SymbolValue[] = [
  { code: "000000", text: "نامشخص" },
  { code: "110000", text: "فرماندهی و کنترل" },
  { code: "121100", text: "پیاده‌نظام" },
  { code: "121000", text: "ترکیبی" },
  { code: "121102", text: "مکانیزه" },
  { code: "130300", text: "توپخانه" },
  { code: "120500", text: "زرهی" },
  { code: "160600", text: "پشتیبانی رزمی" },
];

function iconItems(sid: SidValue) {
  return icons.map(({ code, text }): SymbolItem => {
    return {
      code,
      text,
      sidc: "100" + sid + "10" + "00" + "00" + code + "0000",
    };
  });
}

function unitSidc(
  { rootUnitEchelon, rootUnitIcon }: RootUnit,
  { standardIdentity }: SideData,
) {
  return "100" + standardIdentity + "10" + "00" + rootUnitEchelon + rootUnitIcon + "0000";
}

function addSide() {
  if (noInitialOrbat.value) return;
  const sid = selectedStandardIdentity.value ?? SID.Friend;
  form.sides.push({
    name: "طرف",
    standardIdentity: sid,
    symbolOptions: selectedFillColor.value ? { fillColor: selectedFillColor.value } : {},
    units: [{ rootUnitName: "ستاد", rootUnitEchelon: "18", rootUnitIcon: "121000" }],
  });
}

function addRootUnit(side: InitialSideData) {
  side.units.push({ rootUnitName: "ستاد", rootUnitEchelon: "18", rootUnitIcon: "121000" });
}

function removeUnit(side: InitialSideData, unit: RootUnit) {
  const idx = side.units.indexOf(unit);
  if (idx >= 0) side.units.splice(idx, 1);
}

function regenerateScenarioCode() {
  form.scenarioCode = generateScenarioCode();
}

// Created date (Jalali) input handler — store as-is (string)
function onCreatedDateChange(value: string | number | undefined) {
  form.createdDate = value ? String(value) : "";
}
</script>
