<template>
  <div class="relative flex min-h-0 flex-auto flex-col">
    <div class="relative flex flex-auto flex-col">
      <NewScenarioMap class="flex-auto" @mapReady="onMapReady" />
      <main
        v-if="mapRef"
        class="pointer-events-none absolute inset-0 flex flex-col justify-between"
      >
        <header class="flex flex-none items-center justify-between px-4 pt-4">
          <div class="flex items-center space-x-2 space-x-reverse">
            <MapTimeController
              class="pointer-events-auto"
              :show-controls="isMobile ? ui.mobilePanelOpen : false"
              @open-time-modal="openTimeDialog()"
              @show-settings="emit('show-settings')"
              @inc-day="onIncDay()"
              @dec-day="onDecDay()"
              @next-event="goToNextScenarioEvent()"
              @prev-event="goToPrevScenarioEvent()"
            />
          </div>
          
        </header>
        <section v-if="!isMobile" class="flex flex-auto justify-between p-2" style="direction: ltr;">
          <template v-if="rtlPanels">
            <!-- Left side: details panel in RTL layout -->
            <MapEditorDetailsPanel v-if="showDetailsPanel" @close="onCloseDetailsPanel()">
              <ScenarioFeatureDetails
                v-if="activeDetailsPanel === 'feature'"
                :selected-ids="selectedFeatureIds"
              />
              <UnitDetails
                v-else-if="activeDetailsPanel === 'unit'"
                :unit-id="activeUnitId || [...selectedUnitIds][0]"
              />
              <ScenarioEventDetails
                v-else-if="activeDetailsPanel === 'event'"
                :event-id="activeScenarioEventId!"
              />
              <ScenarioMapLayerDetails
                v-else-if="activeDetailsPanel === 'mapLayer'"
                :layer-id="activeMapLayerId!"
              />
              <ScenarioInfoPanel v-else-if="activeDetailsPanel === 'scenario'" />
            </MapEditorDetailsPanel>
            <div v-else>
              <button
                type="button"
                @click="onOpenDetailsPanel()"
                title="نمایش پنل"
                class="panel-toggle-button pointer-events-auto absolute top-24 left-4"
              >
                <ShowPanelIcon class="h-6 w-6" />
              </button>
            </div>

            <!-- Right side: orbat panel in RTL layout -->
            <MapEditorDesktopPanel v-if="showLeftPanel" @close="toggleLeftPanel()" />
            <div v-else>
              <button
                type="button"
                @click="toggleLeftPanel()"
                title="نمایش پنل آرایش نبرد"
                class="panel-toggle-button pointer-events-auto absolute top-24 right-4"
              >
                <ShowPanelIcon class="h-6 w-6 rotate-180" />
              </button>
            </div>
          </template>
          <template v-else>
            <!-- Original LTR layout: left = orbat panel, right = details -->
            <MapEditorDesktopPanel v-if="showLeftPanel" @close="toggleLeftPanel()" />
            <div v-else>
              <button
                type="button"
                @click="toggleLeftPanel()"
                title="نمایش پنل"
                class="panel-toggle-button pointer-events-auto absolute top-6 left-4"
              >
                <ShowPanelIcon class="h-6 w-6" />
              </button>
            </div>
            <MapEditorDetailsPanel v-if="showDetailsPanel" @close="onCloseDetailsPanel()">
              <ScenarioFeatureDetails
                v-if="activeDetailsPanel === 'feature'"
                :selected-ids="selectedFeatureIds"
              />
              <UnitDetails
                v-else-if="activeDetailsPanel === 'unit'"
                :unit-id="activeUnitId || [...selectedUnitIds][0]"
              />
              <ScenarioEventDetails
                v-else-if="activeDetailsPanel === 'event'"
                :event-id="activeScenarioEventId!"
              />
              <ScenarioMapLayerDetails
                v-else-if="activeDetailsPanel === 'mapLayer'"
                :layer-id="activeMapLayerId!"
              />
              <ScenarioInfoPanel v-else-if="activeDetailsPanel === 'scenario'" />
            </MapEditorDetailsPanel>
            <div v-else>
              <button
                type="button"
                @click="onOpenDetailsPanel()"
                title="نمایش پنل"
                class="panel-toggle-button pointer-events-auto absolute top-6 right-4"
              >
                <ShowPanelIcon class="h-6 w-6 rotate-180" />
              </button>
            </div>
          </template>
        </section>
      </main>
      <footer
        v-if="mapRef && ui.showToolbar"
        class="pointer-events-none flex justify-center sm:absolute sm:bottom-2 sm:w-full sm:p-2 z-50"
      >
        <MapEditorMainToolbar
          @open-time-modal="openTimeDialog()"
          @inc-day="onIncDay()"
          @dec-day="onDecDay()"
          @next-event="goToNextScenarioEvent()"
          @prev-event="goToPrevScenarioEvent()"
          @show-settings="emit('show-settings')"
        />
        <MapEditorMeasurementToolbar
          class="absolute bottom-14 sm:bottom-16"
          v-if="toolbarStore.currentToolbar === 'measurements'"
        />
        <MapEditorDrawToolbar
          class="absolute bottom-14 sm:bottom-16"
          v-if="toolbarStore.currentToolbar === 'draw'"
        />
        <MapEditorUnitTrackToolbar
          class="absolute bottom-14 sm:bottom-16"
          v-if="toolbarStore.currentToolbar === 'track'"
        />
      </footer>
    </div>
    <template v-if="isMobile">
      <UnitBreadcrumbs v-if="ui.showOrbatBreadcrumbs" />
      <MapEditorMobilePanel
        @open-time-modal="openTimeDialog()"
        @inc-day="onIncDay()"
        @dec-day="onDecDay()"
        @next-event="goToNextScenarioEvent()"
        @prev-event="goToPrevScenarioEvent()"
        @show-settings="emit('show-settings')"
      />
    </template>
    <KeyboardScenarioActions v-if="mapRef" />
    <SearchScenarioActions v-if="mapRef" />
    <GlobalEvents
      v-if="ui.shortcutsEnabled"
      :filter="inputEventFilter"
      @keyup.t="openTimeDialog"
      @keyup.s="ui.showSearch = true"
    />
    <UnitBreadcrumbs v-if="ui.showOrbatBreadcrumbs && !isMobile" />
    <ScenarioTimeline v-if="ui.showTimeline" />

  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onActivated,
  onUnmounted,
  provide,
  type ShallowRef,
  shallowRef,
  watch,
} from "vue";
import { useActiveUnitStore } from "@/stores/dragStore";
import {
  activeFeatureSelectInteractionKey,
  activeMapKey,
  activeScenarioKey,
  timeModalKey,
} from "@/components/injects";
import { PhSidebarSimple as ShowPanelIcon } from "@phosphor-icons/vue";
import { injectStrict } from "@/utils";
import MapTimeController from "@/components/MapTimeController.vue";
import MapEditorMainToolbar from "@/modules/scenarioeditor/MapEditorMainToolbar.vue";
import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import MapEditorMeasurementToolbar from "@/modules/scenarioeditor/MapEditorMeasurementToolbar.vue";
import OLMap from "ol/Map";
import NewScenarioMap from "@/components/ScenarioMap.vue";
import MapEditorDrawToolbar from "@/modules/scenarioeditor/MapEditorDrawToolbar.vue";
import Select from "ol/interaction/Select";
import { breakpointsTailwind, useBreakpoints, useRafFn, useToggle } from "@vueuse/core";
import KeyboardScenarioActions from "@/modules/scenarioeditor/KeyboardScenarioActions.vue";
import ScenarioFeatureDetails from "@/modules/scenarioeditor/ScenarioFeatureDetails.vue";
import MapEditorMobilePanel from "@/modules/scenarioeditor/MapEditorMobilePanel.vue";
import MapEditorDesktopPanel from "@/modules/scenarioeditor/MapEditorDesktopPanel.vue";
import MapEditorDetailsPanel from "@/modules/scenarioeditor/MapEditorDetailsPanel.vue";
import { useUiStore } from "@/stores/uiStore";
import { inputEventFilter } from "@/components/helpers";
import { GlobalEvents } from "vue-global-events";
import SearchScenarioActions from "@/modules/scenarioeditor/SearchScenarioActions.vue";
import ScenarioEventDetails from "@/modules/scenarioeditor/ScenarioEventDetails.vue";
import { useSelectedItems } from "@/stores/selectedStore";
import ScenarioMapLayerDetails from "@/modules/scenarioeditor/ScenarioMapLayerDetails.vue";
import UnitDetails from "@/modules/scenarioeditor/UnitDetails.vue";
import ScenarioInfoPanel from "@/modules/scenarioeditor/ScenarioInfoPanel.vue";
import ScenarioTimeline from "@/modules/scenarioeditor/ScenarioTimeline.vue";
import MapEditorUnitTrackToolbar from "@/modules/scenarioeditor/MapEditorUnitTrackToolbar.vue";
import { storeToRefs } from "pinia";
import { usePlaybackStore } from "@/stores/playbackStore";
import UnitBreadcrumbs from "@/modules/scenarioeditor/UnitBreadcrumbs.vue";

