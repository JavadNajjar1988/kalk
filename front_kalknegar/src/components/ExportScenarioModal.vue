<template>
  <NewSimpleModal
    v-model="open"
    dialog-title="صادرات سناریو"
    @cancel="onCancel"
    class="sm:max-w-xl md:max-w-4xl"
  >
    <p class="mt-1 text-sm text-gray-500">
      صادرات داده‌های سناریو برای استفاده در نرم‌افزارها و ابزارهای دیگر
    </p>
    <form @submit.prevent="onExport" class="mt-4 space-y-6">
      <SimpleSelect
        label="انتخاب فرمت صادرات"
        :items="formatItems"
        v-model="form.format"
      >
        <template #hint>
          <DocLink href="https://docs.orbat-mapper.app/guide/export-data" />
        </template>
      </SimpleSelect>
      <div class="text-sm text-gray-700">
        <p v-if="isKml">
          KML فرمت فایلی است که برای نمایش داده در مرورگرهای زمین مانند گوگل ارث استفاده می‌شود. اگر می‌خواهید آیکون واحدها را شامل کنید از KMZ استفاده کنید.
        </p>
        <p v-else-if="isKmz">
          KMZ نسخه فشرده‌شده KML است. از این فرمت استفاده کنید اگر می‌خواهید آیکون واحدها را شامل کنید.
        </p>
      </div>
      <ExportSettingsXlsx v-if="format === 'xlsx'" :format="format" v-model="form" />
      <ExportSettingsSpatialIllusions
        v-else-if="format === 'unitgenerator'"
        :format="format"
        v-model="form"
      />
      <ExportSettingsOrbatMapper v-else-if="format === 'orbatmapper'" v-model="form" />
      <ExportSettingsGeoJson
        v-else-if="format === 'geojson'"
        :format="format"
        v-model="form"
      />
      <template v-else>
        <fieldset class="space-y-4">
          <InputCheckbox
            label="شامل واحدها"
            description="واحدهایی که در زمان فعلی سناریو موقعیت دارند"
            v-model="form.includeUnits"
          />
          <InputCheckbox
            v-if="!isMilx"
            label="شامل ویژگی‌های سناریو"
            v-model="form.includeFeatures"
            description=""
          />
          <InputCheckbox
            v-if="isKml || isKmz"
            label="استفاده از نام‌های کوتاه واحد"
            v-model="form.useShortName"
          />
          <InputCheckbox
            v-if="isKml || isKmz || isMilx"
            :label="isMilx ? 'استفاده از یک لایه برای هر طرف' : 'استفاده از یک پوشه برای هر طرف'"
            v-model="form.oneFolderPerSide"
          />
          <InputCheckbox
            v-if="isKmz"
            label="شامل آیکون واحدها"
            v-model="form.embedIcons"
            description="جاسازی آیکون‌ها به صورت تصویر"
          />
        </fieldset>
      </template>

      <p v-if="isKmz || isKml" class="text-sm text-gray-700">
        لطفا توجه داشته باشید که قابلیت صادرات آزمایشی است. صادرات ویژگی‌های سناریو در حال حاضر محدود به هندسه‌ها است (بدون استایل).
      </p>

      <p v-if="isMilx" class="text-sm text-gray-700">
        لطفا توجه داشته باشید که صادرات MilX آزمایشی است. در حال حاضر محدود است و دارای باگ‌هایی می‌باشد.
      </p>

      <footer class="flex items-center justify-between space-x-2">
        <ToggleField v-model="store.keepOpen">نگه داشتن دیالوگ باز پس از صادرات</ToggleField>
        <div class="flex items-center space-x-2">
          <Button type="submit" size="sm">صادرات</Button>
          <Button variant="outline" size="sm" @click="onCancel">لغو</Button>
        </div>
      </footer>
    </form>
  </NewSimpleModal>
</template>

