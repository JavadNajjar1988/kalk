<script setup lang="ts">
import { computed, inject, onUnmounted, reactive, ref } from "vue";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";
import { activeMapKey, activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import {
  DEFAULT_METOC_SIDC,
  validateEnvironmentalConditions,
} from "@/scenariostore/environment";
import type {
  EnvironmentalCondition,
  EnvironmentalKind,
  EnvironmentalParameters,
  EnvironmentalScope,
} from "@/types/scenarioModels";
import { symbolGenerator } from "@/symbology/milsymbwrapper";
import PersianDateTimeField from "@/components/PersianDateTimeField.vue";
import {
  ENVIRONMENT_PRESETS,
  presetForCondition,
  type EnvironmentPreset,
} from "./environmentPresets";
import MetocSymbolIcon from "./MetocSymbolIcon.vue";
import MetocSymbolPicker from "./MetocSymbolPicker.vue";
import {
  DEFAULT_METOC_SYMBOL,
  findMetocSymbol,
  metocSymbolAsPreset,
  type MetocSymbol,
} from "./metocCatalog";

const scenario = injectStrict(activeScenarioKey);
const mapRef = inject(activeMapKey);
const { state } = scenario.store;
const conditions = computed(() => state.environmentalConditions);
const issues = computed(() => validateEnvironmentalConditions(conditions.value));
const editingId = ref<string>();
const formOpen = ref(false);
const drawing = ref(false);

type EnvironmentDomain = "metoc" | "terrain" | "infrastructure";

const activeDomain = ref<EnvironmentDomain>("metoc");
const selectedPresetId = ref("dry-ground");
const selectedMetocSidc = ref(DEFAULT_METOC_SYMBOL.sidc);
const parameterValues = reactive<EnvironmentalParameters>({});
const selectedMetocSymbol = computed(
  () => findMetocSymbol(selectedMetocSidc.value) ?? DEFAULT_METOC_SYMBOL,
);
const selectedPreset = computed(() => {
  if (activeDomain.value === "metoc") {
    return metocSymbolAsPreset(selectedMetocSymbol.value);
  }
  return (
    ENVIRONMENT_PRESETS.find(
      (preset) =>
        preset.id === selectedPresetId.value && preset.category === activeDomain.value,
    ) ??
    ENVIRONMENT_PRESETS.find((preset) => preset.category === activeDomain.value) ??
    ENVIRONMENT_PRESETS[0]
  );
});
const visiblePresets = computed(() =>
  ENVIRONMENT_PRESETS.filter((preset) => preset.category === activeDomain.value),
);

const form = reactive({
  name: "",
  kind: "precipitation" as EnvironmentalKind,
  scope: "global" as EnvironmentalScope,
  startTime: "",
  endTime: "",
  priority: 0,
  enabled: true,
  description: "",
  geometry: undefined as EnvironmentalCondition["geometry"],
  geometryMode: "Polygon" as "Polygon" | "LineString" | "Point",
});

function toLocalInput(value?: number) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function resetForm(condition?: EnvironmentalCondition) {
  editingId.value = condition?.id;
  form.name = condition?.name ?? "";
  form.kind = condition?.kind ?? "precipitation";
  form.scope = condition?.scope ?? "global";
  form.startTime = toLocalInput(
    Number(condition?.startTime ?? state.currentTime ?? state.info.startTime),
  );
  form.endTime = toLocalInput(
    condition?.endTime === undefined ? undefined : Number(condition.endTime),
  );
  form.priority = condition?.priority ?? 0;
  form.enabled = condition?.enabled ?? true;
  form.description = condition?.description ?? "";
  form.geometry = condition?.geometry;
  form.geometryMode =
    condition?.geometry?.type === "LineString" || condition?.geometry?.type === "Point"
      ? condition.geometry.type
      : "Polygon";
  const standardSymbol = findMetocSymbol(condition?.metocSidc);
  const preset = condition
    ? presetForCondition(condition.kind, condition.parameters, condition.metocSidc)
    : metocSymbolAsPreset(DEFAULT_METOC_SYMBOL);
  if (!condition || standardSymbol) {
    const symbol = standardSymbol ?? DEFAULT_METOC_SYMBOL;
    activeDomain.value = "metoc";
    selectedMetocSidc.value = symbol.sidc;
    form.kind = "metoc";
    form.scope = "area";
    form.geometryMode = symbol.geometry;
  } else {
    selectedPresetId.value = preset.id;
    activeDomain.value =
      preset.category === "infrastructure" ? "infrastructure" : "terrain";
  }
  Object.keys(parameterValues).forEach((key) => delete parameterValues[key]);
  Object.assign(parameterValues, condition?.parameters ?? preset.parameters);
  formOpen.value = true;
}

function buildParameters(): EnvironmentalParameters {
  return { ...parameterValues };
}

function choosePreset(preset: EnvironmentPreset) {
  stopDrawing();
  selectedPresetId.value = preset.id;
  form.kind = preset.kind;
  if (!form.name || ENVIRONMENT_PRESETS.some((item) => item.label === form.name)) {
    form.name = preset.label;
  }
  Object.keys(parameterValues).forEach((key) => delete parameterValues[key]);
  Object.assign(parameterValues, preset.parameters);
}

function chooseMetocSymbol(symbol: MetocSymbol) {
  stopDrawing();
  selectedMetocSidc.value = symbol.sidc;
  form.kind = "metoc";
  form.scope = "area";
  form.geometryMode = symbol.geometry;
  form.geometry = undefined;
  form.name = symbol.label || symbol.labelEn;
  Object.keys(parameterValues).forEach((key) => delete parameterValues[key]);
  Object.assign(parameterValues, metocSymbolAsPreset(symbol).parameters);
}

const metocSelection = computed({
  get: () => selectedMetocSidc.value,
  set: (sidc: string) => {
    const symbol = findMetocSymbol(sidc);
    if (symbol) chooseMetocSymbol(symbol);
  },
});

function selectDomain(domain: EnvironmentDomain) {
  activeDomain.value = domain;
  if (domain === "metoc") {
    chooseMetocSymbol(selectedMetocSymbol.value);
    return;
  }
  const first = ENVIRONMENT_PRESETS.find((preset) => preset.category === domain);
  if (first) choosePreset(first);
}

function isPresetSelected(preset: EnvironmentPreset) {
  return selectedPresetId.value === preset.id;
}

function save() {
  const startTime = new Date(form.startTime).getTime();
  const endTime = form.endTime ? new Date(form.endTime).getTime() : undefined;
  if (!Number.isFinite(startTime) || (endTime !== undefined && endTime <= startTime)) {
    return;
  }
  if (form.scope === "area" && !form.geometry) return;
  const payload = {
    name: form.name.trim() || undefined,
    kind: form.kind,
    scope: form.scope,
    startTime,
    endTime,
    parameters: buildParameters(),
    geometry: form.scope === "area" ? form.geometry : undefined,
    priority: Number(form.priority),
    enabled: form.enabled,
    description: form.description.trim() || undefined,
    metocSidc: selectedPreset.value.metocSidc ?? DEFAULT_METOC_SIDC[form.kind],
  };
  if (editingId.value) scenario.environment.updateCondition(editingId.value, payload);
  else scenario.environment.addCondition(payload);
  formOpen.value = false;
}

let drawInteraction: Draw | undefined;
let drawLayer: VectorLayer<VectorSource> | undefined;

function stopDrawing() {
  const map = mapRef?.value;
  if (map && drawInteraction) map.removeInteraction(drawInteraction);
  if (map && drawLayer) map.removeLayer(drawLayer);
  drawInteraction = undefined;
  drawLayer = undefined;
  drawing.value = false;
}

function drawArea() {
  const map = mapRef?.value;
  if (!map) return;
  stopDrawing();
  const source = new VectorSource();
  drawLayer = new VectorLayer({
    source,
    style: new Style({
      fill: new Fill({ color: "rgba(14, 165, 233, 0.18)" }),
      stroke: new Stroke({ color: "#0284c7", width: 2, lineDash: [6, 4] }),
    }),
  });
  map.addLayer(drawLayer);
  drawInteraction = new Draw({ source, type: form.geometryMode });
  map.addInteraction(drawInteraction);
  drawing.value = true;
  drawInteraction.once("drawend", (event) => {
    form.geometry = new GeoJSON().writeGeometryObject(event.feature.getGeometry()!, {
      featureProjection: map.getView().getProjection(),
      dataProjection: "EPSG:4326",
    });
    window.setTimeout(stopDrawing, 0);
  });
}

function parameterSummary(condition: EnvironmentalCondition) {
  const preset = conditionPreset(condition);
  return preset.fields
    .slice(0, 2)
    .map((field) => {
      const raw = condition.parameters[field.key];
      const option = field.options?.find((item) => item.value === raw);
      return `${field.label}: ${option?.label ?? raw ?? "—"}${field.unit ? ` ${field.unit}` : ""}`;
    })
    .join(" · ");
}

function conditionPreset(condition: EnvironmentalCondition) {
  const standard = findMetocSymbol(condition.metocSidc);
  return standard
    ? metocSymbolAsPreset(standard)
    : presetForCondition(condition.kind, condition.parameters, condition.metocSidc);
}

onUnmounted(stopDrawing);
</script>

<template>
  <section dir="rtl" class="space-y-3">
    <header class="flex items-start justify-between gap-2">
      <div>
        <h3 class="font-semibold">شرایط محیطی</h3>
        <p class="text-muted-foreground text-xs">
          تغییرات زمان‌مند هوا و زمین را تعریف کنید؛ داشبورد فقط آن‌ها را مرور می‌کند.
        </p>
      </div>
      <button class="rounded bg-sky-600 px-3 py-1.5 text-white" @click="resetForm()">
        افزودن
      </button>
    </header>

    <div
      v-if="issues.length"
      class="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900"
    >
      {{ issues.length }} هشدار اعتبارسنجی وجود دارد (هم‌پوشانی، بازه نامعتبر یا محدوده
      ترسیم‌نشده).
    </div>

    <div
      v-if="!conditions.length"
      class="rounded border border-dashed p-4 text-center text-sm text-slate-500"
    >
      هنوز وضعیت محیطی ثبت نشده است.
    </div>
    <article
      v-for="condition in conditions"
      :key="condition.id"
      class="relative overflow-hidden rounded-xl border border-slate-200 p-3 shadow-sm dark:border-slate-700"
      :class="{ 'opacity-50': condition.enabled === false }"
      :style="`border-right: 5px solid ${conditionPreset(condition).color}; background: linear-gradient(135deg, ${conditionPreset(condition).color}12, transparent 55%);`"
    >
      <div class="flex items-start gap-2">
        <span class="h-12 w-12 shrink-0 rounded-lg bg-white/80 p-1 shadow-sm">
          <MetocSymbolIcon
            :sidc="condition.metocSidc ?? DEFAULT_METOC_SIDC[condition.kind]"
            :size="38"
            :label="condition.name"
          />
        </span>
        <div class="min-w-0 flex-1">
          <div class="font-medium">
            {{ condition.name || conditionPreset(condition).label }}
          </div>
          <div class="text-muted-foreground text-xs">
            {{ new Date(Number(condition.startTime)).toLocaleString("fa-IR") }}
            تا
            {{
              condition.endTime
                ? new Date(Number(condition.endTime)).toLocaleString("fa-IR")
                : "ادامه‌دار"
            }}
          </div>
          <div class="mt-1 text-xs">
            {{ parameterSummary(condition) }} ·
            {{ condition.scope === "area" ? "محدوده‌ای" : "سراسری" }}
          </div>
        </div>
        <div class="flex gap-1">
          <button
            class="rounded border px-2 py-1 text-xs"
            @click="
              scenario.environment.setConditionEnabled(
                condition.id,
                condition.enabled === false,
              )
            "
          >
            فعال/غیرفعال
          </button>
          <button class="rounded border px-2 py-1 text-xs" @click="resetForm(condition)">
            ویرایش
          </button>
          <button
            class="rounded border border-red-300 px-2 py-1 text-xs text-red-600"
            @click="scenario.environment.deleteCondition(condition.id)"
          >
            حذف
          </button>
        </div>
      </div>
    </article>

    <form
      v-if="formOpen"
      class="space-y-3 rounded border bg-slate-50 p-3 dark:bg-slate-900"
      @submit.prevent="save"
    >
      <div>
        <div class="mb-1 text-xs font-medium">انتخاب وضعیت محیطی</div>
        <div class="mb-2 flex rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
          <button
            type="button"
            class="flex-1 rounded px-2 py-1 text-xs"
            :class="{
              'bg-white shadow dark:bg-slate-700': activeDomain === 'metoc',
            }"
            @click="selectDomain('metoc')"
          >
            نمادهای METOC
          </button>
          <button
            type="button"
            class="flex-1 rounded px-2 py-1 text-xs"
            :class="{ 'bg-white shadow dark:bg-slate-700': activeDomain === 'terrain' }"
            @click="selectDomain('terrain')"
          >
            زمین
          </button>
          <button
            type="button"
            class="flex-1 rounded px-2 py-1 text-xs"
            :class="{
              'bg-white shadow dark:bg-slate-700': activeDomain === 'infrastructure',
            }"
            @click="selectDomain('infrastructure')"
          >
            راه و زیرساخت
          </button>
        </div>
        <MetocSymbolPicker v-if="activeDomain === 'metoc'" v-model="metocSelection" />
        <div v-else class="grid grid-cols-3 gap-1 sm:grid-cols-5">
          <button
            v-for="preset in visiblePresets"
            :key="preset.id"
            type="button"
            class="flex min-h-16 flex-col items-center justify-center rounded-lg border p-1 text-[11px] transition"
            :class="
              isPresetSelected(preset)
                ? 'border-sky-500 bg-sky-100 text-sky-900 ring-1 ring-sky-400 dark:bg-sky-950 dark:text-sky-100'
                : 'border-slate-200 bg-white hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800'
            "
            @click="choosePreset(preset)"
          >
            <span
              class="h-8 w-8"
              v-html="symbolGenerator(preset.metocSidc, { size: 24 }).asSVG()"
            />
            <span>{{ preset.label }}</span>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label class="col-span-2 text-xs"
          >عنوان<input
            v-model="form.name"
            class="mt-1 w-full rounded border bg-transparent p-2"
        /></label>
        <label class="text-xs"
          >دامنه
          <select
            v-model="form.scope"
            :disabled="activeDomain === 'metoc'"
            class="mt-1 w-full rounded border bg-transparent p-2"
          >
            <option value="global">سراسری</option>
            <option value="area">محدوده روی نقشه</option>
          </select>
        </label>
        <PersianDateTimeField v-model="form.startTime" label="شروع" required />
        <PersianDateTimeField v-model="form.endTime" label="پایان" />
        <label v-for="field in selectedPreset.fields" :key="field.key" class="text-xs">
          {{ field.label }}
          <span v-if="field.unit" class="text-muted-foreground">({{ field.unit }})</span>
          <select
            v-if="field.type === 'select'"
            v-model="parameterValues[field.key]"
            class="mt-1 w-full rounded border bg-transparent p-2"
          >
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <input
            v-else
            v-model.number="parameterValues[field.key]"
            type="number"
            :min="field.min"
            :max="field.max"
            :step="field.step ?? 'any'"
            class="mt-1 w-full rounded border bg-transparent p-2"
          />
        </label>
        <label class="text-xs"
          >اولویت<input
            v-model.number="form.priority"
            type="number"
            class="mt-1 w-full rounded border bg-transparent p-2"
        /></label>
      </div>
      <label
        v-if="form.scope === 'area' && activeDomain !== 'metoc'"
        class="block text-xs"
      >
        نوع هندسه
        <select
          v-model="form.geometryMode"
          class="mt-1 w-full rounded border bg-transparent p-2"
        >
          <option value="Polygon">محدوده چندضلعی</option>
          <option value="LineString">مسیر یا محور</option>
          <option value="Point">نقطه</option>
        </select>
      </label>
      <div
        v-if="activeDomain === 'metoc'"
        class="rounded border border-sky-200 bg-sky-50 p-2 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100"
      >
        نوع ترسیم بر اساس استاندارد نماد تعیین شده است:
        {{
          form.geometryMode === "Point"
            ? "نقطه"
            : form.geometryMode === "LineString"
              ? "خط"
              : "سطح"
        }}
      </div>
      <button
        v-if="form.scope === 'area'"
        type="button"
        class="w-full rounded border border-sky-500 p-2 text-sky-700"
        @click="drawArea"
      >
        {{
          drawing
            ? "ترسیم را روی نقشه کامل کنید…"
            : form.geometry
              ? "ترسیم مجدد مکان"
              : "ترسیم روی نقشه"
        }}
      </button>
      <textarea
        v-model="form.description"
        rows="2"
        placeholder="توضیحات"
        class="w-full rounded border bg-transparent p-2"
      />
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded border px-3 py-1.5"
          @click="
            formOpen = false;
            stopDrawing();
          "
        >
          انصراف
        </button>
        <button class="rounded bg-sky-600 px-3 py-1.5 text-white">ذخیره</button>
      </div>
    </form>
  </section>
</template>