const emit = defineEmits(["showExport", "showLoad", "show-settings"]);
const activeScenario = injectStrict(activeScenarioKey);

const { getModalTimestamp } = injectStrict(timeModalKey);
const { state } = activeScenario.store;
const {
  time: { setCurrentTime, add, subtract, goToNextScenarioEvent, goToPrevScenarioEvent },
} = activeScenario;
const toolbarStore = useMainToolbarStore();
const activeUnitStore = useActiveUnitStore();
const ui = useUiStore();
const playback = usePlaybackStore();
// For fa-IR UI, prefer details on the left and orbat on the right
const rtlPanels = true;

const mapRef = shallowRef<OLMap>();
const featureSelectInteractionRef = shallowRef<Select>();
provide(activeMapKey, mapRef as ShallowRef<OLMap>);
provide(
  activeFeatureSelectInteractionKey,
  featureSelectInteractionRef as ShallowRef<Select>,
);

const breakpoints = useBreakpoints(breakpointsTailwind);

const isMobile = breakpoints.smallerOrEqual("md");

function onMapReady({
  olMap,
  featureSelectInteraction,
}: {
  olMap: OLMap;
  featureSelectInteraction: Select;
}) {
  mapRef.value = olMap;
  featureSelectInteractionRef.value = featureSelectInteraction;
}

