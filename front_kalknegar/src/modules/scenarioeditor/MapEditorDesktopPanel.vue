<template>
  <!-- pt-24 هم‌تراز با هدر نقشه (MapTimeController + padding)؛ ارتفاع بقیهٔ ستون تا بالای breadcrumbs/timeline -->
  <div class="box-border flex h-full min-h-0 shrink-0 flex-col pt-12">
    <aside
      class="bg-sidebar border-sidebar-border pointer-events-auto relative flex min-h-0 flex-1 shrink-0 flex-col overflow-hidden text-right shadow-sm"
      :class="afterMap ? 'border-l' : 'border-r'"
      dir="rtl"
      :style="{ width: orbatPanelWidth + 'px', minWidth: '250px', maxWidth: '50vw' }"
    >
      <TabGroup
        as="div"
        class="bg-sidebar text-foreground flex min-h-0 flex-1 flex-col"
        :selected-index="activeTabIndex"
        @change="changeTab"
      >
        <TabList
          class="border-sidebar-border bg-sidebar sticky top-0 z-20 flex w-full flex-none justify-between border-b rtl:flex-row-reverse"
        >
          <div class="flex w-full items-center gap-0">
            <Tab
              as="template"
              v-for="tab in [
                'آرایش نبرد',
                'رویدادها',
                'استوری‌بورد',
                'لایه‌ها',
                'تنظیمات',
                'فیلتر',
              ]"
              :key="tab"
              v-slot="{ selected }"
            >
              <button
                :class="[
                  selected
                    ? 'text-foreground border-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  'border-b-2 border-transparent px-3 py-2.5 text-center text-sm font-medium transition-colors duration-150',
                ]"
              >
                {{ tab }}
              </button>
            </Tab>
          </div>
          <CloseButton @click="emit('close')" class="mt-1 mr-1" />
        </TabList>
        <TabPanels class="bg-sidebar min-h-0 flex-1 overflow-y-auto text-sm">
          <TabPanel :unmount="false" class="pb-10">
            <OrbatPanel />
          </TabPanel>
          <TabPanel class="p-2 pb-6">
            <ScenarioEventsPanel @event-click="onEventClick" />
          </TabPanel>
          <TabPanel class="p-2 pb-6">
            <StoryboardPanel />
          </TabPanel>
          <TabPanel class="p-2 pb-6"><ScenarioLayersTabPanel /></TabPanel>
          <TabPanel class="p-2 pb-6"><ScenarioSettingsPanel /></TabPanel>
          <TabPanel :unmount="false" class="p-2 pb-6"
            ><ScenarioFiltersTabPanel
          /></TabPanel>
        </TabPanels>
      </TabGroup>
      <PanelResizeHandle
        :width="orbatPanelWidth"
        :left="afterMap"
        @update="orbatPanelWidth = $event"
        @reset="widthStore.resetOrbatPanelWidth()"
      />
    </aside>
  </div>
</template>
<script setup lang="ts">
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/vue";
import ScenarioEventsPanel from "@/modules/scenarioeditor/ScenarioEventsPanel.vue";
import StoryboardPanel from "@/modules/scenarioeditor/StoryboardPanel.vue";
import OrbatPanel from "@/modules/scenarioeditor/OrbatPanel.vue";
import CloseButton from "@/components/CloseButton.vue";
import ScenarioLayersTabPanel from "@/modules/scenarioeditor/ScenarioLayersTabPanel.vue";
import { storeToRefs } from "pinia";
import { useUiStore, useWidthStore } from "@/stores/uiStore";
import { defineAsyncComponent } from "vue";
import { type ScenarioEvent } from "@/types/scenarioModels";
import { useSelectedItems } from "@/stores/selectedStore";
import PanelResizeHandle from "@/components/PanelResizeHandle.vue";
import ScenarioSettingsPanel from "@/modules/scenarioeditor/ScenarioSettingsPanel.vue";

const ScenarioFiltersTabPanel = defineAsyncComponent(
  () => import("@/modules/scenarioeditor/ScenarioFiltersTabPanel.vue"),
);

withDefaults(
  defineProps<{
    /** پنل سمت راست نقشه (بعد از ستون نقشه) */
    afterMap?: boolean;
  }>(),
  { afterMap: true },
);

const emit = defineEmits(["close"]);

const { activeScenarioEventId } = useSelectedItems();

const { activeTabIndex } = storeToRefs(useUiStore());
const widthStore = useWidthStore();
const { orbatPanelWidth } = storeToRefs(widthStore);

function changeTab(index: number) {
  activeTabIndex.value = index;
}

function onEventClick(scenarioEvent: ScenarioEvent) {
  activeScenarioEventId.value = scenarioEvent.id;
}
</script>
