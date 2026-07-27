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
import {
  ENVIRONMENT_PRESETS,
  presetForCondition,
  type EnvironmentPreset,
} from "./environmentPresets";

const scenario = injectStrict(activeScenarioKey);
const mapRef = inject(activeMapKey);
const { state } = scenario.store;
const conditions = computed(() => state.environmentalConditions);
const issues = computed(() => validateEnvironmentalConditions(conditions.value));
const editingId = ref<string>();
const formOpen = ref(false);
const drawing = ref(false);

const KIND_OPTIONS: Array<{ value: EnvironmentalKind; label: string }> = [
  { value: "precipitation", label: "بارش" },
  { value: "fog", label: "مه" },
  { value: "visibility", label: "محدوده دید" },
  { value: "wind", label: "باد" },
  { value: "temperature", label: "دما" },
  { value: "surface_condition", label: "وضعیت زمین" },
  { value: "cloud_cover", label: "پوشش ابر" },
];

const form = reactive({
  name: "",
  kind: "precipitation" as EnvironmentalKind,
  scope: "global" as EnvironmentalScope,
  startTime: "",
  endTime: "",
  intensity: 0.6,
  secondaryValue: 10,
  direction: 0,
  mode: "rain",
  surface: "wet",
  priority: 0,
  enabled: true,
  description: "",
  geometry: undefined as EnvironmentalCondition["geometry"],
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
  form.mode =
    condition?.kind === "precipitation" && "mode" in condition.parameters
      ? condition.parameters.mode
      : "rain";
  form.surface =
    condition?.kind === "surface_condition" && "condition" in condition.parameters
      ? condition.parameters.condition
      : "wet";
  form.intensity =
    condition?.parameters && "intensity" in condition.parameters
      ? condition.parameters.intensity ?? 0.6
      : condition?.parameters && "coverage" in condition.parameters
        ? condition.parameters.coverage
        : 0.6;
  form.secondaryValue =
    condition?.kind === "visibility" && "rangeMeters" in condition.parameters
      ? condition.parameters.rangeMeters
      : condition?.kind === "temperature" && "celsius" in condition.parameters
        ? condition.parameters.celsius
        : condition?.kind === "wind" && "speedMps" in condition.parameters
          ? condition.parameters.speedMps
          : 10;
  form.direction =
    condition?.kind === "wind" && "directionDeg" in condition.parameters
      ? condition.parameters.directionDeg
      : 0;
  formOpen.value = true;
}

function buildParameters(): EnvironmentalParameters {
  switch (form.kind) {
    case "precipitation":
      return {
        mode: form.mode as "rain" | "snow" | "hail",
        intensity: Number(form.intensity),
      };
    case "visibility":
      return { rangeMeters: Number(form.secondaryValue) };
    case "wind":
      return {
        speedMps: Number(form.secondaryValue),
        directionDeg: Number(form.direction),
      };
    case "temperature":
      return { celsius: Number(form.secondaryValue) };
    case "fog":
      return { intensity: Number(form.intensity) };
    case "surface_condition":
      return {
        condition: form.surface as
          | "dry"
          | "wet"
          | "muddy"
          | "icy"
          | "flooded"
          | "snow_covered",
        intensity: Number(form.intensity),
      };
    default:
      return { coverage: Number(form.intensity) };
  }
}

function choosePreset(preset: EnvironmentPreset) {
  form.kind = preset.kind;
  if ("mode" in preset.parameters) {
    form.mode = preset.parameters.mode;
    form.intensity = preset.parameters.intensity;
  } else if ("condition" in preset.parameters) {
    form.surface = preset.parameters.condition;
    form.intensity = preset.parameters.intensity ?? 0.6;
  } else if ("rangeMeters" in preset.parameters) {
    form.secondaryValue = preset.parameters.rangeMeters;
  } else if ("speedMps" in preset.parameters) {
    form.secondaryValue = preset.parameters.speedMps;
    form.direction = preset.parameters.directionDeg;
  } else if ("celsius" in preset.parameters) {
    form.secondaryValue = preset.parameters.celsius;
  } else if ("coverage" in preset.parameters) {
    form.intensity = preset.parameters.coverage;
  } else {
    form.intensity = preset.parameters.intensity;
  }
}

function isPresetSelected(preset: EnvironmentPreset) {
  return presetForCondition(form.kind, buildParameters()).id === preset.id;
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
    metocSidc:
      form.kind === "precipitation" && form.mode === "snow"
        ? "W-S-WSS-LI"
        : form.kind === "precipitation" && form.mode === "hail"
          ? "W-S-WSGRL-"
          : DEFAULT_METOC_SIDC[form.kind],
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
  drawInteraction = new Draw({ source, type: "Polygon" });
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
  const params = condition.parameters;
  if ("mode" in params) return `${params.mode} · شدت ${params.intensity}`;
  if ("rangeMeters" in params) return `${params.rangeMeters} متر`;
  if ("speedMps" in params) return `${params.speedMps} m/s · ${params.directionDeg}°`;
  if ("celsius" in params) return `${params.celsius} °C`;
  if ("condition" in params) return `${params.condition}`;
  if ("coverage" in params) return `پوشش ${params.coverage}`;
  return `شدت ${params.intensity}`;
}

function metocSvg(condition: EnvironmentalCondition) {
  if (!condition.metocSidc) return "";
  try {
    return symbolGenerator(condition.metocSidc, { size: 28 }).asSVG();
  } catch {
    return "";
  }
}

function conditionPreset(condition: EnvironmentalCondition) {
  return presetForCondition(condition.kind, condition.parameters);
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

    <div v-if="issues.length" class="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
      {{ issues.length }} هشدار اعتبارسنجی وجود دارد (هم‌پوشانی، بازه نامعتبر یا محدوده ترسیم‌نشده).
    </div>

    <div v-if="!conditions.length" class="rounded border border-dashed p-4 text-center text-sm text-slate-500">
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
        <span v-if="condition.metocSidc" class="h-12 w-12 shrink-0 rounded-lg bg-white/80 p-1 shadow-sm" v-html="metocSvg(condition)" />
        <span v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/80 text-3xl shadow-sm dark:bg-slate-800">{{ conditionPreset(condition).emoji }}</span>
        <div class="min-w-0 flex-1">
          <div class="font-medium">{{ condition.name || KIND_OPTIONS.find(item => item.value === condition.kind)?.label }}</div>
          <div class="text-muted-foreground text-xs">
            {{ new Date(Number(condition.startTime)).toLocaleString("fa-IR") }}
            تا
            {{ condition.endTime ? new Date(Number(condition.endTime)).toLocaleString("fa-IR") : "ادامه‌دار" }}
          </div>
          <div class="mt-1 text-xs">{{ parameterSummary(condition) }} · {{ condition.scope === "area" ? "محدوده‌ای" : "سراسری" }}</div>
        </div>
        <div class="flex gap-1">
          <button class="rounded border px-2 py-1 text-xs" @click="scenario.environment.setConditionEnabled(condition.id, condition.enabled === false)">فعال/غیرفعال</button>
          <button class="rounded border px-2 py-1 text-xs" @click="resetForm(condition)">ویرایش</button>
          <button class="rounded border border-red-300 px-2 py-1 text-xs text-red-600" @click="scenario.environment.deleteCondition(condition.id)">حذف</button>
        </div>
      </div>
    </article>

    <form v-if="formOpen" class="space-y-3 rounded border bg-slate-50 p-3 dark:bg-slate-900" @submit.prevent="save">
      <div>
        <div class="mb-1 text-xs font-medium">انتخاب وضعیت محیطی</div>
        <div class="grid grid-cols-3 gap-1 sm:grid-cols-5">
          <button
            v-for="preset in ENVIRONMENT_PRESETS"
            :key="preset.id"
            type="button"
            class="flex min-h-16 flex-col items-center justify-center rounded-lg border p-1 text-[11px] transition"
            :class="isPresetSelected(preset) ? 'border-sky-500 bg-sky-100 text-sky-900 ring-1 ring-sky-400 dark:bg-sky-950 dark:text-sky-100' : 'border-slate-200 bg-white hover:border-sky-300 dark:border-slate-700 dark:bg-slate-800'"
            @click="choosePreset(preset)"
          >
            <span v-if="preset.metocSidc" class="h-8 w-8" v-html="symbolGenerator(preset.metocSidc, { size: 24 }).asSVG()" />
            <span v-else class="text-2xl">{{ preset.emoji }}</span>
            <span>{{ preset.label }}</span>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label class="col-span-2 text-xs">عنوان<input v-model="form.name" class="mt-1 w-full rounded border bg-transparent p-2" /></label>
        <label class="text-xs">دامنه
          <select v-model="form.scope" class="mt-1 w-full rounded border bg-transparent p-2">
            <option value="global">سراسری</option><option value="area">محدوده روی نقشه</option>
          </select>
        </label>
        <label class="text-xs">شروع<input v-model="form.startTime" required type="datetime-local" class="mt-1 w-full rounded border bg-transparent p-2" /></label>
        <label class="text-xs">پایان<input v-model="form.endTime" type="datetime-local" class="mt-1 w-full rounded border bg-transparent p-2" /></label>
        <label v-if="['precipitation','fog','surface_condition','cloud_cover'].includes(form.kind)" class="text-xs">شدت (۰ تا ۱)<input v-model.number="form.intensity" type="number" min="0" max="1" step="0.1" class="mt-1 w-full rounded border bg-transparent p-2" /></label>
        <label v-if="form.kind === 'precipitation'" class="text-xs">نوع بارش
          <select v-model="form.mode" class="mt-1 w-full rounded border bg-transparent p-2"><option value="rain">باران</option><option value="snow">برف</option><option value="hail">تگرگ</option></select>
        </label>
        <label v-if="form.kind === 'surface_condition'" class="text-xs">وضعیت زمین
          <select v-model="form.surface" class="mt-1 w-full rounded border bg-transparent p-2"><option value="dry">خشک</option><option value="wet">خیس</option><option value="muddy">گل‌آلود</option><option value="icy">یخ‌زده</option><option value="flooded">آب‌گرفته</option><option value="snow_covered">برفی</option></select>
        </label>
        <label v-if="['visibility','wind','temperature'].includes(form.kind)" class="text-xs">
          {{ form.kind === "visibility" ? "برد دید (متر)" : form.kind === "wind" ? "سرعت (m/s)" : "دما (°C)" }}
          <input v-model.number="form.secondaryValue" type="number" class="mt-1 w-full rounded border bg-transparent p-2" />
        </label>
        <label v-if="form.kind === 'wind'" class="text-xs">جهت (درجه)<input v-model.number="form.direction" type="number" min="0" max="359" class="mt-1 w-full rounded border bg-transparent p-2" /></label>
        <label class="text-xs">اولویت<input v-model.number="form.priority" type="number" class="mt-1 w-full rounded border bg-transparent p-2" /></label>
      </div>
      <button v-if="form.scope === 'area'" type="button" class="w-full rounded border border-sky-500 p-2 text-sky-700" @click="drawArea">
        {{ drawing ? "روی نقشه چندضلعی را کامل کنید…" : form.geometry ? "ترسیم مجدد محدوده" : "ترسیم محدوده روی نقشه" }}
      </button>
      <textarea v-model="form.description" rows="2" placeholder="توضیحات" class="w-full rounded border bg-transparent p-2" />
      <div class="flex justify-end gap-2">
        <button type="button" class="rounded border px-3 py-1.5" @click="formOpen = false; stopDrawing()">انصراف</button>
        <button class="rounded bg-sky-600 px-3 py-1.5 text-white">ذخیره</button>
      </div>
    </form>
  </section>
</template>
