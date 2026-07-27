<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { PhX as CloseIcon, PhPolygon as AreaIcon, PhGlobe as GlobeIcon } from "@phosphor-icons/vue";
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
import {
  ENVIRONMENT_PRESETS,
  type EnvironmentPreset,
} from "./environmentPresets";

const toolbarStore = useMainToolbarStore();
const scenario = injectStrict(activeScenarioKey);
const mapRef = injectStrict(activeMapKey);
const selectedPresetId = ref("rain");
const scope = ref<"global" | "area">("area");
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

function presetSvg(preset: EnvironmentPreset) {
  if (!preset.metocSidc) return "";
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
  drawInteraction = new Draw({ source, type: "Polygon" });
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
    <div class="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
      <button
        v-for="preset in ENVIRONMENT_PRESETS"
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
        <span v-if="preset.metocSidc" class="h-8 w-8" v-html="presetSvg(preset)" />
        <span v-else class="text-2xl leading-8">{{ preset.emoji }}</span>
        <span class="whitespace-nowrap">{{ preset.label }}</span>
      </button>
    </div>

    <div class="flex flex-wrap items-end gap-2 border-t pt-2">
      <label class="text-muted-foreground text-[11px]">
        شروع
        <input v-model="startTime" type="datetime-local" class="mt-0.5 block rounded border bg-transparent p-1.5 text-xs" />
      </label>
      <label class="text-muted-foreground text-[11px]">
        پایان
        <input v-model="endTime" type="datetime-local" class="mt-0.5 block rounded border bg-transparent p-1.5 text-xs" />
      </label>
      <div class="flex rounded border p-0.5">
        <button type="button" class="flex items-center gap-1 rounded px-2 py-1.5 text-xs" :class="{ 'bg-sky-600 text-white': scope === 'area' }" @click="scope = 'area'"><AreaIcon class="size-4" /> محدوده</button>
        <button type="button" class="flex items-center gap-1 rounded px-2 py-1.5 text-xs" :class="{ 'bg-sky-600 text-white': scope === 'global' }" @click="scope = 'global'"><GlobeIcon class="size-4" /> سراسری</button>
      </div>
      <button type="button" class="rounded bg-sky-600 px-3 py-2 text-xs font-medium text-white" @click="apply">
        {{ drawing ? "چندضلعی را روی نقشه کامل کنید…" : scope === "area" ? "رسم و ثبت" : "ثبت سراسری" }}
      </button>
      <MainToolbarButton title="بستن" @click="close"><CloseIcon class="size-5" /></MainToolbarButton>
    </div>
  </FloatingPanel>
</template>
