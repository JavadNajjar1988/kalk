<script setup lang="ts">
import { computed, ref, watch } from "vue";
import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import { nanoid } from "nanoid";

import BaseButton from "@/components/BaseButton.vue";
import InputGroup from "@/components/InputGroup.vue";
import { activeMapKey, activeScenarioKey } from "@/components/injects";
import type {
  ScenarioGeoJSONLayerUpdate,
  ScenarioKMLLayerUpdate,
} from "@/types/internalModels";
import type { ScenarioGeoJSONLayer, ScenarioKMLLayer } from "@/types/scenarioGeoModels";
import { injectStrict } from "@/utils";
import { createEditableScenarioFeatures } from "./geoJsonEditableCopy";

const props = defineProps<{
  layer: ScenarioGeoJSONLayer | ScenarioKMLLayer;
}>();
const emit = defineEmits<{
  (e: "update", value: ScenarioGeoJSONLayerUpdate | ScenarioKMLLayerUpdate): void;
}>();

const mapRef = injectStrict(activeMapKey);
const {
  geo,
  store: { groupUpdate },
} = injectStrict(activeScenarioKey);

const editMode = ref(false);
const url = ref("");
const extractStyles = ref(true);
const copyState = ref<"idle" | "copying" | "success" | "error">("idle");
const copyMessage = ref("");

watch(
  () => props.layer,
  (layer) => {
    url.value = layer.url;
    extractStyles.value =
      layer.type === "KMLLayer" ? (layer.extractStyles ?? true) : true;
    editMode.value = Boolean(layer._isNew);
    copyState.value = "idle";
    copyMessage.value = "";
  },
  { immediate: true },
);

const sourceTypeLabel = computed(() =>
  props.layer.type === "GeoJSONLayer" ? "GeoJSON" : "KML",
);

function submit() {
  const update: ScenarioGeoJSONLayerUpdate | ScenarioKMLLayerUpdate = {
    url: url.value.trim(),
    _isNew: false,
  };
  if (props.layer.type === "KMLLayer") {
    (update as ScenarioKMLLayerUpdate).extractStyles = extractStyles.value;
  }
  emit("update", update);
  editMode.value = false;
}

async function createEditableCopy() {
  if (props.layer.type !== "GeoJSONLayer" || copyState.value === "copying") return;
  copyState.value = "copying";
  copyMessage.value = "";

  try {
    const olLayer = mapRef.value
      ?.getAllLayers()
      .find((candidate) => candidate.get("id") === props.layer.id);
    const source = olLayer && "getSource" in olLayer ? olLayer.getSource() : null;
    if (!(source instanceof VectorSource)) {
      throw new Error("منبع برداری لایه هنوز آماده نیست.");
    }
    const loadedFeatures = source.getFeatures();
    if (loadedFeatures.length === 0) {
      throw new Error("این لایه عارضه بارگذاری‌شده‌ای ندارد.");
    }

    const format = new GeoJSON();
    const collection = format.writeFeaturesObject(loadedFeatures, {
      dataProjection: "EPSG:4326",
      featureProjection: mapRef.value?.getView().getProjection(),
    });
    const layerId = nanoid();
    const editableFeatures = createEditableScenarioFeatures(collection, layerId);
    if (editableFeatures.length === 0) {
      throw new Error("هندسه قابل ویرایشی در این لایه پیدا نشد.");
    }

    groupUpdate(() => {
      geo.addLayer({
        id: layerId,
        name: `${props.layer.name} - نسخه قابل ویرایش`,
        description: `نسخه سناریومحور ساخته‌شده از لایه ${props.layer.name}`,
        features: [],
        _isOpen: true,
      });
      editableFeatures.forEach((feature) => geo.addFeature(feature, layerId));
    });

    copyState.value = "success";
    copyMessage.value = `${editableFeatures.length.toLocaleString("fa-IR")} عارضه در یک لایه داخلی قابل ویرایش ساخته شد.`;
  } catch (error) {
    copyState.value = "error";
    copyMessage.value =
      error instanceof Error ? error.message : "ساخت نسخه قابل ویرایش ناموفق بود.";
  }
}
</script>

<template>
  <section class="space-y-4 p-1">
    <form v-if="editMode" class="space-y-4" @submit.prevent="submit">
      <InputGroup
        v-model="url"
        :label="`نشانی منبع ${sourceTypeLabel}`"
        type="text"
        required
      />
      <label
        v-if="layer.type === 'KMLLayer'"
        class="flex items-center justify-between gap-3 text-sm"
      >
        <span>استفاده از سبک‌های داخل فایل</span>
        <input v-model="extractStyles" type="checkbox" />
      </label>
      <footer class="flex justify-end gap-2">
        <BaseButton primary small type="submit">ذخیره تنظیمات</BaseButton>
        <BaseButton small type="button" @click="editMode = false">لغو</BaseButton>
      </footer>
    </form>

    <template v-else>
      <div>
        <p class="text-muted-foreground text-xs">نشانی منبع</p>
        <p class="mt-1 text-sm break-all">{{ layer.url || "تنظیم نشده" }}</p>
      </div>
      <div class="flex justify-end">
        <BaseButton small type="button" @click="editMode = true">ویرایش منبع</BaseButton>
      </div>
    </template>

    <div v-if="layer.type === 'GeoJSONLayer'" class="border-border border-t pt-4">
      <p class="text-sm">
        برای تغییر هندسه و ویژگی‌ها، یک نسخه داخلی در همین سناریو بسازید. منبع اصلی تغییر
        نمی‌کند.
      </p>
      <div class="mt-3 flex justify-end">
        <BaseButton
          primary
          small
          type="button"
          :disabled="copyState === 'copying'"
          @click="createEditableCopy"
        >
          {{ copyState === "copying" ? "در حال ساخت..." : "ساخت نسخه قابل ویرایش" }}
        </BaseButton>
      </div>
      <p
        v-if="copyMessage"
        class="mt-2 text-sm"
        :class="copyState === 'error' ? 'text-red-700' : 'text-green-700'"
      >
        {{ copyMessage }}
      </p>
    </div>
  </section>
</template>
