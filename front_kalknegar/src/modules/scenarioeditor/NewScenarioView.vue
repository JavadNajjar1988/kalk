<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50/60 via-slate-50 to-green-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-green-950 text-foreground">
    <!-- Simple Modern Header with Blue-Green Icy Theme -->
    <header class="relative bg-gradient-to-br from-emerald-50/80 via-slate-50 to-blue-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950 backdrop-blur-lg border-b border-blue-200/40 dark:border-blue-700/30 shadow-lg shadow-blue-500/10 py-4">
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <!-- Logo/Icon -->
          <div class="w-10 h-10 bg-gradient-to-br from-emerald-100 to-blue-200 dark:from-emerald-800 dark:to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-300/50 dark:border-blue-600/50">
            <svg class="w-5 h-5 text-emerald-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <main class="flex-1 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-green-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-green-950 transition-all duration-300">
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <!-- Progress Steps -->
        <div class="mb-12">
          <div class="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl shadow-emerald-500/10 border border-emerald-200/40 dark:border-slate-600/40 mb-8">
            <div class="flex items-center justify-between relative">
              <!-- Progress Line -->
              <div class="absolute top-1/2 left-0 right-0 h-1 bg-emerald-200 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>
              
              <!-- Step 1 -->
              <div class="flex flex-col items-center relative z-10">
                <div :class="[currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 dark:bg-slate-600 text-emerald-800 dark:text-slate-300', 'w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 shadow-lg shadow-emerald-500/30 border-4 border-white dark:border-slate-800']">
                  1
                </div>
                <span :class="[currentStep >= 1 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-emerald-600 dark:text-emerald-400', 'text-sm']">اطلاعات پایه</span>
              </div>
              
              <!-- Step 2 -->
              <div class="flex flex-col items-center relative z-10">
                <div :class="[currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 dark:bg-slate-600 text-emerald-800 dark:text-slate-300', 'w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 border-4 border-white dark:border-slate-800']">
                  2
                </div>
                <span :class="[currentStep >= 2 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-emerald-600 dark:text-emerald-400', 'text-sm']">آرایش نبرد</span>
              </div>
              
              <!-- Step 3 -->
              <div class="flex flex-col items-center relative z-10">
                <div :class="[currentStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 dark:bg-slate-600 text-emerald-800 dark:text-slate-300', 'w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 border-4 border-white dark:border-slate-800']">
                  3
                </div>
                <span :class="[currentStep >= 3 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-emerald-600 dark:text-emerald-400', 'text-sm']">زمان شروع</span>
              </div>
              
              <!-- Step 4 -->
              <div class="flex flex-col items-center relative z-10">
                <div :class="[currentStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 dark:bg-slate-600 text-emerald-800 dark:text-slate-300', 'w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 border-4 border-white dark:border-slate-800']">
                  4
                </div>
                <span :class="[currentStep >= 4 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-emerald-600 dark:text-emerald-400', 'text-sm']">نمادشناسی</span>
              </div>
            </div>
          </div>
        </div>
        
        <form class="space-y-8" @submit.prevent="create()">
          <!-- Single Box Container for Step Content -->
          <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl shadow-emerald-500/10 border border-emerald-200/40 dark:border-slate-600/40 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
            <!-- Step 1: Basic Info -->
            <div v-show="currentStep === 1">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">اطلاعات پایه سناریو</h3>
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
                  <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">آرایش نبرد اولیه</h3>
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
                  class="relative rounded-3xl border bg-gradient-to-br from-rose-50/70 to-pink-50/70 dark:from-rose-900/30 dark:to-pink-900/30 backdrop-blur-sm p-6 dark:border-slate-600/50 border-rose-200/50 mb-6 shadow-lg shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 transition-all duration-500"
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
                  <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">زمان شروع سناریو</h3>
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
                <div class="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/30 dark:to-yellow-900/30 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/60 dark:border-amber-700/60 shadow-lg shadow-amber-500/10">
                  <p class="text-amber-700 dark:text-amber-300 font-mono text-center text-lg font-semibold">{{ resDateTime.format() }}</p>
                </div>
              </div>
            </div>
            
            <!-- Step 4: Symbology Standards -->
            <div v-show="currentStep === 4">
              <div class="mb-6">
                <div class="flex items-center gap-3 mb-6">
                  <div class="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <h3 class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">استاندارد نمادشناسی</h3>
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
            <div class="flex justify-between mt-8 pt-6 border-t border-emerald-200/40 dark:border-slate-600/40">
              <BaseButton 
                v-if="currentStep > 1" 
                @click="prevStep()" 
                type="button"
                class="bg-white/70 hover:bg-white/90 dark:bg-slate-700/70 dark:hover:bg-slate-700/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-500/10 hover:shadow-xl border border-slate-200/50 dark:border-slate-600/50 transition-all duration-300"
              >
                مرحله قبل
              </BaseButton>
              
              <div class="flex-grow"></div>
              
              <BaseButton 
                v-if="currentStep < totalSteps" 
                @click="nextStep()" 
                type="button"
                class="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-emerald-300/50"
              >
                مرحله بعد
              </BaseButton>
            </div>
          </div>
          
          <!-- Final Action Card - Always visible below the step container -->
          <div class="bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-slate-800/70 dark:to-emerald-900/70 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50 dark:border-slate-600/50 shadow-xl shadow-emerald-500/10 mt-6">
            <div class="flex items-center justify-between">
              <div class="text-sm text-emerald-600 dark:text-emerald-400">
                آماده برای ایجاد سناریوی جدید؟
              </div>
              <div class="flex items-center gap-4">
                <BaseButton @click="cancel()" type="button" class="bg-white/70 hover:bg-white/90 dark:bg-slate-700/70 dark:hover:bg-slate-700/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-500/10 hover:shadow-xl border border-slate-200/50 dark:border-slate-600/50 transition-all duration-300">
                  لغو
                </BaseButton>
                <BaseButton primary type="submit" class="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white px-8 py-2.5 rounded-xl font-semibold shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 border border-emerald-300/50">
                  ایجاد سناریو
                </BaseButton>
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
import { useIndexedDb } from "@/scenariostore/localdb";
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

  const { addScenario } = await useIndexedDb();
  const scenarioId = await addScenario(scenario.value.io.serializeToObject());

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
