<template>
  <aside
    class="pointer-events-auto relative -mt-12 hidden max-h-[80vh] overflow-auto rounded-2xl border-2 border-teal-200 dark:border-slate-600 shadow-xl md:block bg-white dark:bg-slate-800"
    :style="{ width: orbatPanelWidth + 'px' }"
  >
    <TabGroup
      as="div"
      class="hover-none:mr-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 mr-1.5 flex h-full flex-auto flex-col"
      :class="{ hidden: !showBottomPanel }"
      :selected-index="activeTabIndex"
      @change="changeTab"
    >
      <TabList class="flex flex-0 justify-between border-b border-teal-200 dark:border-slate-600 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 rounded-t-2xl">
        <div class="flex flex-auto items-center justify-evenly">
          <Tab
            as="template"
            v-for="tab in ['آرایش نبرد', 'رویدادها', 'لایه‌ها', 'تنظیمات', 'فیلتر']"
            :key="tab"
            v-slot="{ selected }"
          >
            <button
              :class="[
                selected
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-700'
                  : 'border-transparent text-slate-500 hover:border-teal-300 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400',
                'w-1/2 border-b-2 px-3 py-3 text-center text-sm font-medium rounded-t-lg transition-all duration-200',
              ]"
            >
              {{ tab }}
            </button>
          </Tab>
        </div>
        <CloseButton @click="emit('close')" class="mt-1 mr-1" />
      </TabList>
      <TabPanels class="flex-auto overflow-y-auto bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
        <TabPanel :unmount="false" class="pb-10">
          <OrbatPanel />
        </TabPanel>
        <TabPanel class="p-4 pb-10">
          <ScenarioEventsPanel @event-click="onEventClick" />
        </TabPanel>
        <TabPanel class="p-4 pb-10"><ScenarioLayersTabPanel /></TabPanel>
        <TabPanel class="p-4 pb-10" :unmount="false"> <ScenarioSettingsPanel /></TabPanel>
        <TabPanel :unmount="false"><ScenarioFiltersTabPanel /></TabPanel>
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
import ScenarioSettingsPanel from "@/modules/scenarioeditor/ScenarioSettingsPanel.vue";

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
