<template>
  <div class="bg-background flex h-dvh flex-col overflow-hidden" ref="dropZoneRef">
    <nav
      class="dashboard-header relative flex shrink-0 items-center justify-between rounded-b-xl py-1.5 pr-4 pl-6 text-sm text-foreground print:hidden border-b"
    >
      <div class="flex min-w-0 flex-auto items-center">
        <div class="flex min-w-0 flex-auto items-center">
          <MainMenu @action="onScenarioAction" @ui-action="onUiAction" />
          <button
            type="button"
            class="hidden truncate pl-3 mr-4 text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 sm:block transition-colors duration-200"
            @click="showInfo()"
          >
            {{ activeScenario.store.state.info.name }}
          </button>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          @click="showSearch = true"
          class="header-icon-button search-button inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-blue-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset transition-all duration-200"
        >
          <SearchIcon class="block h-5 w-5 transition-all duration-300" />
        
        </button>
        <div class="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <router-link
            :to="{ name: MAP_EDIT_MODE_ROUTE }"
            title="حالت ویرایش نقشه"
            exact-active-class="text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
            class="header-icon-button map-button inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-slate-600 hover:text-green-600 dark:hover:text-green-400 focus:ring-2 focus:ring-green-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset transition-all duration-200"
          >
            <GlobeAltIcon class="h-5 w-5 transition-all duration-300" />
          </router-link>
          <router-link
            :to="{ name: GRID_EDIT_ROUTE }"
            title="حالت ویرایش جدول"
            exact-active-class="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
            class="header-icon-button grid-button inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 dark:hover:text-blue-400 focus:ring-2 focus:ring-blue-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset transition-all duration-200"
          >
            <TableIcon class="h-5 w-5 transition-all duration-300" />
          </router-link>
          <router-link
            :to="{ name: CHART_EDIT_MODE_ROUTE }"
            title="حالت ویرایش نمودار"
            exact-active-class="text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30"
            class="header-icon-button chart-button inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-slate-600 hover:text-orange-600 dark:hover:text-orange-400 focus:ring-2 focus:ring-orange-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset transition-all duration-200"
          >
            <IconSitemap class="h-5 w-5 transition-all duration-300" />
           
          </router-link>
        </div>
        <div class="flex items-center">
          <button
            @click="undo()"
            class="header-icon-button undo-button hidden items-center justify-center rounded-lg p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-yellow-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset disabled:opacity-40 disabled:cursor-not-allowed sm:block transition-all duration-200"
            title="لغو عمل (ctrl+z)"
            :disabled="!canUndo"
          >
            <IconUndo class="block h-5 w-5 transition-all duration-300" />
          </button>
          <button
            @click="redo()"
            class="header-icon-button redo-button hidden items-center justify-center rounded-lg p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-teal-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset disabled:opacity-40 disabled:cursor-not-allowed sm:block transition-all duration-200"
            title="انجام مجدد عمل"
            :disabled="!canRedo"
          >
          
            <IconRedo class="block h-5 w-5 transition-all duration-300" />
          </button>
        </div>
        <button
          @click="showKeyboardShortcuts"
          class="header-icon-button keyboard-button hidden items-center justify-center rounded-lg p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-pink-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset sm:block transition-all duration-200"
          title="نمایش میانبرهای صفحه کلید"
        >
       
            <IconKeyboard class="block h-5 w-5 transition-all duration-300" />
        </button>

        <div class="relative hidden sm:block" ref="themeMenuRef">
          <button
            @click="themeMenuOpen = !themeMenuOpen"
            class="header-icon-button palette-button inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-white focus:ring-2 focus:ring-indigo-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset transition-all duration-200"
            title="انتخاب تم"
          >
            <IconPalette class="block h-5 w-5 transition-all duration-300" />
          </button>
          <div
            v-if="themeMenuOpen"
            dir="rtl"
            class="absolute left-0 top-full z-50 mt-2 w-60 rounded-2xl border border-slate-200/70 bg-white/95 p-3 text-right shadow-2xl backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/95"
          >
            <div
              class="flex items-center justify-between border-b border-slate-200/70 pb-2 text-xs font-semibold text-slate-700 dark:border-slate-700/60 dark:text-slate-200"
            >
              <span>انتخاب تم</span>
              <button class="theme-menu-close-button text-[11px]" @click="themeMenuOpen = false">بستن</button>
            </div>
            <p class="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              یکی از ترکیب‌رنگ‌های زیر را برای محیط کار انتخاب کنید.
            </p>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <button
                v-for="option in themeOptions"
                :key="option.key"
                @click="selectTheme(option.key)"
                class="flex flex-col rounded-xl border p-2 text-right transition-all duration-200"
                :class="selectedTheme === option.key ? 'scale-[1.02]' : 'hover:-translate-y-0.5'"
                :style="getThemeOptionStyle(option.key)"
              >
                <span class="text-[11px] font-medium text-slate-600 dark:text-slate-300">{{ option.label }}</span>
                <span class="mt-2 block h-8 w-full rounded-lg" :style="{ background: option.preview }"></span>
              </button>
            </div>
          </div>
        </div>

        <button
          class="header-icon-button settings-button inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white focus:ring-2 focus:ring-red-300 dark:focus:ring-white focus:outline-hidden focus:ring-inset transition-all duration-200"
          @click="isOpen = !isOpen"
        >
          <SettingsIcon class="block h-5 w-5 transition-all duration-300" />
        </button>
      </div>
    </nav>
    <router-view v-slot="{ Component }">
      <!--      <keep-alive include="ScenarioEditorGeo">-->
      <component
        :is="Component"
        @show-export="showExportModal = true"
        @show-load="showLoadModal = true"
        @show-settings="isOpen = true"
      />
      <!--      </keep-alive>-->
    </router-view>
    <GlobalEvents
      v-if="shortcutsEnabled"
      :filter="inputEventFilter"
      @keyup="onGeneralKeyup"
      @keydown.ctrl.k.prevent="showSearch = true"
      @keydown.meta.k.prevent="showSearch = true"
      @keyup.prevent.alt.k="showSearch = true"
    />
    <GlobalEvents
      :filter="inputEventFilter"
      @keydown.meta.z.exact="undo()"
      @keyup.ctrl.z.exact="undo()"
      @keydown.meta.shift.z="redo()"
      @keyup.ctrl.shift.z="redo()"
      @keyup.ctrl.y="redo()"
    />
    <ShortcutsModal v-model="shortcutsModalVisible" />
    <MainViewSlideOver v-model="isOpen" />
    <CommandPalette
      v-model="showSearch"
      @select-unit="onUnitSelect"
      @select-feature="onFeatureSelect"
      @select-layer="onLayerSelect"
      @select-image-layer="onImageLayerSelect"
      @select-event="onEventSelect"
      @select-place="onPlaceSelectHook.trigger($event)"
      @select-action="onScenarioAction"
    />
    <AppNotifications />
    <LoadScenarioDialog v-if="showLoadModal" v-model="showLoadModal" />
    <InputDateModal
      v-if="showDateModal"
      v-model="showDateModal"
      :dialog-title="dateModalTitle"
      :timestamp="initialDateModalValue"
      @update:timestamp="confirmDateModal($event)"
      :time-zone="dateModalTimeZone"
      @cancel="cancelDateModal"
    />
    <SymbolPickerModal
      v-if="showSidcModal"
      :sidc="initialSidcModalValue"
      @update:sidc="confirmSidcModal($event)"
      @cancel="cancelSidcModal"
      :dialog-title="sidcModalTitle"
      :hide-modifiers="hideModifiers"
      :hide-symbol-color="hideSymbolColor"
      :inherited-symbol-options="inheritedSymbolOptions"
      :symbol-options="symbolOptions"
      :initial-tab="sidcModalInitialTab"
      :reinforced-status="initialReinforcedReduced"
    />
    <ExportScenarioModal v-if="showExportModal" v-model="showExportModal" />
    <ImportModal v-if="showImportModal" v-model="showImportModal" />
    <div
      v-if="isOverDropZone"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80"
    >
      <p class="rounded border bg-white/40 p-4 text-gray-900">فایل را برای وارد کردن داده‌ها رها کنید</p>
    </div>
    <div
      v-if="uiStore.debugMode"
      class="bg-opacity-70 fixed bottom-2 left-2 z-50 rounded bg-gray-50 text-gray-900 print:hidden"
    >
      

      <p></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onUnmounted, provide, ref } from "vue";
