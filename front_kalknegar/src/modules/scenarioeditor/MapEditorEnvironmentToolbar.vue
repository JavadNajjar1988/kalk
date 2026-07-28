<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import {
  PhX as CloseIcon,
  PhPolygon as AreaIcon,
  PhGlobe as GlobeIcon,
  PhPath as LineIcon,
  PhMapPin as PointIcon,
} from "@phosphor-icons/vue";
import Draw from "ol/interaction/Draw";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import { klona } from "klona";
import FloatingPanel from "@/components/FloatingPanel.vue";
import MainToolbarButton from "@/components/MainToolbarButton.vue";
import { activeMapKey, activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import { symbolGenerator } from "@/symbology/milsymbwrapper";
import PersianDateTimeField from "@/components/PersianDateTimeField.vue";
import { ENVIRONMENT_PRESETS, type EnvironmentPreset } from "./environmentPresets";

const toolbarStore = useMainToolbarStore();
const scenario = injectStrict(activeScenarioKey);
const mapRef = injectStrict(activeMapKey);
const selectedPresetId = ref("rain");
const activeCategory = ref<EnvironmentPreset["category"]>("atmosphere");
const scope = ref<"global" | "area">("area");
const geometryMode = ref<"Polygon" | "LineString" | "Point">("Polygon");
const drawing = ref(false);

function toInput(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

const startTime = ref(toInput(scenario.store.state.currentTime));
const endTime = ref(toInput(scenario.store.state.currentTime + 3 * 60 * 60 * 1000));
const selectedPreset = computed(
  () =>
    ENVIRONMENT_PRESETS.find((preset) => preset.id === selectedPresetId.value) ??
    ENVIRONMENT_PRESETS[0],
);
const visiblePresets = computed(() =>
  ENVIRONMENT_PRESETS.filter((preset) => preset.category === activeCategory.value),
);

function presetSvg(preset: EnvironmentPreset) {
  try {
    return symbolGenerator(preset.metocSidc, { size: 25 }).asSVG();
  } catch {
    return "";
  }
}

let drawInteraction: Draw | undefined;
let drawLayer: VectorLayer<VectorSource> | undefined;

function cancelDraw() {
  const map = mapRef.value;
  if (drawInteraction) map.removeInteraction(drawInteraction);
  if (drawLayer) map.removeLayer(drawLayer);
  drawInteraction = undefined;
  drawLayer = undefined;
  drawing.value = false;
}

function addCondition(geometry?: GeoJSON.Geometry) {
  const preset = selectedPreset.value;
  const start = new Date(startTime.value).getTime();
  const end = new Date(endTime.value).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
  scenario.environment.addCondition({
    name: preset.label,
    kind: preset.kind,
    scope: geometry ? "area" : "global",
    startTime: start,
    endTime: end,
    parameters: klona(preset.parameters),
    geometry,
    enabled: true,
    priority: 0,
    metocSidc: preset.metocSidc,
  });
}

function apply() {
  if (scope.value === "global") {
    addCondition();
    return;
  }
  const map = mapRef.value;
  cancelDraw();
  const source = new VectorSource();
  const color = selectedPreset.value.color;
  drawLayer = new VectorLayer({
    source,
    zIndex: 100,
    style: new Style({
      fill: new Fill({ color: `${color}30` }),
      stroke: new Stroke({ color, width: 2, lineDash: [7, 4] }),
    }),
  });
  map.addLayer(drawLayer);
  drawInteraction = new Draw({ source, type: geometryMode.value });
  map.addInteraction(drawInteraction);
  drawing.value = true;
  drawInteraction.once("drawend", (event) => {
    const geometry = new GeoJSON().writeGeometryObject(event.feature.getGeometry()!, {
      featureProjection: map.getView().getProjection(),
      dataProjection: "EPSG:4326",
    });
    addCondition(geometry);
    window.setTimeout(cancelDraw, 0);
  });
}

function close() {
  cancelDraw();
  toolbarStore.clearToolbar();
}

onUnmounted(cancelDraw);
</script>

<template>
  <FloatingPanel
    dir="rtl"
    class="pointer-events-auto flex max-w-[min(96vw,900px)] flex-col gap-2 rounded-xl p-2"
  >
    <div class="flex w-full rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800">
      <button
        type="button"
        class="flex-1 rounded px-2 py-1 text-[11px]"
        :class="{ 'bg-white shadow dark:bg-slate-700': activeCategory === 'atmosphere' }"
        @click="activeCategory = 'atmosphere'"
      >
        جو و هوا
      </button>
      <button
        type="button"
        class="flex-1 rounded px-2 py-1 text-[11px]"
        :class="{ 'bg-white shadow dark:bg-slate-700': activeCategory === 'terrain' }"
        @click="activeCategory = 'terrain'"
      >
        زمین
      </button>
      <button
        type="button"
        class="flex-1 rounded px-2 py-1 text-[11px]"
        :class="{
          'bg-white shadow dark:bg-slate-700': activeCategory === 'infrastructure',
        }"
        @click="activeCategory = 'infrastructure'"
      >
        راه و زیرساخت
      </button>
    </div>
    <div class="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
      <button
        v-for="preset in visiblePresets"
        :key="preset.id"
        type="button"
        class="flex min-w-16 flex-col items-center rounded-lg border px-2 py-1 text-[11px] transition"
        :class="
          selectedPresetId === preset.id
            ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-sm dark:bg-sky-950 dark:text-sky-100'
            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
        "
        @click="selectedPresetId = preset.id"
      >
        <span class="h-8 w-8" v-html="presetSvg(preset)" />
        <span class="whitespace-nowrap">{{ preset.label }}</span>
      </button>
    </div>

    <div class="flex flex-wrap items-end gap-2 border-t pt-2">
      <PersianDateTimeField v-model="startTime" label="شروع" required />
      <PersianDateTimeField v-model="endTime" label="پایان" required />
      <div class="flex rounded border p-0.5">
        <button
          type="button"
          class="flex items-center gap-1 rounded px-2 py-1.5 text-xs"
          :class="{
            'bg-sky-600 text-white': scope === 'area' && geometryMode === 'Polygon',
          }"
          @click="
            scope = 'area';
            geometryMode = 'Polygon';
          "
        >
          <AreaIcon class="size-4" /> محدوده
        </button>
        <button
          type="button"
          class="flex items-center gap-1 rounded px-2 py-1.5 text-xs"
          :class="{
            'bg-sky-600 text-white': scope === 'area' && geometryMode === 'LineString',
          }"
          @click="
            scope = 'area';
            geometryMode = 'LineString';
          "
        >
          <LineIcon class="size-4" /> مسیر
        </button>
        <button
          type="button"
          class="flex items-center gap-1 rounded px-2 py-1.5 text-xs"
          :class="{
            'bg-sky-600 text-white': scope === 'area' && geometryMode === 'Point',
          }"
          @click="
            scope = 'area';
            geometryMode = 'Point';
          "
        >
          <PointIcon class="size-4" /> نقطه
        </button>
        <button
          type="button"
          class="flex items-center gap-1 rounded px-2 py-1.5 text-xs"
          :class="{ 'bg-sky-600 text-white': scope === 'global' }"
          @click="scope = 'global'"
        >
          <GlobeIcon class="size-4" /> سراسری
        </button>
      </div>
      <button
        type="button"
        class="rounded bg-sky-600 px-3 py-2 text-xs font-medium text-white"
        @click="apply"
      >
        {{
          drawing
            ? "ترسیم را روی نقشه کامل کنید…"
            : scope === "area"
              ? "رسم و ثبت"
              : "ثبت سراسری"
        }}
      </button>
      <MainToolbarButton title="بستن" @click="close"
        ><CloseIcon class="size-5"
      /></MainToolbarButton>
    </div>
  </FloatingPanel>
</template>
