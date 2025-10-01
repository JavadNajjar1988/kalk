<template>
  <div class="min-h-screen flex flex-col bg-teal-50/80 dark:bg-teal-950/50 text-foreground">
    <!-- Simple Modern Header with Blue-Green Icy Theme -->
    <header class="relative bg-blue-100/40 dark:bg-blue-400/15 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/30 dark:supports-[backdrop-filter]:bg-blue-400/20 border-b border-blue-300/40 dark:border-blue-400/20 shadow-lg shadow-blue-500/3 py-4">
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <!-- Logo/Icon -->
          <div class="w-10 h-10 bg-blue-200/60 dark:bg-blue-800/60 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/5 border border-blue-300/20 dark:border-blue-600/20">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          
          <!-- Title -->
          <h1 class="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
            ایجاد سناریوی جدید
          </h1>
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
                <div class="flex items-center justify-between relative">
             <!-- Full Progress Line Background (Light) -->
             <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-200/70 dark:bg-blue-700/70 -z-10 transform -translate-y-1/2"></div>
                  <!-- Animated Progress Line (Fills from right to left) -->
                  <div class="absolute top-1/2 right-0 h-0.5 bg-gradient-to-l from-cyan-400 to-blue-400 -z-10 transform -translate-y-1/2 transition-all duration-1000 ease-out" 
                       :style="{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }"></div>
                  
                  <!-- Step 1 -->
                  <div class="flex flex-col items-center relative z-10">
                    <div :class="[currentStep >= 1 ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-black shadow-lg shadow-blue-400/30' : 'bg-blue-100/40 dark:bg-blue-700/20 text-blue-600 dark:text-blue-300 font-bold', 'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 border-2 border-white dark:border-blue-800 hover:scale-110']">
                      1
                    </div>
                    <span :class="[currentStep >= 1 ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-blue-600 dark:text-blue-400', 'text-sm']">اطلاعات پایه</span>
                  </div>
                  
                  <!-- Step 2 -->
                  <div class="flex flex-col items-center relative z-10">
                    <div :class="[currentStep >= 2 ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-black shadow-lg shadow-blue-400/30' : 'bg-blue-100/40 dark:bg-blue-700/20 text-blue-600 dark:text-blue-300 font-bold', 'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 border-2 border-white dark:border-blue-800 hover:scale-110']">
                      2
                    </div>
                    <span :class="[currentStep >= 2 ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-blue-600 dark:text-blue-400', 'text-sm']">آرایش نبرد</span>
                  </div>
                  
                  <!-- Step 3 -->
                  <div class="flex flex-col items-center relative z-10">
                    <div :class="[currentStep >= 3 ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-black shadow-lg shadow-blue-400/30' : 'bg-blue-100/40 dark:bg-blue-700/20 text-blue-600 dark:text-blue-300 font-bold', 'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 border-2 border-white dark:border-blue-800 hover:scale-110']">
                      3
                    </div>
                    <span :class="[currentStep >= 3 ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-blue-600 dark:text-blue-400', 'text-sm']">زمان شروع</span>
                  </div>
                  
                  <!-- Step 4 -->
                  <div class="flex flex-col items-center relative z-10">
                    <div :class="[currentStep >= 4 ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-black shadow-lg shadow-blue-400/30' : 'bg-blue-100/40 dark:bg-blue-700/20 text-blue-600 dark:text-blue-300 font-bold', 'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 border-2 border-white dark:border-blue-800 hover:scale-110']">
                      4
                    </div>
                    <span :class="[currentStep >= 4 ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-blue-600 dark:text-blue-400', 'text-sm']">نمادشناسی</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Step 1: Basic Info -->
            <div v-show="currentStep === 1">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">اطلاعات پایه سناریو</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">نام و توضیحی برای سناریوی خود ارائه دهید.</p>
              </div>
              <div class="space-y-6">
                <InputGroup label="نام" v-model="form.name" id="name-input" autofocus />
                <SimpleMarkdownInput
                  label="توضیحات"
                  v-model="form.description"
                  description="از نحو مارک‌داون برای قالب‌بندی استفاده کنید"
                />
              </div>
            </div>
            
            <!-- Step 2: ORBAT Configuration -->
            <div v-show="currentStep === 2">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">آرایش نبرد اولیه</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">طرف‌ها و واحدهای ریشه.</p>
              </div>
              <div>
                <ToggleField v-model="noInitialOrbat"
                  >طرف‌ها و واحدهای ریشه را بعداً اضافه کن
                </ToggleField>
              </div>
              <template v-if="!noInitialOrbat">
                <div
                  v-for="(sideData, idx) in form.sides"
                  class="relative rounded-3xl border bg-blue-100/60 dark:bg-blue-400/15 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/30 dark:supports-[backdrop-filter]:bg-blue-400/20 p-6 border-blue-200/30 dark:border-blue-400/30 mb-6 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/3 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 transition-all duration-300"
                >
                  <div class="grid gap-4 md:grid-cols-2">
                    <InputGroup v-model="sideData.name" label="نام طرف" />
                  </div>
                  <StandardIdentitySelect
                    v-model="sideData.standardIdentity"
                    v-model:fill-color="sideData.symbolOptions.fillColor"
                  />
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
                </div>
                <footer class="mt-6 flex justify-center">
                  <Button type="button" variant="link" size="sm" @click="addSide()" class="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-200 border border-emerald-200/50 dark:border-emerald-700/50">
                    + افزودن طرف
                  </Button>
                </footer>
              </template>
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
                  <p class="text-blue-700 dark:text-blue-300 font-mono text-center text-lg font-semibold">{{ resDateTime.format() }}</p>
                </div>
              </div>
            </div>
            
            <!-- Step 4: Symbology Standards -->
            <div v-show="currentStep === 4">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <h3 class="text-2xl font-bold text-blue-600 dark:text-blue-400">استاندارد نمادشناسی</h3>
                </div>
                <p class="text-slate-600 dark:text-slate-400 mb-6">استاندارد نمادشناسی که ترجیح می‌دهید استفاده کنید را انتخاب کنید.</p>
              </div>
              <div class="space-y-4">
                <RadioGroupList
                  :items="standardSettings"
                  v-model="newScenario.symbologyStandard"
                />
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
                   <BaseButton primary type="submit" class="bg-blue-400 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-semibold shadow-xl shadow-blue-500/10 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-blue-300/30">
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
import { reactive, ref } from "vue";
import FormCard from "@/components/FormCard.vue";
import InputGroup from "@/components/InputGroup.vue";
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
import NewMilitarySymbol from "@/components/NewMilitarySymbol.vue";

