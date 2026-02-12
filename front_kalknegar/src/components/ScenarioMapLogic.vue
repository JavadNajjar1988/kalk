<script setup lang="ts">
import OLMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import { computed, onUnmounted, shallowRef, watch } from "vue";
import Select from "ol/interaction/Select";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import "@/modules/tactical-symbol-map/epsg";
import { useUiStore } from "@/stores/uiStore";
import {
  useGeoStore,
  useMeasurementsStore,
  useUnitSettingsStore,
} from "@/stores/geoStore";
import { useSettingsStore, useSymbolSettingsStore } from "@/stores/settingsStore";
import { storeToRefs } from "pinia";
import {
  calculateZoomToResolution,
  useMapDrop,
  useMoveInteraction,
  useUnitLayer,
  useUnitSelectInteraction,
} from "@/composables/geoUnitLayers";
import LayerGroup from "ol/layer/Group";
import { useScenarioMapLayers } from "@/modules/scenarioeditor/scenarioMapLayers";
import { useScenarioFeatureSelect } from "@/modules/scenarioeditor/featureLayerUtils";
import { useMapSelectStore } from "@/stores/mapSelectStore";
import { useMapHover } from "@/composables/geoHover";
import { saveMapAsPng, useOlEvent } from "@/composables/openlayersHelpers";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";
import { useShowLocationControl } from "@/composables/geoShowLocation";
import { useShowScaleLine } from "@/composables/geoScaleLine";
import { ObjectEvent } from "ol/Object";
import { clearUnitStyleCache } from "@/geo/unitStyles";
import { useRangeRingsLayer } from "@/composables/geoRangeRings";
import { useUnitHistory } from "@/composables/geoUnitHistory";
import { useDayNightLayer } from "@/composables/geoDayNight";
import { useScenarioEvents } from "@/modules/scenarioeditor/scenarioEvents";
import { useSearchActions } from "@/composables/searchActions";
import { useScenarioFeatureLayers } from "@/modules/scenarioeditor/scenarioFeatureLayers";
import { useSelectedItems } from "@/stores/selectedStore";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import tacticalInteractions from "@/modules/tactical-symbol-map/ol/interaction";
import vectorSources from "@/modules/tactical-symbol-map/components/map/vectorSources";
import createLayerStyles from "@/modules/tactical-symbol-map/components/map/layerStyles";
import createVectorLayers from "@/modules/tactical-symbol-map/components/map/vectorLayers";
import registerEventHandlers from "@/modules/tactical-symbol-map/components/map/eventHandlers";

const props = defineProps<{ olMap: OLMap }>();
const emit = defineEmits<{
  (
    e: "map-ready",
    value: {
      olMap: OLMap;
      featureSelectInteraction: Select;
      unitSelectInteraction: Select;
    },
  ): void;
}>();

const {
  geo,
  store: { state },
} = injectStrict(activeScenarioKey);

const mapRef = shallowRef<OLMap>();

const uiStore = useUiStore();
const doNotFilterLayers = computed(() => uiStore.layersPanelActive);
const unitSettingsStore = useUnitSettingsStore();
const geoStore = useGeoStore();
const settingsStore = useSettingsStore();
const symbolSettings = useSymbolSettingsStore();
const { moveUnitEnabled } = storeToRefs(useUnitSettingsStore());
const { measurementUnit } = storeToRefs(useMeasurementsStore());
const { unitLayer, drawUnits } = useUnitLayer();

const { onScenarioAction } = useSearchActions();

const { isDragging, formattedPosition } = useMapDrop(mapRef, unitLayer);

const olMap = props.olMap;
mapRef.value = olMap;
geoStore.olMap = olMap;

calculateZoomToResolution(olMap.getView());

const unitLayerGroup = new LayerGroup({
  layers: [unitLayer],
});

unitLayerGroup.set("title", "Units");

const { showHistory, editHistory, showWaypointTimestamps } =
  storeToRefs(unitSettingsStore);
const { unitSelectEnabled, featureSelectEnabled, hoverEnabled } =
  storeToRefs(useMapSelectStore());

const dayNightLayer = useDayNightLayer();
olMap.addLayer(dayNightLayer);
const { initializeFromStore: loadMapLayers } = useScenarioMapLayers(olMap);
const { initializeFeatureLayersFromStore } = useScenarioFeatureLayers(olMap);
const { rangeLayer, drawRangeRings } = useRangeRingsLayer();
// Disable temporarily
const {} = useScenarioEvents(olMap);

olMap.addLayer(rangeLayer);
const { historyLayer, drawHistory, historyModify, waypointSelect, ctrlClickInteraction } =
  useUnitHistory(olMap, {
    showHistory,
    editHistory,
    showWaypointTimestamps,
  });

useMapHover(olMap, { enable: hoverEnabled });

olMap.addLayer(historyLayer);
olMap.addLayer(unitLayerGroup);

const {
  unitSelectInteraction,
  boxSelectInteraction,
  redraw: redrawSelectedUnits,
} = useUnitSelectInteraction([unitLayer], olMap, {
  enable: unitSelectEnabled,
});

