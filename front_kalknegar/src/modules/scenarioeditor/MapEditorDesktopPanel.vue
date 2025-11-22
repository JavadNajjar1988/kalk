<template>
  <aside
    class="map-editor-panel pointer-events-auto absolute top-24 right-4 hidden max-h-[80vh] overflow-auto rounded-2xl md:block backdrop-blur-md backdrop-saturate-150 shadow-xl text-right"
    dir="rtl"
    :style="{ width: orbatPanelWidth + 'px' }"
  >
    <TabGroup
      as="div"
      class="bg-transparent text-foreground flex h-full flex-auto flex-col"
      :class="{ hidden: !showBottomPanel }"
      :selected-index="activeTabIndex"
      @change="changeTab"
    >
      <TabList
        class="map-editor-tab-list flex flex-0 w-full justify-between border-b rounded-t-2xl rtl:flex-row-reverse backdrop-blur-sm"
      >
        <div class="flex items-center gap-1 w-full">
          <Tab
            as="template"
            v-for="tab in ['آرایش نبرد', 'رویدادها', 'لایه‌ها', 'فیلتر']"
            :key="tab"
            v-slot="{ selected }"
          >
            <button
              :class="[
                selected
                  ? 'map-editor-tab-active backdrop-blur-sm'
                  : 'map-editor-tab-inactive text-muted-foreground hover:text-foreground',
                'flex-1 px-2 py-1.5 text-center text-xs font-medium rounded-t-lg transition-all duration-200',
              ]"
            >
              {{ tab }}
            </button>
          </Tab>
        </div>
        <CloseButton @click="emit('close')" class="mt-1 mr-1" />
      </TabList>
      <TabPanels class="flex-auto overflow-y-auto bg-transparent text-xs">
        <TabPanel :unmount="false" class="pb-10">
          <OrbatPanel />
        </TabPanel>
        <TabPanel class="p-2 pb-6">
          <ScenarioEventsPanel @event-click="onEventClick" />
        </TabPanel>
        <TabPanel class="p-2 pb-6"><ScenarioLayersTabPanel /></TabPanel>
        <TabPanel :unmount="false" class="p-2 pb-6"><ScenarioFiltersTabPanel /></TabPanel>
      </TabPanels>
    </TabGroup>
    <PanelResizeHandle
      :width="orbatPanelWidth"
      @update="orbatPanelWidth = $event"
      @reset="widthStore.resetOrbatPanelWidth()"
    />
  </aside>
</template>
<script setup lang="ts">
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/vue";
import ScenarioEventsPanel from "@/modules/scenarioeditor/ScenarioEventsPanel.vue";
import OrbatPanel from "@/modules/scenarioeditor/OrbatPanel.vue";
import CloseButton from "@/components/CloseButton.vue";
import { useToggle } from "@vueuse/core";
import { injectStrict } from "@/utils";
import { activeMapKey } from "@/components/injects";
import ScenarioLayersTabPanel from "@/modules/scenarioeditor/ScenarioLayersTabPanel.vue";
import { storeToRefs } from "pinia";
import { useUiStore, useWidthStore } from "@/stores/uiStore";
import { defineAsyncComponent, onMounted, onUnmounted } from "vue";
import { type ScenarioEvent } from "@/types/scenarioModels";
import { useSelectedItems } from "@/stores/selectedStore";
import PanelResizeHandle from "@/components/PanelResizeHandle.vue";
// Removed settings from left panel; settings moved to right drawer

const ScenarioFiltersTabPanel = defineAsyncComponent(
  () => import("@/modules/scenarioeditor/ScenarioFiltersTabPanel.vue"),
);

const emit = defineEmits(["close"]);

const mapRef = injectStrict(activeMapKey);
const { activeScenarioEventId } = useSelectedItems();

const [showBottomPanel, toggleBottomPanel] = useToggle(true);

const { activeTabIndex } = storeToRefs(useUiStore());
const widthStore = useWidthStore();
const { orbatPanelWidth } = storeToRefs(widthStore);

function changeTab(index: number) {
  activeTabIndex.value = index;
}

onMounted(() => {
  const padding = mapRef.value.getView().padding || [0, 0, 0, 0];
  const [top, right, bottom, left] = padding;
  mapRef.value.getView().padding = [top, right, bottom, 400];
});

onUnmounted(() => {
  const padding = mapRef.value.getView().padding;
  if (padding) {
    const [top, right, bottom, left] = padding;
    mapRef.value.getView().padding = [top, right, bottom, 0];
  }
});

function onEventClick(scenarioEvent: ScenarioEvent) {
  activeScenarioEventId.value = scenarioEvent.id;
}
</script>
<style scoped>
.map-editor-panel {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
}

:global(.dark) .map-editor-panel {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .map-editor-panel {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  
  :global(.dark) .map-editor-panel {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
}

.map-editor-tab-list {
  background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
}

:global(.dark) .map-editor-tab-list {
  background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.map-editor-tab-active {
  color: color-mix(in srgb, var(--color-primary) 90%, black);
  border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
}

:global(.dark) .map-editor-tab-active {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
  border-bottom-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

.map-editor-tab-inactive:hover {
  background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

:global(.dark) .map-editor-tab-inactive:hover {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
}
</style>