const router = useRouter();
const { scenario } = useScenario();

// Step management
const currentStep = ref(1);
const totalSteps = 4;

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
}

const noInitialOrbat = ref(false);

const newScenario = ref(
  createEmptyScenario({ addGroups: true, symbologyStandard: "app6" }),
);
const timeZone = ref(newScenario.value.timeZone || "UTC");
const { year, month, day, hour, minute, resDateTime } = useYMDElements({
  timestamp: newScenario.value.startTime!,
  isLocal: true,
  timeZone,
});

const form = reactive<NewScenarioForm>({
  name: "سناریوی جدید",
  description: "",
  sides: [
    {
      name: "طرف ۱",
      standardIdentity: SID.Friend,
      symbolOptions: {},
      units: [{ rootUnitName: "ستاد", rootUnitEchelon: "18", rootUnitIcon: "121100" }],
    },
    {
      name: "طرف ۲",
      standardIdentity: SID.Hostile,
      symbolOptions: {},
      units: [{ rootUnitName: "ستاد", rootUnitEchelon: "18", rootUnitIcon: "121100" }],
    },
  ],
});

// Step navigation functions
const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

async function create() {
  const startTime = resDateTime.value.valueOf();
  newScenario.value.startTime = startTime;
  newScenario.value.name = form.name;
  newScenario.value.description = form.description;
  newScenario.value.layers = [{ name: "Features", id: nanoid(), features: [] }];
  newScenario.value.timeZone = timeZone.value;

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
  form.sides.push({
    name: "طرف",
    standardIdentity: SID.Friend,
    symbolOptions: {},
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
</script>