const {
  selectedUnitIds,
  selectedFeatureIds,
  activeUnitId,
  activeScenarioEventId,
  activeMapLayerId,
  showScenarioInfo,
  activeDetailsPanel,
  clear: clearSelected,
} = useSelectedItems();

const { showLeftPanel } = storeToRefs(ui);
const toggleLeftPanel = useToggle(showLeftPanel);

const showDetailsPanel = computed(() => {
  return Boolean(
    selectedFeatureIds.value.size ||
      selectedUnitIds.value.size ||
      activeScenarioEventId.value ||
      activeMapLayerId.value ||
      showScenarioInfo.value,
  );
});

function onOpenDetailsPanel() {
  showScenarioInfo.value = true;
}

onUnmounted(() => {
  activeUnitStore.clearActiveUnit();
  playback.playbackRunning = false;
});

onActivated(() => {
  mapRef.value?.updateSize();
  playback.playbackRunning = false;
});

function onCloseDetailsPanel() {
  clearSelected();
}

const openTimeDialog = async () => {
  const newTimestamp = await getModalTimestamp(state.currentTime, {
    timeZone: state.info.timeZone,
  });
  if (newTimestamp !== undefined) {
    setCurrentTime(newTimestamp);
  }
};

function onIncDay() {
  add(1, "day", true);
}

function onDecDay() {
  subtract(1, "day", true);
}

const { pause, resume } = useRafFn(
  () => {
    if (
      playback.playbackLooping &&
      playback.endMarker !== undefined &&
      playback.startMarker !== undefined
    ) {
      if (state.currentTime >= playback.endMarker) {
        setCurrentTime(playback.startMarker);
        return;
      }
    }

    const newTime = state.currentTime + playback.playbackSpeed;
    setCurrentTime(newTime);
  },
  { immediate: false, fpsLimit: 60 },
);

watch(
  () => playback.playbackRunning,
  (running) => {
    if (running) {
      resume();
    } else {
      pause();
    }
  },
  { immediate: true   },
);
</script>
<style scoped>
.panel-toggle-button {
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  background-color: var(--surface-panel);
  color: hsl(var(--foreground));
  padding: 0.5rem;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.16);
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.panel-toggle-button:hover {
  background-color: var(--surface-panel-muted);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.2);
}

:global(.dark) .panel-toggle-button {
  box-shadow: 0 8px 18px rgba(2, 6, 23, 0.45);
}

.panel-toggle-button:active {
  transform: translateY(1px);
}
</style>
