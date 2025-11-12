<template>
  <div class="relative flex min-h-0 flex-auto pt-11">
    <ResizablePanel
      v-model:width="panelWidth"
      class="chart-edit-sidebar relative z-10 flex h-full flex-col justify-between overflow-auto overflow-visible border-r-2 backdrop-blur-sm backdrop-saturate-150 print:hidden"
    >
      <TabGroup :selected-index="selectedTab" @change="changeTab">
        <TabList class="chart-edit-tab-list -mb-px flex border-b backdrop-blur-sm backdrop-saturate-150 rounded-t-2xl">
          <Tab
            as="template"
            v-for="tab in ['آرایش نبرد', 'تنظیمات نمودار']"
            :key="tab"
            v-slot="{ selected }"
          >
            <button
              :class="[
                selected
                  ? 'chart-edit-tab-active'
                  : 'chart-edit-tab-inactive',
                'w-1/2 border-b-2 px-4 py-4 text-center text-sm font-medium transition-all duration-200 rounded-t-lg',
              ]"
            >
              {{ tab }}
            </button>
          </Tab>
        </TabList>
        <TabPanels class="min-h-0 flex-auto overflow-auto">
          <TabPanel :unmount="false">
            <OrbatPanel class="space-y-1" hide-filter>
              <template #header></template>
            </OrbatPanel>
          </TabPanel>
          <TabPanel :unmount="false">
            <OrbatChartSettings chart-mode :tab="currentTab" />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </ResizablePanel>
    <main class="chart-edit-main relative h-full flex-auto backdrop-blur-sm backdrop-saturate-150">
      <SimpleBreadcrumbs
        class="chart-edit-breadcrumbs backdrop-blur-sm backdrop-saturate-150 border absolute top-2 left-2 z-10 rounded-xl px-3 py-2 shadow-lg print:hidden"
        :items="breadcrumbItems"
      />
      <nav class="chart-edit-nav absolute top-2 right-4 z-10 rounded-2xl backdrop-blur-sm backdrop-saturate-150 border shadow-lg print:hidden">
        <DotsMenu :items="menuItems" />
      </nav>

      
      <p v-if="!activeUnit" class="p-8 text-center">واحد ریشه را در نوار کناری انتخاب کنید</p>
      <OrbatChart
        :unit="activeUnit"
        :width="width"
        :height="height"
        :symbol-generator="symbolGenerator"
        chart-id="chartId"
        :options="options.$state"
        :specific-options="specificOptions.$state"
        enable-pan-zoom
        :interactive="isInteractive"
        @unitclick="onUnitClick"
        @levelclick="onLevelClick"
        @branchclick="onBranchClick"
        :debug="debug"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/vue";
import OrbatPanel from "@/modules/scenarioeditor/OrbatPanel.vue";
import { symbolGenerator } from "@/symbology/milsymbwrapper";
import {
  useChartSettingsStore,
  useRootUnitStore,
  useSelectedChartElementStore,
  useSpecificChartOptionsStore,
} from "@/modules/charteditor/chartSettingsStore";
import { sizeToWidthHeight } from "@/modules/charteditor/orbatchart/sizes";
import OrbatChart from "@/modules/charteditor/OrbatChart.vue";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import SimpleBreadcrumbs from "@/components/SimpleBreadcrumbs.vue";
import type { BreadcrumbItem, MenuItemData } from "@/components/types";
import OrbatChartSettings from "@/modules/charteditor/OrbatChartSettings.vue";
import type {
  OnBranchClickCallback,
  OnLevelClickCallback,
  RenderedUnitNode,
} from "@/modules/charteditor/orbatchart";
import { type ChartTab, ChartTabs } from "@/modules/charteditor/constants";
import ToggleField from "@/components/ToggleField.vue";
import ResizablePanel from "@/components/ResizablePanel.vue";
import DotsMenu from "@/components/DotsMenu.vue";
import { promiseTimeout } from "@vueuse/core";
import { useSearchActions } from "@/composables/searchActions";
import { useSelectedItems } from "@/stores/selectedStore";
import { saveBlobToLocalFile } from "@/utils/files";

const rootUnitStore = useRootUnitStore();
const options = useChartSettingsStore();
const specificOptions = useSpecificChartOptionsStore();
const { activeUnitId } = useSelectedItems();
const {
  unitActions,
  store: { state },
  helpers: { getUnitById },
} = injectStrict(activeScenarioKey);
const activeUnit = computed(
  () =>
    (activeUnitId.value &&
      unitActions.expandUnitWithSymbolOptions(getUnitById(activeUnitId.value))) ||
    null,
);

const { onUnitSelect } = useSearchActions();

onUnitSelect(({ unitId }) => {
  activeUnitId.value = unitId;
});

