<script setup lang="ts">
import { activeScenarioKey } from "@/components/injects";
import { injectStrict } from "@/utils";
import { computed } from "vue";
import { type SelectItem } from "@/components/types";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";

const scn = injectStrict(activeScenarioKey);
const { store } = scn;
const mapSettings = useMapSettingsStore();

const baseMapItems: SelectItem[] = [
  { label: "نقشه خیابان باز", value: "osm" },
  { label: "نقشه خیابان باز (آلمان)", value: "osm-de" },
  { label: "نقشه پایه خاکستری", value: "grayBasemap" },
  { label: "نقشه توپوگرافی باز", value: "openTopoMap" },
  { label: "تصاویر ماهواره‌ای ESRI", value: "esriWorldImagery" },
  { label: "نقشه توپوگرافی نروژ", value: "kartverketTopo4" },
  { label: "بدون نقشه پایه", value: "None" },
];

const baseMap = computed({
  get: () => store.state.mapSettings.baseMapId,
  set: (value: string) => {
    store.update((s) => {
      s.mapSettings.baseMapId = value;
      mapSettings.baseLayerName = value;
    });
  },
});
</script>

<template>
  <div>
    <SimpleSelect label="نقشه پایه پیش‌فرض" :items="baseMapItems" v-model="baseMap" />
  </div>
</template>
