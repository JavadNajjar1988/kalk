<script setup lang="ts">
import { computed } from "vue";
import type { SimpleStyleSpec, TextStyleSpec } from "@/geo/simplestyle";
import type { ScenarioFeature } from "@/types/scenarioGeoModels";
import ToggleField from "@/components/ToggleField.vue";
import SimpleSelect from "@/components/SimpleSelect.vue";
import NumberInputGroup from "@/components/NumberInputGroup.vue";
import ZoomSelector from "@/components/ZoomSelector.vue";

const props = defineProps<{ feature: ScenarioFeature }>();
const emit = defineEmits<{
  (e: "update", value: { style: Partial<SimpleStyleSpec> }): void;
}>();

const marker = computed((): Partial<TextStyleSpec> => {
  const { style } = props.feature;
  return {
    showLabel: style["showLabel"] ?? false,
    "text-placement": style["text-placement"] || "point",
    "text-align": style["text-align"] || "center",
    "text-offset-x": style["text-offset-x"] ?? 15,
    "text-offset-y": style["text-offset-y"] ?? 0,
    textMinZoom: style["textMinZoom"] ?? 0,
    textMaxZoom: style["textMaxZoom"] ?? 24,
  };
});

const placements = [
  { label: "نقطه", value: "point" },
  { label: "خط", value: "line" },
];

const align = [
  { label: "چپ", value: "left" },
  { label: "وسط", value: "center" },
  { label: "راست", value: "right" },
  { label: "شروع", value: "start" },
  { label: "پایان", value: "end" },
];

const range = computed({
  get: (): [number, number] => [
    marker.value.textMinZoom ?? 0,
    marker.value.textMaxZoom ?? 24,
  ],
  set: (v) => {
    emit("update", { style: { textMinZoom: +v[0], textMaxZoom: +v[1] } });
  },
});

function updateValue(
  name: keyof TextStyleSpec,
  value?: boolean | number | string | null,
) {
  emit("update", { style: { [name]: value } });
}
</script>
<template>
  <div class="col-span-2 -mb-6 font-semibold">متن</div>
  <div class="self-end">برچسب</div>
  <ToggleField
    class="mt-4"
    :model-value="marker['showLabel']"
    @update:model-value="updateValue('showLabel', $event)"
  />
  <template v-if="marker.showLabel">
    <div>سطوح زوم</div>
    <ZoomSelector v-model="range" class="mt-4 flex-auto" />
    <div class="self-center">محل قرارگیری</div>
    <SimpleSelect
      :model-value="marker['text-placement']"
      @update:model-value="updateValue('text-placement', $event)"
      :items="placements"
      class="max-w-[10rem]"
    >
    </SimpleSelect>
    <div class="self-center">تراز</div>
    <SimpleSelect
      :model-value="marker['text-align']"
      @update:model-value="updateValue('text-align', $event)"
      :items="align"
      class="max-w-[10rem]"
    />
    <div class="self-center">افست X</div>
    <NumberInputGroup
      :model-value="marker['text-offset-x']"
      @update:model-value="updateValue('text-offset-x', $event)"
      class="max-w-[10rem]"
    />
    <div class="self-center">افست Y</div>
    <NumberInputGroup
      :model-value="marker['text-offset-y']"
      @update:model-value="updateValue('text-offset-y', $event)"
      class="max-w-[10rem]"
    />
  </template>
</template>
