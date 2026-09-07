<script setup lang="ts">
import type { ScenarioImageLayer } from "@/types/scenarioGeoModels";
import { onUnmounted, ref, watch } from "vue";
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
const detailsEditMode = ref(
  (props.layer._isNew && !props.layer._isTemporary) ?? false,
);
const mapEditMode = ref(false);

const { layerTypeLabel, status, isInitialized } = useMapLayerInfo(props.layer);

watch(status, (v) => {
  if (v === "initialized" && mapEditMode.value) {
    bus.emit({ action: "zoom", id: props.layer.id });
    bus.emit({ action: "startTransform", id: props.layer.id });
  }
});

onUnmounted(() => {
  if (mapEditMode.value) {
    bus.emit({ action: "endTransform", id: props.layer.id });
  }
});

watch(
  () => props.layer.id,
  (v, previousId) => {
    if (!mapEditMode.value) return;
    bus.emit({ action: "endTransform", id: previousId });
    bus.emit({ action: "startTransform", id: v });
  },
);

function updateData(formData: ScenarioImageLayerUpdate) {
  const diff = getChangedValues({ ...formData }, props.layer);
  emit("update", diff);
  detailsEditMode.value = false;
}

function transform(action: "scaleUp" | "scaleDown" | "rotateLeft" | "rotateRight") {
  bus.emit({ action, id: props.layer.id });
}

function startMapEdit() {
  detailsEditMode.value = false;
  mapEditMode.value = true;
  if (!isInitialized.value) return;
  bus.emit({ action: "zoom", id: props.layer.id });
  bus.emit({ action: "startTransform", id: props.layer.id });
}

function endMapEdit() {
  bus.emit({ action: "endTransform", id: props.layer.id });
  mapEditMode.value = false;
}

function startDetailsEdit() {
  endMapEdit();
  detailsEditMode.value = true;
}
</script>

<template>
  <section>
    <header class="flex justify-end">
      <span class="badge">{{ layerTypeLabel }}</span>
    </header>
    <TileMapLayerSettingsForm
      v-if="detailsEditMode"
      :key="layer.id"
      :layer="layer"
      @cancel="detailsEditMode = false"
      @update="updateData"
    />
    <div v-else>
      <div
        v-if="mapEditMode"
        class="mb-4 rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900"
      >
        حالت ویرایش روی نقشه فعال است. برای جابه‌جایی، داخل تصویر را بکشید؛
        برای تغییر اندازه، دستگیره‌های گوشه را بکشید و برای چرخش از دستگیرهٔ
        گرد بیرون کادر استفاده کنید.
      </div>
      <div
        v-else-if="layer.requiresPlacement"
        class="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
      >
        این کالک هنوز جانمایی نشده است. دکمهٔ «ویرایش روی نقشه» را بزنید و
        محل، اندازه و زاویهٔ آن را تنظیم کنید.
      </div>
      <DescriptionItem label="URL تصویر"
        ><span class="break-all">{{ layer.url || "تنظیم نشده" }}</span></DescriptionItem
      >
      <DescriptionItem label="منابع" class="mt-4"
        ><span class="break-all">{{
          layer.attributions || "تنظیم نشده"
        }}</span></DescriptionItem
      >
      <div v-if="mapEditMode" class="mt-4 grid grid-cols-2 gap-2">
        <BaseButton small type="button" @click="transform('scaleUp')">
          بزرگ‌تر
        </BaseButton>
        <BaseButton small type="button" @click="transform('scaleDown')">
          کوچک‌تر
        </BaseButton>
        <BaseButton small type="button" @click="transform('rotateRight')">
          چرخش ۹۰ درجه راست
        </BaseButton>
        <BaseButton small type="button" @click="transform('rotateLeft')">
          چرخش ۹۰ درجه چپ
        </BaseButton>
      </div>
      <footer class="mt-4 flex flex-wrap justify-end gap-2 pb-1">
        <BaseButton
          v-if="mapEditMode"
          primary
          small
          type="button"
          @click="endMapEdit"
        >
          پایان ویرایش
        </BaseButton>
        <template v-else>
          <BaseButton secondary small type="button" @click="startDetailsEdit">
            ویرایش مشخصات
          </BaseButton>
          <BaseButton
            primary
            small
            type="button"
            :disabled="!isInitialized"
            @click="startMapEdit"
          >
            ویرایش روی نقشه
          </BaseButton>
        </template>
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
