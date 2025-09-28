<template>
  <div>
    <BaseToolbar class="shadow-sm">
      <ToolbarButton
        start
        :end="!enableMeasurements"
        title="تبدیل اندازه‌گیری"
        @click="toggleMeasurements()"
      >
        <Ruler class="h-5 w-5" :class="enableMeasurements && 'text-gray-900'" />
      </ToolbarButton>
      <template v-if="enableMeasurements">
        <ToolbarButton
          @click="measurementType = 'LineString'"
          :active="measurementType === 'LineString'"
        >
          <Polyline class="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          @click="measurementType = 'Polygon'"
          :active="measurementType === 'Polygon'"
        >
          <Polygon class="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          title="پاک کردن اندازه‌گیری‌های قبلی"
          @click="clearPrevious = !clearPrevious"
          :active="!clearPrevious"
        >
          <SelectionAll class="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton
          title="نمایش طول قطعات"
          @click="showSegments = !showSegments"
          :active="showSegments"
        >
          <Path class="h-5 w-5" />
        </ToolbarButton>
        <ToolbarButton end @click="clear()">
          <Trash class="h-5 w-5" />
        </ToolbarButton>
      </template>
    </BaseToolbar>
  </div>
</template>

<script setup lang="ts">
import { PhTrash as Trash } from "@phosphor-icons/vue";

import {
  PhPath as Path,
  PhRuler as Ruler,
  PhSelectionAll as SelectionAll,
  PhPolygon as Polygon,
  PhLineSegments as Polyline,
} from "@phosphor-icons/vue";
import BaseToolbar from "./BaseToolbar.vue";
import ToolbarButton from "./ToolbarButton.vue";
import OLMap from "ol/Map";
import { useMeasurementInteraction } from "@/composables/geoMeasurement";
import { watch } from "vue";
import { type Fn, onKeyDown, useToggle } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useMeasurementsStore } from "@/stores/geoStore";
import { useUiStore } from "@/stores/uiStore";

const props = defineProps<{ olMap: OLMap }>();
const { showSegments, clearPrevious, measurementType, measurementUnit } =
  storeToRefs(useMeasurementsStore());

const uiStore = useUiStore();
uiStore.measurementActive = false;
const [enableMeasurements, toggleMeasurements] = useToggle(false);

const { clear } = useMeasurementInteraction(props.olMap, measurementType, {
  showSegments,
  clearPrevious,
  enable: enableMeasurements,
  measurementUnit,
});

let fn: Fn;
watch(enableMeasurements, (enabled) => {
  if (enabled) {
    uiStore.measurementActive = true;
    fn = onKeyDown("Escape", (event) => {
      enableMeasurements.value = false;
    });
  } else {
    uiStore.measurementActive = false;
    fn();
    clear();
  }
});
</script>
