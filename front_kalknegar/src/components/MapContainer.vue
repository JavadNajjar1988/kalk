<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import MapEvent from "ol/MapEvent";
import OLMap from "ol/Map";
import { defaults as defaultControls } from "ol/control";
import View from "ol/View";
import "ol/ol.css";
import { type Coordinate } from "ol/coordinate";
import { fromLonLat } from "ol/proj";
import { useOlEvent } from "@/composables/openlayersHelpers";
import { createBaseLayers } from "@/geo/baseLayers";

interface Props {
  center?: Coordinate;
  zoom?: number;
  baseLayerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  // Default to Iran center for global map
  center: () => [53.6880, 32.4279],
  zoom: 6,
  baseLayerName: "osm",
});
const emit = defineEmits(["ready", "moveend"]);

const mapRoot = ref();
let olMap: OLMap;
const moveendHandler = (evt: MapEvent) => {
  emit("moveend", { view: evt.map.getView() });
};

onMounted(async () => {
  const view = new View({
    zoom: props.zoom,
    center: fromLonLat(props.center),
    showFullExtent: true,
  });
  olMap = new OLMap({
    target: mapRoot.value,
    maxTilesLoading: 200,
    layers: await createBaseLayers(view, props.baseLayerName),
    view,
    controls: defaultControls({
      attributionOptions: {
        collapsible: true,
      },
    }),
  });
  useOlEvent(olMap.on("moveend", moveendHandler));
  emit("ready", olMap);
});

onUnmounted(() => {
  olMap.setTarget(undefined);
});
</script>

<template>
  <div ref="mapRoot" class="h-full w-full" />
</template>

<style>
@reference "tailwindcss";
.ol-rotate {
  top: 5.5em;
  right: 0.5em;
}

.ol-zoom {
  @apply top-[unset] right-2 bottom-12 left-[unset] sm:bottom-10;
}

.ol-zoom-in,
.ol-zoom-out {
  @apply border shadow-lg;
  border-radius: 12px;
  background-color: rgba(236, 254, 255, 0.25);
  border-color: rgba(34, 211, 238, 0.5);
  color: rgb(21, 94, 117);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition: all 0.2s ease;
}

.dark .ol-zoom-in,
.dark .ol-zoom-out {
  background-color: rgba(6, 78, 59, 0.25);
  border-color: rgba(34, 211, 238, 0.4);
  color: rgb(153, 246, 228);
}

.ol-zoom-in:hover,
.ol-zoom-out:hover {
  background-color: rgba(236, 254, 255, 0.4);
  border-color: rgba(34, 211, 238, 0.7);
  transform: scale(1.05);
}

.dark .ol-zoom-in:hover,
.dark .ol-zoom-out:hover {
  background-color: rgba(6, 78, 59, 0.4);
  border-color: rgba(34, 211, 238, 0.6);
}

.ol-attribution {
  @apply border shadow-lg;
  border-radius: 12px;
  background-color: rgba(236, 254, 255, 0.25);
  border-color: rgba(34, 211, 238, 0.5);
  color: rgb(21, 94, 117);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition: all 0.2s ease;
}

.dark .ol-attribution {
  background-color: rgba(6, 78, 59, 0.25);
  border-color: rgba(34, 211, 238, 0.4);
  color: rgb(153, 246, 228);
}
</style>
