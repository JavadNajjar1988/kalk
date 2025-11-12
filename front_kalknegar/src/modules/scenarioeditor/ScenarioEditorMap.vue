<template>
  <div class="relative flex min-h-0 flex-auto flex-col">
    <div class="relative flex flex-auto flex-col">
      <NewScenarioMap class="flex-auto" @mapReady="onMapReady" />
      <main
        v-if="mapRef"
        class="pointer-events-none absolute inset-0 flex flex-col justify-between"
      >
        <header class="flex flex-none items-center justify-end p-2">
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
          <IconButton
            @click.stop="onShowPlaceSearch"
            class="pointer-events-auto ml-2"
            title="جستجو"
          >
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-500" />
          </IconButton>
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
                class="bg-opacity-70 pointer-events-auto absolute -my-12 left-0 rounded bg-white p-1 text-gray-600 hover:text-gray-900"
              >
                <ShowPanelIcon class="h-7 w-7" />
              </button>
            </div>

            <!-- Right side: orbat panel in RTL layout -->
            <MapEditorDesktopPanel v-if="showLeftPanel" @close="toggleLeftPanel()" />
            <div v-else>
              <button
                type="button"
                @click="toggleLeftPanel()"
                title="نمایش پنل آرایش نبرد"
                class="bg-opacity-70 pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow hover:text-gray-900"
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
                class="bg-opacity-70 pointer-events-auto absolute top-1/2 -translate-y-1/2 -left-2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow hover:text-gray-900"
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
                class="bg-opacity-70 pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow hover:text-gray-900"
              >
                <ShowPanelIcon class="h-6 w-6 rotate-180" />
              </button>
            </div>
          </template>
        </section>
      </main>
      <!-- Floating breadcrumb pill (top-center) -->
      <div
        v-if="mapRef"
        class="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center px-2"
      >
        <div class="pointer-events-auto">
          <button
            v-if="!breadcrumbOpen"
            type="button"
            class="breadcrumb-pill-button backdrop-blur-md rounded-full px-3 py-1 text-xs shadow-md text-foreground"
            @click.stop="breadcrumbOpen = true"
            title="نمایش مسیر آرایش نبرد"
          >
            مسیر آرایش نبرد
          </button>
          <div
            v-else
            class="breadcrumb-panel backdrop-blur-md rounded-2xl shadow-xl max-w-[90vw] sm:max-w-3xl lg:max-w-5xl overflow-hidden"
          >
            <div class="breadcrumb-panel-header flex items-center justify-between px-3 py-1.5">
              <span class="text-xs text-foreground">مسیر آرایش نبرد</span>
              <button
                type="button"
                class="breadcrumb-close-button rounded px-2 py-1 text-xs"
                @click.stop="breadcrumbOpen = false"
                title="بستن"
              >
                ×
              </button>
            </div>
            <div class="breadcrumb-panel-content max-h-52 overflow-auto p-2 rounded-2xl text-foreground [&_.bg-sidebar]:bg-transparent [&_.sm\:p-3]:p-2">
              <UnitBreadcrumbs />
            </div>
          </div>
        </div>
      </div>
      <!-- Overlay breadcrumb and timeline to avoid affecting map layout -->
      <div
        v-if="mapRef"
        class="pointer-events-none absolute inset-x-0 bottom-2 z-40 flex flex-col items-center gap-2 px-2"
      >
        <!-- Breadcrumb moved to top floating pill -->
        <div v-if="ui.showTimeline" class="pointer-events-auto w-full sm:max-w-4xl lg:max-w-6xl">
          <ScenarioTimeline />
        </div>
      </div>
      <footer
        v-if="mapRef && ui.showToolbar"
        class="pointer-events-none sm:absolute sm:bottom-28 sm:left-1/2 sm:-translate-x-1/2 sm:p-2 z-50"
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
import { IconChevronRightBoxOutline as ShowPanelIcon } from "@iconify-prerendered/vue-mdi";
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
import IconButton from "@/components/IconButton.vue";
import { MagnifyingGlassIcon } from "@heroicons/vue/24/solid";
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
const { state, update } = activeScenario.store;
const {
  time: { setCurrentTime, add, subtract, goToNextScenarioEvent, goToPrevScenarioEvent },
} = activeScenario;
const toolbarStore = useMainToolbarStore();
const activeUnitStore = useActiveUnitStore();
const ui = useUiStore();
const playback = usePlaybackStore();
const breadcrumbOpen = shallowRef(false);
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

function onShowPlaceSearch() {
  ui.searchGeoMode = true;
  ui.showSearch = true;
}

const { pause, resume, isActive } = useRafFn(
  ({ delta }) => {
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
.breadcrumb-pill-button {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .breadcrumb-pill-button {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .breadcrumb-pill-button {
    background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
  
  :global(.dark) .breadcrumb-pill-button {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
}

.breadcrumb-panel {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .breadcrumb-panel {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .breadcrumb-panel {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  
  :global(.dark) .breadcrumb-panel {
    background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
  }
}

.breadcrumb-panel-header {
  background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

:global(.dark) .breadcrumb-panel-header {
  background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
}

.breadcrumb-close-button:hover {
  background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

:global(.dark) .breadcrumb-close-button:hover {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.breadcrumb-panel-content {
  background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, transparent);
}

:global(.dark) .breadcrumb-panel-content {
  background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .breadcrumb-panel-content {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
}

.breadcrumb-panel-content :deep(.border-b) {
  border-color: color-mix(in srgb, var(--color-primary) 18%, transparent) !important;
}

:global(.dark) .breadcrumb-panel-content :deep(.border-b) {
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent) !important;
}
</style>
