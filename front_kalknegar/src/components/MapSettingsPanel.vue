<template>
  <div class="space-y-4 py-4">
    <section class="bg-card rounded-xl border p-4 shadow-sm">
      <h3 class="text-foreground text-sm font-semibold">اجزای رابط نقشه</h3>
      <p class="text-muted-foreground mt-1 text-xs leading-5">
        مواردی را که هنگام کار با نقشه لازم دارید روشن یا خاموش کنید.
      </p>
      <div class="mt-3 space-y-2">
        <CheckboxField v-model="uiSettings.showToolbar">نمایش نوار ابزار</CheckboxField>
        <CheckboxField v-model="uiSettings.showTimeline">نمایش خط زمان</CheckboxField>
        <CheckboxField v-model="uiSettings.showOrbatBreadcrumbs">
          نمایش مسیر آرایش نبرد
        </CheckboxField>
        <CheckboxField v-model="settings.showScaleLine">نمایش خط مقیاس</CheckboxField>
        <CheckboxField v-model="settings.showLocation">
          نمایش موقعیت نشانگر ماوس
        </CheckboxField>
      </div>
    </section>

    <section class="bg-card rounded-xl border p-4 shadow-sm">
      <h3 class="text-foreground text-sm font-semibold">مختصات و اندازه‌گیری</h3>
      <div class="mt-4 space-y-5">
        <div>
          <p class="text-foreground mb-2 text-sm font-medium">فرمت مختصات</p>
          <RadioGroupList
            v-model="settings.coordinateFormat"
            :items="coordinateFormatItems"
          />
        </div>
        <div>
          <p class="text-foreground mb-2 text-sm font-medium">واحد اندازه‌گیری</p>
          <RadioGroupList
            v-model="measurementStore.measurementUnit"
            :items="measurementItems"
          />
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import CheckboxField from "@/components/CheckboxField.vue";
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