<script setup lang="ts">
import { useFocusOnMount } from "@/components/helpers";
import SimpleModal from "./SimpleModal.vue";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { type SelectItem } from "@/components/types";
import { computed, ref } from "vue";
import InputCheckbox from "@/components/InputCheckbox.vue";
import type { ExportFormat, ExportSettings } from "@/types/convert";
import { useScenarioExport } from "@/composables/scenarioExport";
import { useNotifications } from "@/composables/notifications";
import NProgress from "nprogress";
import { useVModel } from "@vueuse/core";
import ExportSettingsXlsx from "@/components/ExportSettingsXlsx.vue";
import ExportSettingsSpatialIllusions from "@/components/ExportSettingsSpatialIllusions.vue";
import ExportSettingsGeoJson from "@/components/ExportSettingsGeoJson.vue";
import DocLink from "@/components/DocLink.vue";
import ExportSettingsOrbatMapper from "@/components/ExportSettingsOrbatMapper.vue";

import ToggleField from "@/components/ToggleField.vue";
import { useExportStore } from "@/stores/importExportStore";
import { Button } from "@/components/ui/button";
import NewSimpleModal from "@/components/NewSimpleModal.vue";

const props = withDefaults(defineProps<{ modelValue: boolean }>(), { modelValue: false });
const emit = defineEmits(["update:modelValue", "cancel"]);
const {
  downloadAsGeoJSON,
  downloadAsKML,
  downloadAsKMZ,
  downloadAsXlsx,
  downloadAsMilx,
  downloadAsSpatialIllusions,
  downloadAsOrbatMapper,
} = useScenarioExport();
const open = useVModel(props, "modelValue", emit);
const store = useExportStore();
const formatItems: SelectItem<ExportFormat>[] = [
  { label: "نقشه‌کش آرایش نبرد", value: "orbatmapper" },
  { label: "GeoJSON", value: "geojson" },
  { label: "KML", value: "kml" },
  { label: "KMZ", value: "kmz" },
  { label: "XLSX", value: "xlsx" },
  { label: "MilX", value: "milx" },
  { label: "سازنده آرایش نبرد Spatial Illusions", value: "unitgenerator" },
];

interface Form extends ExportSettings {
  format: ExportFormat;
}

const form = ref<Form>({
  format: store.currentFormat ?? "orbatmapper",
  includeFeatures: false,
  includeUnits: true,
  sideGroups: [],
  fileName: "scenario.json",
  embedIcons: true,
  useShortName: true,
  oneSheetPerSide: true,
  columns: [],
  oneFolderPerSide: true,
  customColors: true,
  rootUnit: "",
  maxLevels: 3,
  includeIdInProperties: false,
  includeId: true,
});

const { focusId } = useFocusOnMount(undefined, 150);
const { send } = useNotifications();

const format = computed(() => form.value.format);
const isGeojson = computed(() => form.value.format === "geojson");
const isKml = computed(() => form.value.format === "kml");
const isKmz = computed(() => form.value.format === "kmz");
const isMilx = computed(() => form.value.format === "milx");

async function onExport(e: Event) {
  const { format } = form.value;
  NProgress.start();
  if (format === "geojson") {
    await downloadAsGeoJSON(form.value);
  } else if (format === "kml") {
    await downloadAsKML(form.value);
  } else if (format === "kmz") {
    await downloadAsKMZ(form.value);
  } else if (format === "xlsx") {
    await downloadAsXlsx(form.value);
  } else if (format === "milx") {
    await downloadAsMilx(form.value);
  } else if (format === "unitgenerator") {
    await downloadAsSpatialIllusions(form.value);
  } else if (format === "orbatmapper") {
    downloadAsOrbatMapper(form.value);
  }
  NProgress.done();
  if (!store.keepOpen) open.value = false;
  store.currentFormat = format;
  send({ message: `سناریو به فرمت ${format} صادر شد` });
}

function onCancel() {
  open.value = false;
  store.currentFormat = format.value;
  emit("cancel");
}
</script>