import { GlobalEvents } from "vue-global-events";
import { useDragStore } from "@/stores/dragStore";
import ShortcutsModal from "@/components/ShortcutsModal.vue";

import {
  Cog6ToothIcon as SettingsIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon as SearchIcon,
  TableCellsIcon as TableIcon,
} from "@heroicons/vue/24/outline";
import { inputEventFilter } from "@/components/helpers";
import { useRoute, useRouter } from "vue-router";
import { useUiStore } from "@/stores/uiStore";
import {
  IconKeyboard,
  IconPalette,
  IconRedoVariant as IconRedo,
  IconSitemap,
  IconUndoVariant as IconUndo,
} from "@iconify-prerendered/vue-mdi";
import {
  applyThemePreset,
  initializeTheme,
  persistThemeSelection,
  themeOptions as sharedThemeOptions,
  themePresets,
  type ThemeKey,
} from "@/constants/themePresets";

import { createEventHook, onClickOutside, useClipboard, useTitle, watchOnce } from "@vueuse/core";
import MainViewSlideOver from "@/components/MainViewSlideOver.vue";
import { type ScenarioActions, TAB_LAYERS, type UiAction } from "@/types/constants";
import AppNotifications from "@/components/AppNotifications.vue";
import { useNotifications } from "@/composables/notifications";
import type { FeatureId } from "@/types/scenarioGeoModels";
import NProgress from "nprogress";
import type { TScenario } from "@/scenariostore";
import type { EntityId } from "@/types/base";
import {
  activeFeatureStylesKey,
  activeLayerKey,
  activeParentKey,
  activeScenarioKey,
  currentScenarioTabKey,
  searchActionsKey,
  sidcModalKey,
  timeModalKey,
} from "@/components/injects";
import { useFeatureStyles } from "@/geo/featureStyles";
import type { EventSearchResult } from "@/components/types";
import { useDateModal, useSidcModal } from "@/composables/modals";
import { storeToRefs } from "pinia";
import {
  CHART_EDIT_MODE_ROUTE,
  GRID_EDIT_ROUTE,
  MAP_EDIT_MODE_ROUTE,
} from "@/router/names";
import { useFileDropZone } from "@/composables/filedragdrop";
import { useTabStore } from "@/stores/tabStore";
import CommandPalette from "@/components/CommandPalette.vue";
import type { PhotonSearchResult } from "@/composables/geosearching";
import { useSelectedItems } from "@/stores/selectedStore";
import MainMenu from "@/modules/scenarioeditor/MainMenu.vue";
import { useMapSettingsStore } from "@/stores/mapSettingsStore";
import { useTimeFormatterProvider } from "@/stores/timeFormatStore";

