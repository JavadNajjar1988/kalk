<template>
  <div class="bg-background flex h-dvh flex-col overflow-hidden" ref="dropZoneRef">
    <nav
      class="dashboard-header scenario-header relative flex shrink-0 items-center justify-between px-3 py-1.5 text-sm text-foreground print:hidden"
    >
      <div class="flex min-w-0 flex-auto items-center">
        <div class="flex min-w-0 flex-auto items-center">
          <MainMenu @action="onScenarioAction" @ui-action="onUiAction" />
          <button
            type="button"
            class="scenario-title-button hidden truncate pl-3 mr-4 sm:block"
            @click="showInfo()"
          >
            {{ activeScenario.store.state.info.name }}
          </button>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          @click="showSearch = true"
          class="header-icon-button search-button inline-flex items-center justify-center rounded-md p-1.5"
        >
          <SearchIcon class="block h-5 w-5 transition-all duration-300" />
        
        </button>
        <div class="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <RecordingState />
        </div>
        <div class="header-mode-switcher flex items-center gap-1">
          <router-link
            :to="{ name: MAP_EDIT_MODE_ROUTE }"
            title="حالت ویرایش نقشه"
            class="header-icon-button map-button inline-flex items-center justify-center rounded-md p-1.5"
          >
            <GlobeAltIcon class="h-5 w-5 transition-all duration-300" />
          </router-link>
          <router-link
            :to="{ name: GRID_EDIT_ROUTE }"
            title="حالت ویرایش جدول"
            class="header-icon-button grid-button inline-flex items-center justify-center rounded-md p-1.5"
          >
            <TableIcon class="h-5 w-5 transition-all duration-300" />
          </router-link>
          <router-link
            :to="{ name: CHART_EDIT_MODE_ROUTE }"
            title="حالت ویرایش نمودار"
            class="header-icon-button chart-button inline-flex items-center justify-center rounded-md p-1.5"
          >
            <IconSitemap class="h-5 w-5 transition-all duration-300" />
           
          </router-link>
        </div>
        <div class="flex items-center">
          <button
            @click="undo()"
            class="header-icon-button undo-button hidden items-center justify-center rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-40 sm:block"
            title="لغو عمل (ctrl+z)"
            :disabled="!canUndo"
          >
            <IconUndo class="block h-5 w-5 transition-all duration-300" />
          </button>
          <button
            @click="redo()"
            class="header-icon-button redo-button hidden items-center justify-center rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-40 sm:block"
            title="انجام مجدد عمل"
            :disabled="!canRedo"
          >
          
            <IconRedo class="block h-5 w-5 transition-all duration-300" />
          </button>
        </div>
        <button
          @click="showKeyboardShortcuts"
          class="header-icon-button keyboard-button hidden items-center justify-center rounded-md p-1.5 sm:block"
          title="نمایش میانبرهای صفحه کلید"
        >
       
            <IconKeyboard class="block h-5 w-5 transition-all duration-300" />
        </button>

        <div class="relative hidden sm:block" ref="themeMenuRef">
          <button
            @click="themeMenuOpen = !themeMenuOpen"
            class="header-icon-button palette-button inline-flex items-center justify-center rounded-md p-1.5"
            title="انتخاب تم"
          >
            <IconPalette class="block h-5 w-5 transition-all duration-300" />
          </button>
          <div
            v-if="themeMenuOpen"
            dir="rtl"
            class="theme-menu-panel absolute left-0 top-full z-50 mt-2 w-60 rounded-xl border p-3 text-right"
          >
            <div
              class="flex items-center justify-between border-b pb-2 text-xs font-semibold text-foreground"
            >
              <span>انتخاب تم</span>
              <button class="theme-menu-close-button text-[11px]" @click="themeMenuOpen = false">بستن</button>
            </div>
            <p class="mt-2 text-[11px] text-muted-foreground">
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
                <span class="text-[11px] font-medium text-muted-foreground">{{ option.label }}</span>
                <span class="mt-2 block h-8 w-full rounded-lg" :style="{ background: option.preview }"></span>
              </button>
            </div>
          </div>
        </div>

        <button
          class="header-icon-button settings-button inline-flex items-center justify-center rounded-md p-1.5"
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
import RecordingState from "@/components/RecordingState.vue";
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
if (state.mapSettings.baseMapId !== mapStore.baseLayerName) {
  props.activeScenario.store.update((s) => {
    s.mapSettings.baseMapId = mapStore.baseLayerName;
  });
}

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
.scenario-header {
  min-height: 52px;
}

.scenario-title-button {
  max-width: min(36vw, 460px);
  color: rgb(31 41 55);
  font-weight: 600;
  letter-spacing: 0;
  transition: color 0.15s ease;
}

.scenario-title-button:hover {
  color: rgb(15 23 42);
}

.header-mode-switcher {
  border: 1px solid rgba(148, 158, 171, 0.45);
  background: rgba(238, 240, 242, 0.95);
  border-radius: 0.75rem;
  padding: 0.2rem;
  gap: 0.2rem;
}

.header-icon-button {
  color: rgb(75 85 99) !important;
  border-radius: 0.5rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.header-icon-button:hover {
  background-color: rgba(229, 231, 235, 0.95) !important;
  color: rgb(17 24 39) !important;
}

.header-icon-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.45);
}

.header-icon-button:active {
  transform: translateY(1px);
}

.header-icon-button.router-link-active,
.header-icon-button.router-link-exact-active {
  background-color: rgba(141, 165, 58, 0.24) !important;
  color: rgb(42 55 18) !important;
}

.theme-menu-panel {
  background-color: var(--surface-panel);
  border-color: var(--surface-border);
  box-shadow: 0 12px 30px var(--surface-shadow);
}

.theme-menu-close-button {
  color: var(--color-muted-foreground);
}

.theme-menu-close-button:hover {
  color: var(--color-foreground);
}

:global(.dark) .scenario-title-button {
  color: rgb(226 232 240);
}

:global(.dark) .scenario-title-button:hover {
  color: rgb(248 250 252);
}

:global(.dark) .header-mode-switcher {
  border-color: rgba(100, 116, 139, 0.5);
  background: rgba(30, 41, 59, 0.85);
}

:global(.dark) .header-icon-button {
  color: rgb(203 213 225) !important;
}

:global(.dark) .header-icon-button:hover {
  background-color: rgba(71, 85, 105, 0.52) !important;
  color: rgb(248 250 252) !important;
}

:global(.dark) .header-icon-button.router-link-active,
:global(.dark) .header-icon-button.router-link-exact-active {
  background-color: rgba(141, 165, 58, 0.32) !important;
  color: rgb(240 253 244) !important;
}
</style>
