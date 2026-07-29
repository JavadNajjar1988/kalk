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
import { useRecordingStore } from "@/stores/recordingStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useShowLocationControl } from "@/composables/geoShowLocation";
import { useShowScaleLine } from "@/composables/geoScaleLine";
import { ObjectEvent } from "ol/Object";
import { clearUnitStyleCache } from "@/geo/unitStyles";
import { clearUnitDensityStyleCache } from "@/geo/unitDensitySummary";
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
import { ensureScenarioTacticalServices } from "@/modules/tactical-symbol-map/services/scenarioProjectServices";
import { getPointResolution } from "ol/proj";
import { scaleLineDistanceForPointResolution } from "@/geo/unitDensitySummary";

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
const recordingStore = useRecordingStore();
const playbackStore = usePlaybackStore();
const { moveUnitEnabled } = storeToRefs(useUnitSettingsStore());
const { measurementUnit } = storeToRefs(useMeasurementsStore());
const {
  unitLayer,
  unitDensityLayer,
  refreshUnitDensityLayer,
  drawUnits,
} = useUnitLayer();

const { onScenarioAction } = useSearchActions();

const { isDragging, formattedPosition } = useMapDrop(mapRef, unitLayer);

const olMap = props.olMap;
mapRef.value = olMap;
geoStore.olMap = olMap;

calculateZoomToResolution(olMap.getView());

function refreshUnitDensityLod() {
  const view = olMap.getView();
  const resolution = view.getResolution();
  const center = view.getCenter();
  if (resolution === undefined || !center) return;

  const pointResolution = getPointResolution(
    view.getProjection(),
    resolution,
    center,
    "m",
  );
  const scaleLineDistance =
    scaleLineDistanceForPointResolution(pointResolution);
  const targetEchelon = refreshUnitDensityLayer(scaleLineDistance);
  unitLayer.setVisible(!targetEchelon);
}

useOlEvent(
  olMap
    .getView()
    .on(["change:resolution", "change:center"], refreshUnitDensityLod),
);

const unitLayerGroup = new LayerGroup({
  layers: [unitLayer, unitDensityLayer],
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
  shouldIgnoreClick: (event) => Boolean(getUnitDensityFeatureAtPixel(event.pixel)),
});

const {
  selectedFeatureIds,
  activeUnitDensitySummary,
  clear: clearSelectedItems,
} = useSelectedItems();
const servicesStore = useServicesStore();
const tacticalInteractionReady = shallowRef(false);
const tacticalLayersReady = shallowRef(false);
const tacticalServicesInitInProgress = shallowRef(false);
const tacticalTimeSyncReady = shallowRef(false);

// Order of select interactions is important. The interaction that is added last
// will be the one that receives the select event first and can stop the propagation.
olMap.addInteraction(unitSelectInteraction);
olMap.addInteraction(boxSelectInteraction);
olMap.addInteraction(waypointSelect);

olMap.addInteraction(historyModify);
olMap.addInteraction(ctrlClickInteraction);
const { selectInteraction: featureSelectInteraction } = useScenarioFeatureSelect(olMap, {
  enable: featureSelectEnabled,
  shouldIgnoreClick: (event) => Boolean(getUnitDensityFeatureAtPixel(event.pixel)),
});

const { moveInteraction: moveUnitInteraction } = useMoveInteraction(
  olMap,
  unitLayer,
  moveUnitEnabled,
);

useOlEvent(unitLayerGroup.on("change:visible", toggleMoveUnitInteraction));
useOlEvent(olMap.on("singleclick", onUnitDensitySummaryClick));
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

emit("map-ready", { olMap, featureSelectInteraction, unitSelectInteraction });

drawRangeRings();
drawUnits();
refreshUnitDensityLod();
drawHistory();

loadMapLayers();
initializeFeatureLayersFromStore();
//loadScenarioLayers();

const extent = unitLayer.getSource()?.getExtent();
if (extent && !unitLayer.getSource()?.isEmpty())
  olMap.getView().fit(extent, { padding: [100, 100, 150, 100], maxZoom: 16 });

function toggleMoveUnitInteraction(event: ObjectEvent) {
  const isUnitLayerVisible = !event.oldValue;
  moveUnitInteraction.setActive(
    isUnitLayerVisible &&
      moveUnitEnabled.value &&
      recordingStore.isRecordingLocation,
  );
}

function getUnitDensityFeatureAtPixel(pixel: any) {
  return olMap.forEachFeatureAtPixel(
    pixel,
    (candidateFeature, layer) =>
      layer === unitDensityLayer ? candidateFeature : undefined,
    {
      hitTolerance: 8,
      layerFilter: (layer) => layer === unitDensityLayer,
    },
  ) as any;
}

function onUnitDensitySummaryClick(event: any) {
  const feature = getUnitDensityFeatureAtPixel(event.pixel);
  if (!feature) return;

  const members = feature.get("features");
  if (!Array.isArray(members) || members.length < 2) return;

  const unitIds = members
    .map((member: any) => String(member.getId()))
    .filter(Boolean);
  if (unitIds.length < 2) return;

  clearSelectedItems();
  activeUnitDensitySummary.value = { unitIds };
}

watch(
  () => recordingStore.isRecordingLocation,
  (enabled) => {
    if (!enabled && moveUnitEnabled.value) {
      moveUnitEnabled.value = false;
    }
    const isUnitLayerVisible =
      typeof unitLayerGroup.getVisible === "function"
        ? unitLayerGroup.getVisible()
        : true;
    moveUnitInteraction.setActive(
      isUnitLayerVisible && moveUnitEnabled.value && enabled,
    );
  },
  { immediate: true },
);

async function ensureTacticalServicesForScenario() {
  if (tacticalServicesInitInProgress.value) {
    return;
  }

  tacticalServicesInitInProgress.value = true;
  try {
    await ensureScenarioTacticalServices({
      scenarioId: state.id,
      metadata: state.metadata,
      servicesStore,
      waitFor: "core",
    });
  } catch (error) {
    console.error("Failed to initialize tactical services for map:", error);
  } finally {
    tacticalServicesInitInProgress.value = false;
  }
}

void ensureTacticalServicesForScenario();

watch(
  () => state.id,
  () => {
    void ensureTacticalServicesForScenario();
  },
);

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
          recordingStore,
          getScenarioTime: () => state.currentTime,
          getPlaybackRange: () => ({
            start: playbackStore.startMarker,
            end: playbackStore.endMarker,
          }),
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

    // Mark time-sync ready once tactical store exists.
    if (!tacticalTimeSyncReady.value && services?.store) {
      tacticalTimeSyncReady.value = true;
    }
  },
  { immediate: true },
);

watch(
  () => state.currentTime,
  (t) => {
    if (!tacticalTimeSyncReady.value) return;
    const services = servicesStore.getServices();
    const tacticalStore = services?.store;
    if (!tacticalStore) return;
    // Direct update without undo history.
    tacticalStore.update(["scenario:time"], [t]);
  },
  { immediate: true },
);

function redrawUnits() {
  drawUnits();
  refreshUnitDensityLod();
  drawHistory();
  redrawSelectedUnits();
  drawRangeRings();
}

watch(geo.everyVisibleUnit, () => redrawUnits(), { deep: true });

watch([settingsStore, symbolSettings], () => {
  clearUnitStyleCache();
  clearUnitDensityStyleCache();
  drawUnits();
  refreshUnitDensityLod();
});

watch(
  () => state.settingsStateCounter,
  () => {
    clearUnitDensityStyleCache();
    unitDensityLayer.changed();
  },
);

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