const breadcrumbItems = computed((): BreadcrumbItem[] => {
  if (!activeUnitId.value) return [];
  const { side, sideGroup, parents } = unitActions.getUnitHierarchy(activeUnitId.value);
  return [
    { name: side.name, static: true },
    { name: sideGroup.name, static: true },
    ...parents.map((e) => ({ name: e.name, static: true })),
    { name: activeUnit.value?.name!, static: true },
  ];
});

rootUnitStore.unit = null;
const ORBAT_TAB = 0;
const SETTINGS_TAB = 1;

const selectedTab = ref(ORBAT_TAB);
const isInteractive = ref(true);

function changeTab(index: number) {
  selectedTab.value = index;
}

const panelWidth = ref();
const debug = ref(false);
const currentTab = ref<ChartTab>(ChartTabs.Chart);
const currentChartElements = useSelectedChartElementStore();

const width = computed(() => sizeToWidthHeight(options.paperSize).width);
const height = computed(() => sizeToWidthHeight(options.paperSize).height);

const onUnitClick = (unitNode: RenderedUnitNode) => {
  currentChartElements.selectUnit(unitNode);
  changeTab(SETTINGS_TAB);
  nextTick(() => (currentTab.value = ChartTabs.Unit));
};

const onLevelClick: OnLevelClickCallback = (levelNumber: number) => {
  currentChartElements.selectLevel(levelNumber);
  changeTab(SETTINGS_TAB);
  currentTab.value = ChartTabs.Level;
};

const onBranchClick: OnBranchClickCallback = (parentId, levelNumber) => {
  currentChartElements.selectBranch(parentId, levelNumber);
  changeTab(SETTINGS_TAB);
  currentTab.value = ChartTabs.Branch;
};

const doSVGDownload = async () => {
  const origValue = isInteractive.value;
  isInteractive.value = false;
  await nextTick();
  downloadElementAsSVG("chartId");
  await promiseTimeout(1000);
  isInteractive.value = origValue;
};

const doPNGDownload = async () => {
  const origValue = isInteractive.value;
  isInteractive.value = false;
  await nextTick();
  downloadSvgAsPng("chartId", width.value, height.value);
  await promiseTimeout(1000);
  isInteractive.value = origValue;
};

function downloadSvgAsPng(elementId: string, width: number, height: number) {
  let svgElement = document.getElementById(elementId);
  if (!svgElement) return;
  // need this for Firefox (https://stackoverflow.com/questions/28690643/firefox-error-rendering-an-svg-image-to-html5-canvas-with-drawimage)
  const savedWidth = svgElement.getAttribute("width") || "";
  const savedHeight = svgElement.getAttribute("height") || "";
  const scaleFactor = 2;

  svgElement.setAttribute("width", `${width * scaleFactor}px`);
  svgElement.setAttribute("height", `${height * scaleFactor}px`);
  const svgBlob = new Blob([new XMLSerializer().serializeToString(svgElement)], {
    type: "image/svg+xml",
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * scaleFactor;
  canvas.height = height * scaleFactor;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const objectURL = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = function () {
    ctx.drawImage(image, 0, 0);
    canvas.toBlob((blob) => blob && saveBlobToLocalFile(blob, "orbat-chart.png"));
    URL.revokeObjectURL(objectURL);
    svgElement?.setAttribute("width", savedWidth);
    svgElement?.setAttribute("height", savedHeight);
  };

  image.src = objectURL;
}

async function downloadElementAsSVG(elementId: string) {
  let svgElement = document.getElementById(elementId);
  if (!svgElement) return;
  await saveBlobToLocalFile(
    new Blob([new XMLSerializer().serializeToString(svgElement)], {
      type: "image/svg+xml",
    }),
    "orbat-chart.svg",
  );
}

const menuItems: MenuItemData<Function>[] = [
  { label: "دانلود به عنوان SVG", action: doSVGDownload },
  { label: "دانلود به عنوان PNG", action: doPNGDownload },
];
</script>
<style scoped>
.chart-edit-sidebar {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-right-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .chart-edit-sidebar {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-right-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.chart-edit-tab-list {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-bottom-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .chart-edit-tab-list {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-bottom-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.chart-edit-tab-active {
  border-bottom-color: var(--color-primary);
  color: color-mix(in srgb, var(--color-primary) 90%, black);
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:global(.dark) .chart-edit-tab-active {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.chart-edit-tab-inactive {
  border-bottom-color: transparent;
  color: rgb(100 116 139);
}

.chart-edit-tab-inactive:hover {
  border-bottom-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  color: color-mix(in srgb, var(--color-primary) 80%, black);
}

:global(.dark) .chart-edit-tab-inactive {
  color: rgb(148 163 184);
}

:global(.dark) .chart-edit-tab-inactive:hover {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
}

.chart-edit-main {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

:global(.dark) .chart-edit-main {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.chart-edit-breadcrumbs {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .chart-edit-breadcrumbs {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.chart-edit-nav {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .chart-edit-nav {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}
</style>