const props = defineProps<{ activeScenario: TScenario }>();

const LoadScenarioDialog = defineAsyncComponent(() => import("./LoadScenarioDialog.vue"));
const SymbolPickerModal = defineAsyncComponent(
  () => import("@/components/SymbolPickerModal.vue"),
);
const InputDateModal = defineAsyncComponent(
  () => import("@/components/InputDateModal.vue"),
);

const ExportScenarioModal = defineAsyncComponent(
  () => import("@/components/ExportScenarioModal.vue"),
);

const ImportModal = defineAsyncComponent(() => import("@/components/ImportModal.vue"));

const dropZoneRef = ref<HTMLDivElement>();
const activeParentId = ref<EntityId | undefined | null>(null);
const activeLayerId = ref<FeatureId | undefined | null>(null);
const scnFeatureStyles = useFeatureStyles(props.activeScenario.geo);

const uiTabs = useTabStore();
const { activeScenarioTab } = storeToRefs(uiTabs);
const selectedItems = useSelectedItems();
provide(activeParentKey, activeParentId);
provide(activeLayerKey, activeLayerId);
provide(activeScenarioKey, props.activeScenario);
provide(activeFeatureStylesKey, scnFeatureStyles);
provide(currentScenarioTabKey, activeScenarioTab);

const onUnitSelectHook = createEventHook<{ unitId: EntityId }>();
const onLayerSelectHook = createEventHook<{ layerId: FeatureId }>();
const onImageLayerSelectHook = createEventHook<{ layerId: FeatureId }>();
const onFeatureSelectHook = createEventHook<{
  featureId: FeatureId;
  layerId: FeatureId;
}>();
const onEventSelectHook = createEventHook<EventSearchResult>();
const onPlaceSelectHook = createEventHook<PhotonSearchResult>();
const onScenarioActionHook = createEventHook<{ action: ScenarioActions }>();
provide(searchActionsKey, {
  onUnitSelectHook,
  onLayerSelectHook,
  onFeatureSelectHook,
  onEventSelectHook,
  onPlaceSelectHook,
  onImageLayerSelectHook,
  onScenarioActionHook,
});

