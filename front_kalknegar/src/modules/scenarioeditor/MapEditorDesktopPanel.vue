<template>
  <aside
    class="pointer-events-auto relative hidden max-h-[80vh] overflow-auto rounded-2xl md:block bg-blue-300/40 dark:bg-blue-400/15 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/30 dark:supports-[backdrop-filter]:bg-blue-400/20 border border-blue-300/60 dark:border-blue-400/30 shadow-xl mt-2 text-right"
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
        class="flex flex-0 w-full justify-between border-b rounded-t-2xl rtl:flex-row-reverse bg-blue-300/30 dark:bg-blue-400/10 backdrop-blur-sm border-blue-300/50 dark:border-blue-400/30"
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
                  ? 'text-blue-900 dark:text-blue-100 border-b-2 border-blue-300/60 dark:border-blue-400/30 bg-blue-300/30 dark:bg-blue-400/10 backdrop-blur-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-blue-300/20 dark:hover:bg-blue-400/10',
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
