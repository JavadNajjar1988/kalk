<template>
  <div>
    <p class="text-xs font-medium tracking-wider text-gray-500 uppercase">لایه‌های پایه</p>

    <BaseLayerSwitcher
      class="mt-4"
      :settings="baseLayers"
      v-model="activeBaseLayer"
      @update:layer-opacity="updateOpacity"
    />

    <p class="mt-4 text-xs font-medium tracking-wider text-gray-500 uppercase">
      لایه‌های دیگر
    </p>

    <div class="layers-panel-container mt-4 overflow-hidden rounded-2xl border backdrop-blur-md shadow-sm">
      <ul class="layers-panel-list divide-y">
        <li v-for="layer in vectorLayers" :key="layer.id" class="px-6 py-4">
          <div class="flex items-center justify-between">
            <p class="flex-auto truncate text-sm">{{ layer.title }}</p>
            <div class="ml-2 flex shrink-0 items-center">
              <OpacityInput
                :model-value="layer.opacity"
                @update:model-value="updateOpacity(layer, $event)"
              />
              <button class="ml-4 h-5 w-5 text-gray-500" @click="toggleLayer(layer)">
                <EyeIcon v-if="layer.visible" />
                <EyeSlashIcon v-else />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, inject, markRaw, ref, shallowRef, watch } from "vue";
import { activeScenarioKey } from "@/components/injects";
import { useGeoStore } from "@/stores/geoStore";
import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import LayerGroup from "ol/layer/Group";
import { PhEye as EyeIcon, PhEyeSlash as EyeSlashIcon } from "@phosphor-icons/vue";
import BaseLayerSwitcher from "./BaseLayerSwitcher.vue";
import type { AnyTileLayer, AnyVectorLayer } from "@/geo/types";
import TileSource from "ol/source/Tile";
import OpacityInput from "./OpacityInput.vue";
import { getUid } from "ol";
import { type LayerType } from "@/modules/scenarioeditor/featureLayerUtils";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";
import ImageLayer from "ol/layer/Image";

export interface LayerInfo<T extends BaseLayer = BaseLayer> {
  id: string;
  name: string;
  title: string;
  visible: boolean;
  zIndex: number;
  opacity: number;
  layer: T;
  subLayers?: LayerInfo<T>[];
  description?: string;
  layerType?: LayerType | "baselayer";
}

const geoStore = useGeoStore();
const mapSettings = useMapSettingsStore();
/** در ادیتور سناریو، تغییر لایهٔ پایه باید در state سناریو هم بنشیند تا سینک زنده با شبیه‌ساز (Cesium) کار کند. */
const activeScenario = inject(activeScenarioKey, null);
let tileLayers = ref<LayerInfo<TileLayer<TileSource>>[]>([]);
let vectorLayers = ref<LayerInfo<AnyVectorLayer>[]>([]);
let activeBaseLayer = shallowRef<LayerInfo<TileLayer<TileSource>>>();

const noneLayer = { title: "هیچکدام", id: null, description: "", opacity: -1, name: "هیچکدام" };
const baseLayers = computed(() => {
  const l = tileLayers.value
    .map((l) => ({ ...l, name: l.title, description: "" }))
    .filter((l) => l.layerType === "baselayer");
  // @ts-ignore
  l.push(noneLayer);
  return l;
});

watch(
  () => geoStore.olMap,
  (v) => v && updateLayers(),
  { immediate: true },
);

watch(activeBaseLayer, (layerInfo) => {
  if (!layerInfo) return;
  mapSettings.baseLayerName = layerInfo.layer?.get("name") || "هیچکدام";
  const rawName = layerInfo.layer?.get("name") as string | undefined;
  const baseMapId = rawName && rawName !== "هیچکدام" ? rawName : "None";
  activeScenario?.store?.update((s) => {
    s.mapSettings.baseMapId = baseMapId;
  });
  baseLayers.value.forEach((l) => {
    const isVisible = l.name === layerInfo.name;
    //l.layer.setOpacity(layerInfo.opacity);
    l.visible = isVisible;
    if (l.layer) l.layer.setVisible(isVisible);
  });
});

function updateLayers() {
  if (!geoStore.olMap) return;

  const transformLayer = (layer: BaseLayer): LayerInfo => {
    const l: LayerInfo = {
      id: getUid(layer),
      title: layer.get("title") || layer.get("name"),
      name: layer.get("name"),
      layerType: layer.get("layerType"),
      visible: layer.getVisible(),
      zIndex: layer.getZIndex() || 0,
      opacity: layer.getOpacity(),
      layer: markRaw(layer),
      subLayers: [],
    };
    if (layer instanceof LayerGroup) {
      l.subLayers = layer
        .getLayers()
        .getArray()
        .filter((l) => l.get("title"))
        .map(transformLayer);
    }
    return l;
  };

  const mappedLayers = geoStore.olMap
    .getAllLayers()
    .filter((l) => l.get("title"))
    .map(transformLayer);

  tileLayers.value = mappedLayers.filter(
    ({ layer }) => layer instanceof TileLayer,
  ) as LayerInfo<AnyTileLayer>[];

  activeBaseLayer.value = baseLayers.value.filter(
    (l) => l.visible,
  )[0] as LayerInfo<AnyTileLayer>;

  vectorLayers.value = mappedLayers.filter(
    ({ layer }) =>
      layer instanceof VectorLayer ||
      layer instanceof LayerGroup ||
      layer instanceof ImageLayer,
  ) as LayerInfo<AnyVectorLayer>[];
}

const toggleLayer = (l: LayerInfo<any>) => {
  l.visible = !l.visible;
  l.layer.setOpacity(l.opacity);
  l.layer.setVisible(l.visible);
};

function updateOpacity(l: LayerInfo<any>, opacity: number) {
  l.opacity = opacity;
  l.layer.setOpacity(opacity);
}
</script>
<style scoped>
.layers-panel-container {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .layers-panel-container {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.layers-panel-list > li {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .layers-panel-list > li {
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}
</style>
