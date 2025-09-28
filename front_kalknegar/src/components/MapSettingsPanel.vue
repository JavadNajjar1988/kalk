<template>
  <div class="space-y-4 p-1">
    <ToggleField v-model="uiSettings.showToolbar">نمایش نوار ابزار</ToggleField>
    <ToggleField v-model="uiSettings.showTimeline">نمایش خط زمان</ToggleField>
    <ToggleField v-model="uiSettings.showOrbatBreadcrumbs"
      >نمایش مسیر آرایش نبرد</ToggleField
    >
    <ToggleField v-model="settings.showScaleLine">نمایش خط مقیاس</ToggleField>
    <ToggleField v-model="settings.showLocation"
      >نمایش موقعیت نشانگر ماوس
    </ToggleField>
    <section>
      <p class="text-base leading-loose font-medium text-gray-900">فرمت مختصات</p>
      <RadioGroupList
        v-model="settings.coordinateFormat"
        :items="coordinateFormatItems"
      />
    </section>

    <section>
      <p class="text-base leading-loose font-medium text-gray-900">واحد اندازه‌گیری</p>
      <RadioGroupList
        v-model="measurementStore.measurementUnit"
        :items="measurementItems"
      />
    </section>
  </div>
</template>
<script setup lang="ts">
import ToggleField from "@/components/ToggleField.vue";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";
import type { RadioGroupItem } from "@/components/types";
import type { CoordinateFormatType } from "@/composables/geoShowLocation";
import RadioGroupList from "@/components/RadioGroupList.vue";
import { useUiStore } from "@/stores/uiStore";
import { useMeasurementsStore } from "@/stores/geoStore";
import { type MeasurementUnit } from "@/composables/geoMeasurement";

const settings = useMapSettingsStore();
const measurementStore = useMeasurementsStore();
const uiSettings = useUiStore();

const coordinateFormatItems: RadioGroupItem<CoordinateFormatType>[] = [
  { name: "DD", description: "درجه اعشاری", value: "DecimalDegrees" },
  { name: "DMS", description: "درجه دقیقه ثانیه", value: "DegreeMinuteSeconds" },
  { name: "MGRS", description: "سیستم مرجع شبکه نظامی", value: "MGRS" },
];

const measurementItems: RadioGroupItem<MeasurementUnit>[] = [
  { name: "متریک", value: "metric" },
  { name: "امپریال", value: "imperial" },
  { name: "دریایی", value: "nautical" },
];
</script>
