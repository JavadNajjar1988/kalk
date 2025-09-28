<script setup lang="ts">
import type { ExportFormat, GeoJsonSettings } from "@/types/convert";
import InputCheckbox from "@/components/InputCheckbox.vue";
import { useVModel } from "@vueuse/core";
import { type Ref } from "vue";

interface Props {
  modelValue: GeoJsonSettings;
  format: ExportFormat;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);
// Adding a typecast here because PyCharm does not infer the correct type automatically
const settings = useVModel(props, "modelValue", emit) as Ref<GeoJsonSettings>;
</script>

<template>
  <fieldset class="space-y-4">
    <InputCheckbox
      label="شامل واحدها"
      description="واحدهایی که در زمان فعلی سناریو موقعیت دارند"
      v-model="settings.includeUnits"
    />
    <InputCheckbox
      label="شامل ویژگی‌های سناریو"
      v-model="settings.includeFeatures"
      description=""
    />

    <InputCheckbox v-model="settings.includeId" label="شامل شناسه" /><InputCheckbox
      v-model="settings.includeIdInProperties"
      label="شامل شناسه در ویژگی‌ها"
    />
  </fieldset>
</template>