const { state, undo, redo, canRedo, canUndo } = props.activeScenario.store;

const {
  unitActions,
  io,
  helpers: { getUnitById },
} = props.activeScenario;
const route = useRoute();
const router = useRouter();
const { copy: copyToClipboard, copied } = useClipboard();

const isOpen = ref(false);
const showLoadModal = ref(false);
const shortcutsModalVisible = ref(false);
const showExportModal = ref(false);
const showImportModal = ref(false);
const themeOptions = sharedThemeOptions;
const selectedTheme = ref<ThemeKey>(initializeTheme());
const themeMenuOpen = ref(false);
const themeMenuRef = ref<HTMLElement | null>(null);

onClickOutside(themeMenuRef, () => {
  if (themeMenuOpen.value) themeMenuOpen.value = false;
});

const hexToRgba = (hex: string, alpha: number) => {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getThemeOptionStyle = (key: ThemeKey) => {
  const preset = themePresets[key];
  if (!preset) return {};
  if (selectedTheme.value === key) {
    return {
      borderColor: preset.accent,
      backgroundColor: hexToRgba(preset.accent, 0.08),
      boxShadow: `0 12px 30px ${hexToRgba(preset.accent, 0.35)}`,
    };
  }
  return {
    borderColor: "rgba(148, 163, 184, 0.45)",
    backgroundColor: "rgba(248, 250, 252, 0.85)",
  };
};

const selectTheme = (themeKey: ThemeKey) => {
  applyThemePreset(themeKey);
  persistThemeSelection(themeKey);
  selectedTheme.value = themeKey;
  themeMenuOpen.value = false;
};

useTimeFormatterProvider({ activeScenario: props.activeScenario });

const uiStore = useUiStore();
const { showSearch } = storeToRefs(uiStore);

const mapStore = useMapSettingsStore();
mapStore.baseLayerName = state.mapSettings.baseMapId;

const originalTitle = useTitle().value;
const windowTitle = computed(() => state.info.name);
const { send } = useNotifications();

useTitle(windowTitle);

const {
  showDateModal,
  confirmDateModal,
  cancelDateModal,
  initialDateModalValue,
  dateModalTimeZone,
  dateModalTitle,
  getModalTimestamp,
} = useDateModal();

provide(timeModalKey, { getModalTimestamp });

const {
  getModalSidc,
  confirmSidcModal,
  showSidcModal,
  cancelSidcModal,
  initialSidcModalValue,
  sidcModalTitle,
  hideModifiers,
  hideSymbolColor,
  symbolOptions,
  inheritedSymbolOptions,
  initialTab: sidcModalInitialTab,
  initialReinforcedReduced,
} = useSidcModal();
provide(sidcModalKey, { getModalSidc });

onUnmounted(() => {
  useTitle(originalTitle);
});

const shortcutsEnabled = computed(() => !uiStore.modalOpen);

const onUnitSelect = (unitId: EntityId) => {
  onUnitSelectHook.trigger({ unitId });
};

const onLayerSelect = (layerId: FeatureId) => {
  onLayerSelectHook.trigger({ layerId });
};

const onImageLayerSelect = (layerId: FeatureId) => {
  onImageLayerSelectHook.trigger({ layerId });
};

const onEventSelect = (e: EventSearchResult) => {
  onEventSelectHook.trigger(e);
};

const onFeatureSelect = (featureId: FeatureId, layerId: FeatureId) => {
  onFeatureSelectHook.trigger({ featureId, layerId });
};

async function onScenarioAction(action: ScenarioActions) {
  if (action === "addSide") {
    unitActions.addSide();
  } else if (action === "save") {
    const preId = state.id;
    const newId = await io.saveToIndexedDb();
    send({ message: "Scenario saved to IndexedDb" });
    if (preId !== newId) {
      await router.push({ name: MAP_EDIT_MODE_ROUTE, params: { scenarioId: newId } });
    }
  } else if (action === "load") {
    io.loadFromLocalStorage();
    showInfo();
    send({ message: "Scenario loaded from local storage" });
  } else if (action === "exportJson") {
    await io.downloadAsJson();
  } else if (action === "loadNew") {
    showLoadModal.value = true;
  } else if (action === "exportToClipboard") {
    await copyToClipboard(io.stringifyScenario());
    if (copied.value) send({ message: "Scenario copied to clipboard" });
  } else if (action === "export") {
    showExportModal.value = true;
  } else if (action === "import") {
    showImportModal.value = true;
  } else if (action === "showInfo") {
    showInfo();
  } else if (action === "duplicate") {
    const scenarioId = await io.duplicateScenario();
    await router.push({ name: MAP_EDIT_MODE_ROUTE, params: { scenarioId } });
  } else if (action === "createNew") {
    // Redirect to dashboard for creating new scenario
    const parentOrigin = window.parent !== window 
      ? (document.referrer ? new URL(document.referrer).origin : window.location.origin)
      : window.location.origin;
    window.location.href = parentOrigin;
  } else if (action === "browseSymbols") {
    const activeUnitId = selectedItems.activeUnitId.value;
    let initialSidc = "10031000001211000000";
    if (activeUnitId) {
      initialSidc = getUnitById(activeUnitId).sidc;
    }
    await getModalSidc(initialSidc, { title: "مرورگر نمادها", initialTab: 1 });
  }
  await onScenarioActionHook.trigger({ action });
}

function onUiAction(action: UiAction) {
  if (action === "showKeyboardShortcuts") {
    showKeyboardShortcuts();
  }
  if (action === "showSearch") {
    showSearch.value = true;
  }
}

function showKeyboardShortcuts() {
  shortcutsModalVisible.value = true;
}

function onGeneralKeyup(event: KeyboardEvent) {
  // نمایش میانبرها وقتی کلید '?' فشرده می‌شود (Shift + '/')
  if (event.key === '?' || (event.shiftKey && event.key === '/')) {
    showKeyboardShortcuts();
  }
}

watchOnce(
  () => activeScenarioTab.value === TAB_LAYERS,
  () => {
    NProgress.start();
  },
);

function onDrop(files: File[] | null) {
  if (!files || !files.length) return;
  const dragState = useDragStore();
  dragState.draggedFiles = files;
  showImportModal.value = true;
}

function showInfo() {
  selectedItems.clear();
  selectedItems.showScenarioInfo.value = true;
}

const { isOverDropZone } = useFileDropZone(dropZoneRef, onDrop);

if (state.layers.length > 0) {
  activeLayerId.value = state.layers[0];
}
</script>
<style scoped>
.theme-menu-close-button {
  color: color-mix(in srgb, var(--color-primary) 80%, black);
}

.theme-menu-close-button:hover {
  color: color-mix(in srgb, var(--color-primary) 100%, black);
}

:global(.dark) .theme-menu-close-button {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
}

:global(.dark) .theme-menu-close-button:hover {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
  opacity: 0.8;
}

/* انیمیشن‌های آیکون‌های هدبار */
.header-icon-button {
  position: relative;
  overflow: visible;
}

.header-icon-button::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.header-icon-button:hover::before {
  opacity: 1;
}

.header-icon-button:active {
  transform: scale(0.95);
}

.header-icon-button svg,
.header-icon-button .h-5 {
  will-change: transform;
  transform-origin: center;
}

/* انیمیشن pulse برای آیکون‌های فعال */
.header-icon-button.router-link-active svg,
.header-icon-button.router-link-active .h-5 {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 2px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 6px currentColor);
  }
}