const { selectedFeatureIds } = useSelectedItems();
const servicesStore = useServicesStore();
const tacticalInteractionReady = shallowRef(false);
const tacticalLayersReady = shallowRef(false);

// Order of select interactions is important. The interaction that is added last
// will be the one that receives the select event first and can stop the propagation.
olMap.addInteraction(unitSelectInteraction);
olMap.addInteraction(boxSelectInteraction);
olMap.addInteraction(waypointSelect);

olMap.addInteraction(historyModify);
olMap.addInteraction(ctrlClickInteraction);
const { selectInteraction: featureSelectInteraction } = useScenarioFeatureSelect(olMap, {
  enable: featureSelectEnabled,
});

const { moveInteraction: moveUnitInteraction } = useMoveInteraction(
  olMap,
  unitLayer,
  moveUnitEnabled,
);

useOlEvent(unitLayerGroup.on("change:visible", toggleMoveUnitInteraction));
olMap.addInteraction(moveUnitInteraction);

const scenarioInteractions = [
  unitSelectInteraction,
  boxSelectInteraction,
  waypointSelect,
  historyModify,
  ctrlClickInteraction,
  featureSelectInteraction,
  moveUnitInteraction,
];

const setScenarioInteractionsActive = (active: boolean) => {
  scenarioInteractions.forEach((interaction) => {
    if (interaction && typeof interaction.setActive === "function") {
      interaction.setActive(active);
    }
  });
};

const { showLocation, coordinateFormat, showScaleLine } =
  storeToRefs(useMapSettingsStore());

useShowLocationControl(olMap, {
  coordinateFormat,
  enable: showLocation,
});

useShowScaleLine(olMap, {
  enabled: showScaleLine,
  measurementUnits: measurementUnit,
});

drawRangeRings();
drawUnits();
drawHistory();

loadMapLayers();
initializeFeatureLayersFromStore();
//loadScenarioLayers();

const extent = unitLayer.getSource()?.getExtent();
if (extent && !unitLayer.getSource()?.isEmpty())
  olMap.getView().fit(extent, { padding: [100, 100, 150, 100], maxZoom: 16 });

function toggleMoveUnitInteraction(event: ObjectEvent) {
  const isUnitLayerVisible = !event.oldValue;
  moveUnitInteraction.setActive(isUnitLayerVisible && moveUnitEnabled.value);
}

emit("map-ready", { olMap, featureSelectInteraction, unitSelectInteraction });

watch(
  () => servicesStore.getServices(),
  async (services) => {
    if (
      !services?.store ||
      !services?.featureStore ||
      !services?.emitter ||
      !services?.sessionStore ||
      !services?.selection ||
      !services?.osdDriver ||
      !services?.ipcRenderer
    ) {
      return;
    }
    if (!tacticalLayersReady.value) {
      const sources = await vectorSources(services);
      const styles = createLayerStyles(services, sources);
      const vectorLayers = createVectorLayers(sources, styles);
      Object.values(vectorLayers).forEach((layer) => {
        layer.setZIndex(300);
        olMap.addLayer(layer);
      });
      registerEventHandlers({ services, sources, vectorLayers, map: olMap });
      if (!tacticalInteractionReady.value) {
        tacticalInteractions({
          hitTolerance: 3,
          map: olMap,
          services,
          sources,
          styles,
        });
        tacticalInteractionReady.value = true;
        olMap.getInteractions().on("add", ({ element }) => {
          if (element instanceof Draw) {
            setScenarioInteractionsActive(false);
          }
        });
        olMap.getInteractions().on("remove", ({ element }) => {
          if (element instanceof Draw) {
            setScenarioInteractionsActive(true);
          }
        });
      }
      tacticalLayersReady.value = true;
    }
  },
  { immediate: true },
);

function redrawUnits() {
  drawUnits();
  drawHistory();
  redrawSelectedUnits();
  drawRangeRings();
}

watch(geo.everyVisibleUnit, () => redrawUnits(), { deep: true });

watch([settingsStore, symbolSettings], () => {
  clearUnitStyleCache();
  drawUnits();
});

watch(
  [() => state.currentTime, doNotFilterLayers, () => state.featureStateCounter],
  () => {
    initializeFeatureLayersFromStore({
      doClearCache: false,
      filterVisible: !doNotFilterLayers.value,
    });
    // trigger redraw of selected features
    if (selectedFeatureIds.value.size > 0) {
      const ids = Array.from(selectedFeatureIds.value);
      selectedFeatureIds.value.clear();
      for (const id of ids) {
        selectedFeatureIds.value.add(id);
      }
    }
  },
);

onUnmounted(() => {
  geoStore.olMap = undefined;
  clearUnitStyleCache();
});

onScenarioAction(async (e) => {
  if (e.action === "exportToImage") {
    await saveMapAsPng(olMap);
  }
});
</script>

<template>
  <div
    v-if="isDragging"
    class="pointer-events-none absolute inset-0 border-4 border-dashed border-blue-700"
  >
    <p
      class="absolute bottom-1 left-2 rounded bg-white px-1 text-base tracking-tighter text-gray-800 tabular-nums"
    >
      {{ formattedPosition }}
    </p>
  </div>
</template>
