<script setup lang="ts">
import type { ScenarioImageLayer } from "@/types/scenarioGeoModels";
import { onMounted, onUnmounted, ref, watch } from "vue";
import type {
  ScenarioImageLayerUpdate,
  ScenarioMapLayerUpdate,
} from "@/types/internalModels";
import { type LayerUpdateOptions, useMapLayerInfo } from "@/composables/geoMapLayers";
import { useEventBus } from "@vueuse/core";
import { imageLayerAction } from "@/components/eventKeys";
import { getChangedValues } from "@/utils";
import DescriptionItem from "@/components/DescriptionItem.vue";
import BaseButton from "@/components/BaseButton.vue";
import TileMapLayerSettingsForm from "@/modules/scenarioeditor/TileMapLayerSettingsForm.vue";

interface Props {
  layer: ScenarioImageLayer;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  update: [d: ScenarioMapLayerUpdate, options?: LayerUpdateOptions];
}>();

const bus = useEventBus(imageLayerAction);
const editMode = ref((props.layer._isNew && !props.layer._isTemporary) ?? false);

const { layerTypeLabel, status, isInitialized } = useMapLayerInfo(props.layer);

watch(status, (v) => {
  if (v === "initialized") {
    bus.emit({ action: "zoom", id: props.layer.id });
    bus.emit({ action: "startTransform", id: props.layer.id });
  }
});

onMounted(() => {
  if (isInitialized.value) bus.emit({ action: "startTransform", id: props.layer.id });
});

onUnmounted(() => {
  bus.emit({ action: "endTransform", id: props.layer.id });
});

watch(
  () => props.layer.id,
  (v) => {
    bus.emit({ action: "endTransform", id: v });
    bus.emit({ action: "startTransform", id: v });
  },
);

function updateData(formData: ScenarioImageLayerUpdate) {
  const diff = getChangedValues({ ...formData }, props.layer);
  emit("update", diff);
  editMode.value = false;
}
</script>

<template>
  <section>
    <header class="flex justify-end">
      <span class="badge">{{ layerTypeLabel }}</span>
    </header>
    <TileMapLayerSettingsForm
      v-if="editMode"
      :key="layer.id"
      :layer="layer"
      @cancel="editMode = false"
      @update="updateData"
    />
    <div v-else>
      <DescriptionItem label="URL تصویر"
        ><span class="break-all">{{ layer.url || "تنظیم نشده" }}</span></DescriptionItem
      >
      <DescriptionItem label="منابع" class="mt-4"
        ><span class="break-all">{{
          layer.attributions || "تنظیم نشده"
        }}</span></DescriptionItem
      >
      <footer class="mt-4 flex justify-end space-x-2 pb-1">
        <BaseButton small type="button" @click="editMode = true">ویرایش</BaseButton>
      </footer>
    </div>
    <p v-if="!isInitialized" class="mt-2 text-sm text-gray-500">
      این لایه هنوز مقداردهی اولیه نشده است.
    </p>
    <p v-if="status === 'error'" class="mt-2 text-sm text-red-600">
      بارگذاری لایه ناموفق بود.
    </p>
  </section>
</template>
