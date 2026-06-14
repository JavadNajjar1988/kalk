<template>
  <div class="relative flex min-h-0 flex-auto flex-col">
    <div class="relative flex min-h-0 flex-1 flex-row" dir="ltr">
      <MapEditorDesktopPanel
        v-if="!isMobile && !rtlPanels && showLeftPanel"
        :after-map="false"
        @close="toggleLeftPanel()"
      />
      <div class="relative flex min-h-0 min-w-0 flex-1 flex-col">
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
          <div
            class="pointer-events-none absolute inset-x-4 bottom-0 z-40 flex justify-center"
          >
            <StoryboardOverlay
              :scene="storyboard.activeScene.value"
              :settings="state.storyboard.settings"
              @close="storyboard.clearActiveScene()"
            />
          </div>
          <MapEditorDetailsPanel
            v-if="!isMobile && showDetailsPanel"
            :side="rtlPanels ? 'left' : 'right'"
            @close="onCloseDetailsPanel()"
          >
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
          <template v-if="!isMobile">
            <button
              v-if="rtlPanels && !showDetailsPanel"
              type="button"
              @click="onOpenDetailsPanel()"
              title="نمایش پنل"
              class="panel-toggle-edge pointer-events-auto absolute top-[45%] left-0 h-11 w-5 -translate-y-1/2 rounded-l-none rounded-r-md border border-l-0 px-0"
            >
              <ShowPanelIcon class="h-6 w-6" />
            </button>
            <button
              v-if="rtlPanels && !showLeftPanel"
              type="button"
              @click="toggleLeftPanel()"
              title="نمایش پنل آرایش نبرد"
              class="panel-toggle-edge pointer-events-auto absolute top-[45%] right-0 h-11 w-5 -translate-y-1/2 rounded-l-md rounded-r-none border border-r-0 px-0"
            >
              <ShowPanelIcon class="h-6 w-6 rotate-180" />
            </button>
            <button
              v-if="!rtlPanels && !showLeftPanel"
              type="button"
              @click="toggleLeftPanel()"
              title="نمایش پنل"
              class="panel-toggle-edge pointer-events-auto absolute top-[45%] left-0 h-11 w-5 -translate-y-1/2 rounded-l-none rounded-r-md border border-l-0 px-0"
            >
              <ShowPanelIcon class="h-6 w-6" />
            </button>
            <button
              v-if="!rtlPanels && !showDetailsPanel"
              type="button"
              @click="onOpenDetailsPanel()"
              title="نمایش پنل"
              class="panel-toggle-edge pointer-events-auto absolute top-[45%] right-0 h-11 w-5 -translate-y-1/2 rounded-l-md rounded-r-none border border-r-0 px-0"
            >
              <ShowPanelIcon class="h-6 w-6 rotate-180" />
            </button>
          </template>
        </main>
        <footer
          v-if="mapRef && ui.showToolbar"
          class="pointer-events-none z-50 flex justify-center sm:absolute sm:bottom-2 sm:w-full sm:p-2"
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
          <MapEditorTacticalToolbar
            class="absolute bottom-14 sm:bottom-16"
            v-if="toolbarStore.currentToolbar === 'tactical'"
          />
        </footer>
      </div>
      <MapEditorDesktopPanel
        v-if="!isMobile && rtlPanels && showLeftPanel"
        @close="toggleLeftPanel()"
      />
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
  nextTick,
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
import { useUiStore, useWidthStore } from "@/stores/uiStore";
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
import MapEditorTacticalToolbar from "@/modules/scenarioeditor/MapEditorTacticalToolbar.vue";
import { storeToRefs } from "pinia";
import { usePlaybackStore } from "@/stores/playbackStore";
import UnitBreadcrumbs from "@/modules/scenarioeditor/UnitBreadcrumbs.vue";
import StoryboardOverlay from "@/modules/scenarioeditor/StoryboardOverlay.vue";
import { useStoryboard } from "@/scenariostore/storyboard";

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
const storyboard = useStoryboard(activeScenario.store);
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
const { orbatPanelWidth, detailsWidth } = storeToRefs(useWidthStore());
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

watch([showLeftPanel, orbatPanelWidth, showDetailsPanel, detailsWidth, isMobile], () => {
  nextTick(() => {
    mapRef.value?.updateSize();
  });
});

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
  { immediate: true },
);

watch(
  () => state.currentTime,
  (currentTime) => {
    if (!state.storyboard.enabled) return;
    if (state.storyboard.settings.showMode !== "toast") return;
    const [nextScene] = storyboard.detectTriggeredScenes(currentTime);
    if (nextScene) storyboard.showScene(nextScene);
  },
);
</script>
<style scoped>
.panel-toggle-edge {
  border-color: var(--surface-border);
  background-color: var(--surface-panel);
  color: hsl(var(--foreground));
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.panel-toggle-edge:hover {
  background-color: var(--surface-panel-muted);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.16);
}

:global(.dark) .panel-toggle-edge {
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.35);
}

.panel-toggle-edge:active {
  transform: translateY(-50%) translateX(1px);
}
</style>