/* انیمیشن‌های متنوع برای هر آیکون */

/* آیکون همبرگر - چرخش 90 درجه */
.hamburger-button:hover svg {
  transform: rotate(90deg) scale(1.15);
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
}

/* آیکون چرخ دنده - چرخش 360 درجه */
.settings-button:hover svg {
  animation: spin-smooth 0.8s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.4));
}

@keyframes spin-smooth {
  from {
    transform: rotate(0deg) scale(1);
  }
  to {
    transform: rotate(360deg) scale(1.2);
  }
}

/* آیکون جستجو - pulse + rotate 90 */
.search-button:hover svg {
  animation: search-pulse 0.6s ease-in-out;
  filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4));
}

@keyframes search-pulse {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.3) rotate(90deg);
  }
  100% {
    transform: scale(1.25) rotate(90deg);
  }
}

/* آیکون نقشه - چرخش 180 درجه */
.map-button:hover svg {
  transform: rotate(180deg) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

/* آیکون جدول - چرخش معکوس و scale */
.grid-button:hover svg {
  transform: rotate(-15deg) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.4));
}

/* آیکون نمودار - چرخش 45 درجه */
.chart-button:hover svg {
  transform: rotate(45deg) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4));
}

/* آیکون Undo - چرخش به چپ */
.undo-button:hover svg {
  transform: rotate(-90deg) scale(1.15);
  filter: drop-shadow(0 2px 6px rgba(234, 179, 8, 0.4));
}

/* آیکون Redo - چرخش به راست */
.redo-button:hover svg {
  transform: rotate(90deg) scale(1.15);
  filter: drop-shadow(0 2px 6px rgba(20, 184, 166, 0.4));
}

/* آیکون کیبورد - bounce */
.keyboard-button:hover svg {
  animation: keyboard-bounce 0.5s ease-in-out;
  filter: drop-shadow(0 2px 6px rgba(236, 72, 153, 0.4));
}

@keyframes keyboard-bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.2);
  }
}

/* آیکون پالت - چرخش 180 درجه */
.palette-button:hover svg {
  transform: rotate(180deg) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4));
}

/* افکت کلی برای همه آیکون‌ها */
:global(.dark) .header-icon-button:hover svg,
:global(.dark) .header-icon-button:hover .h-5 {
  filter: drop-shadow(0 2px 6px rgba(255, 255, 255, 0.15));
}
</style>
