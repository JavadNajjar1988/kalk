<template>
  <div class="min-h-screen bg-blue-50 dark:bg-slate-900">
    <!-- Modern Header Section -->
    <header class="relative bg-purple-100 dark:bg-slate-800 py-16">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 30% 20%, rgba(147, 197, 253, 0.1) 0%, transparent 50%);" />
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 80% 80%, rgba(196, 181, 253, 0.1) 0%, transparent 50%);" />
      </div>
      
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div class="mb-8">
          <div class="w-20 h-20 bg-green-200 dark:bg-green-800 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <svg class="w-10 h-10 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 class="text-4xl sm:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4 leading-tight">
            ایجاد سناریوی جدید
          </h1>
          <p class="text-xl text-slate-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            در اینجا می‌توانید در صورت تمایل برخی داده‌های اولیه برای سناریوی خود ارائه دهید. همیشه می‌توانید این تنظیمات را بعداً تغییر دهید.
          </p>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <form class="space-y-8" @submit.prevent="create()">
        <!-- Action Buttons at Top -->
        <div class="flex items-center justify-end gap-4">
          <BaseButton @click="cancel()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300">
            لغو
          </BaseButton>
          <BaseButton primary type="submit" class="bg-green-400 hover:bg-green-500 text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
            ایجاد سناریو
          </BaseButton>
        </div>
        <!-- Basic Info Card -->
        <div class="bg-white dark:bg-slate-700 rounded-3xl p-8 shadow-lg border border-blue-200 dark:border-slate-600">
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-700 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.11 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">اطلاعات پایه سناریو</h3>
                <p class="text-gray-600 dark:text-gray-400">نام و توضیحی برای سناریوی خود ارائه دهید.</p>
              </div>
            </div>
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
        <!-- ORBAT Configuration Card -->
        <div class="bg-white dark:bg-slate-700 rounded-3xl p-8 shadow-lg border border-purple-200 dark:border-slate-600">
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-700 dark:text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">آرایش نبرد اولیه</h3>
                <p class="text-gray-600 dark:text-gray-400">طرف‌ها و واحدهای ریشه.</p>
              </div>
            </div>
          </div>
          <div>
            <ToggleField v-model="noInitialOrbat"
              >طرف‌ها و واحدهای ریشه را بعداً اضافه کن
            </ToggleField>
          </div>
          <template v-if="!noInitialOrbat">
            <div
              v-for="(sideData, idx) in form.sides"
              class="relative rounded-2xl border bg-rose-50 dark:bg-rose-900/20 p-6 dark:border-slate-600 border-rose-200 mb-6"
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
                  class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  حذف واحد
                </Button>
                <span class="text-gray-300">|</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  @click="addRootUnit(sideData)"
                  class="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  + افزودن واحد ریشه
                </Button>
              </footer>
              <Button
                variant="link"
                size="sm"
                v-if="idx === form.sides.length - 1"
                @click="form.sides.pop()"
                class="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all duration-200"
              >
                حذف طرف
              </Button>
            </div>
            <footer class="mt-6 flex justify-center">
              <Button type="button" variant="link" size="sm" @click="addSide()" class="text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-4 py-2 rounded-lg transition-all duration-200">
                + افزودن طرف
              </Button>
            </footer>
          </template>
        </div>
        <!-- Time Settings Card -->
        <div class="bg-white dark:bg-slate-700 rounded-3xl p-8 shadow-lg border border-teal-200 dark:border-slate-600">
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-teal-200 dark:bg-teal-800 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-teal-700 dark:text-teal-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z" />
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">زمان شروع سناریو</h3>
                <p class="text-gray-600 dark:text-gray-400">زمان شروع و منطقه زمانی را انتخاب کنید.</p>
              </div>
            </div>
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
            <div class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
              <p class="text-amber-800 dark:text-amber-300 font-mono text-center">{{ resDateTime.format() }}</p>
            </div>
          </div>
        </div>
        <!-- Symbology Standards Card -->
        <div class="bg-white dark:bg-slate-700 rounded-3xl p-8 shadow-lg border border-orange-200 dark:border-slate-600">
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-orange-200 dark:bg-orange-800 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-orange-700 dark:text-orange-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">استاندارد نمادشناسی</h3>
                <p class="text-gray-600 dark:text-gray-400">استاندارد نمادشناسی که ترجیح می‌دهید استفاده کنید را انتخاب کنید.</p>
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <RadioGroupList
              :items="standardSettings"
              v-model="newScenario.symbologyStandard"
            />
          </div>
        </div>
        <!-- Final Action Buttons -->
        <div class="bg-gray-50 dark:bg-slate-800 rounded-3xl p-8 border border-gray-200 dark:border-slate-600">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              آماده برای ایجاد سناریوی جدید؟
            </div>
            <div class="flex items-center gap-4">
              <BaseButton @click="cancel()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300">
                لغو
              </BaseButton>
              <BaseButton primary type="submit" class="bg-green-400 hover:bg-green-500 text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                ایجاد سناریو
              </BaseButton>
            </div>
          </div>
        </div>
      </form>
    </div>
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
