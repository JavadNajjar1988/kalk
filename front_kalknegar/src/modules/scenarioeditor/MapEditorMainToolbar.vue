<template>
  <nav
    class="map-editor-main-toolbar pointer-events-auto flex w-auto items-center justify-between p-2 text-sm sm:p-3 rounded-2xl shadow-xl text-foreground backdrop-blur-md"
  >
    <section class="flex items-center justify-between">
      <MainToolbarButton
        title="ابزار انتخاب شده را پس از کشیدن فعال نگه دار"
        @click="toggleAddMultiple()"
        class="hidden sm:flex"
      >
        <IconLockOutline v-if="addMultiple" class="size-5" />
        <IconLockOpenVariantOutline v-else class="size-6" />
      </MainToolbarButton>
      <MainToolbarButton @click="toggleMoveUnit(false)" :active="!moveUnitEnabled">
        <SelectIcon class="size-6" />
      </MainToolbarButton>
      <MainToolbarButton
        :active="moveUnitEnabled"
        @click="toggleMoveUnit(true)"
        title="جابجایی واحد"
      >
        <MoveIcon class="size-6" />
      </MainToolbarButton>
      <MainToolbarButton
        @click="emit('show-settings')"
        title="نمایش تنظیمات"
        class="hidden md:flex"
      >
        <SettingsIcon class="size-6" />
      </MainToolbarButton>
      <div class="border-slate-200 dark:border-slate-600 h-7 border-l-2 sm:mx-1" />
      <MainToolbarButton
        :active="store.currentToolbar === 'measurements'"
        @click="store.toggleToolbar('measurements')"
        title="اندازه‌گیری‌ها"
      >
        <MeasurementIcon class="size-6" />
      </MainToolbarButton>
      <MainToolbarButton
        :active="store.currentToolbar === 'draw'"
        @click="store.toggleToolbar('draw')"
        title="کشیدن"
      >
        <DrawIcon class="size-6" />
      </MainToolbarButton>
      <MainToolbarButton
        title="مسیر واحد"
        :active="store.currentToolbar === 'track'"
        @click="store.toggleToolbar('track')"
      >
        <IconMapMarkerPath class="size-6" />
      </MainToolbarButton>
      <div class="border-slate-200 dark:border-slate-600 h-7 border-l-2 sm:mx-1" />
      <div class="ml-2 flex items-center">
        <EchelonPickerPopover
          :symbol-options="symbolOptions"
          :select-echelon="selectEchelon"
        />
        <PanelSymbolButton
          :size="22"
          :sidc="computedSidc"
          class="group relative ml-2 sm:ml-5"
          :symbol-options="symbolOptions"
          @click="addUnit(activeSidc)"
          title="افزودن واحد"
          :disabled="!activeParentId || unitActions.isUnitLocked(activeParentId)"
        >
          <AddSymbolIcon
            class="bg-opacity-70 absolute -right-2 bottom-0 h-4 w-4 rounded-full bg-white text-gray-600 group-hover:text-gray-900"
          />
        </PanelSymbolButton>
        <SymbolPickerPopover :symbol-options="symbolOptions" :add-unit="addUnit" />
      </div>
    </section>
    <section class="flex items-center">
      <div class="border-slate-200 dark:border-slate-600 -mx-1 h-8 border-l-2 sm:mx-2" />
      <MainToolbarButton title="واگرد" @click="undo()" :disabled="!canUndo">
        <UndoIcon class="size-6" />
      </MainToolbarButton>
      <MainToolbarButton title="انجام مجدد" @click="redo()" :disabled="!canRedo">
        <RedoIcon class="size-6" />
      </MainToolbarButton>
      <div class="border-slate-200 dark:border-slate-600 mx-2 hidden h-8 border-l-2 sm:block" />
      <MainToolbarButton
        title="انتخاب زمان و تاریخ"
        class="hidden sm:flex"
        @click="emit('open-time-modal')"
      >
        <span class="sr-only">انتخاب زمان و تاریخ</span>
        <CalendarIcon class="size-5" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="روز قبل"
        class="hidden sm:flex"
        @click="emit('dec-day')"
      >
        <span class="sr-only">روز قبل</span>
        <IconChevronLeft class="size-5" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton title="روز بعد" class="hidden sm:flex" @click="emit('inc-day')">
        <span class="sr-only">روز بعد</span>
        <IconChevronRight class="size-5" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="رویداد قبلی"
        class="hidden sm:flex"
        @click="emit('prev-event')"
      >
        <span class="sr-only">رویداد قبلی</span>
        <IconSkipPrevious class="size-5" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="رویداد بعدی"
        class="hidden sm:flex"
        @click="emit('next-event')"
      >
        <span class="sr-only">رویداد بعدی</span>
        <IconSkipNext class="size-5 w-5" aria-hidden="true" />
      </MainToolbarButton>
    </section>
    <FloatingPanel
      v-if="isGetLocationActive"
      class="bg-opacity-75 absolute bottom-14 overflow-visible p-2 px-4 text-sm sm:bottom-16 sm:left-1/2 sm:-translate-x-1/2"
    >
      روی نقشه یا آرایش نبرد کلیک کنید تا واحد را قرار دهید.
      <Button type="button" variant="link" size="sm" @click="cancelGetLocation()">
        لغو
      </Button>
    </FloatingPanel>
  </nav>
</template>
<script setup lang="ts">
import {
  PhCaretLeft as IconChevronLeft,
  PhCaretRight as IconChevronRight,
  PhGear as SettingsIcon,
  PhCursor as SelectIcon,
  PhHandGrabbing as MoveIcon,
  PhLockOpen as IconLockOpenVariantOutline,
  PhLock as IconLockOutline,
  PhPath as IconMapMarkerPath,
  PhPencilSimple as DrawIcon,
  PhPlus as AddSymbolIcon,
  PhArrowClockwise as RedoIcon,
  PhCompass as MeasurementIcon,
  PhSkipForward as IconSkipNext,
  PhSkipBack as IconSkipPrevious,
  PhArrowCounterClockwise as UndoIcon,
} from "@phosphor-icons/vue";
import MainToolbarButton from "@/components/MainToolbarButton.vue";
import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import { injectStrict } from "@/utils";
import { activeMapKey, activeScenarioKey } from "@/components/injects";
import { storeToRefs } from "pinia";
import { useUnitSettingsStore } from "@/stores/geoStore";
import { useEventBus, useToggle } from "@vueuse/core";
import PanelSymbolButton from "@/components/PanelSymbolButton.vue";
import FloatingPanel from "@/components/FloatingPanel.vue";
import { computed, onMounted, type Ref, watch } from "vue";
import { SID_INDEX, Sidc } from "@/symbology/sidc";
import { useGetMapLocation } from "@/composables/geoMapLocation";
import { useMapSelectStore } from "@/stores/mapSelectStore";
import { useToolbarUnitSymbolData } from "@/composables/mainToolbarData";
import { useActiveUnitStore } from "@/stores/dragStore";
import { orbatUnitClick } from "@/components/eventKeys";
import { CalendarIcon } from "@heroicons/vue/24/solid";
import SymbolPickerPopover from "@/modules/scenarioeditor/SymbolPickerPopover.vue";
import EchelonPickerPopover from "@/modules/scenarioeditor/EchelonPickerPopover.vue";
import { Button } from "@/components/ui/button";

const emit = defineEmits([
  "open-time-modal",
  "inc-day",
  "dec-day",
  "next-event",
  "prev-event",
  "show-settings",
]);

const {
  store: { undo, redo, canRedo, canUndo, groupUpdate, state },
  unitActions,
  geo: { addUnitPosition },
  helpers: { getSideById },
} = injectStrict(activeScenarioKey);
const mapRef = injectStrict(activeMapKey);

const store = useMainToolbarStore();
const { addMultiple } = storeToRefs(store);
const { moveUnitEnabled } = storeToRefs(useUnitSettingsStore());
const selectStore = useMapSelectStore();
const toggleAddMultiple = useToggle(addMultiple);
const bus = useEventBus(orbatUnitClick);
const { activeUnitId, resetActiveParent, activeParent, activeParentId } =
  useActiveUnitStore();

const { currentSid, currentEchelon, activeSidc } = useToolbarUnitSymbolData();

const computedSidc = computed(() => {
  const parsedSidc = new Sidc(activeSidc.value);
  parsedSidc.standardIdentity = currentSid.value;
  parsedSidc.emt = "00";
  parsedSidc.hqtfd = "0";
  return parsedSidc.toString();
});

const toggleMoveUnit = useToggle(moveUnitEnabled);

const symbolOptions = computed(() =>
  activeParent.value
    ? {
        ...unitActions.getCombinedSymbolOptions(activeParent.value, true),
        outlineWidth: 5,
      }
    : {},
);

const {
  start: startGetLocation,
  isActive: isGetLocationActive,
  cancel: cancelGetLocation,
  onGetLocation,
  onCancel,
  onStart,
} = useGetMapLocation(mapRef.value, {
  cancelOnClickOutside: false,
  stopPropagationOnClickOutside: false,
});

function addUnit(sidc: string, closePopover?: (ref?: Ref | HTMLElement) => void) {
  activeSidc.value = sidc;
  closePopover && closePopover();
  startGetLocation();
}

onMounted(() => {
  if (!activeParentId.value) resetActiveParent();
});

onCancel(() => {
  selectStore.hoverEnabled = true;
});

onStart(() => {
  selectStore.hoverEnabled = false;
  store.clearToolbar();
});

onGetLocation((location) => {
  selectStore.hoverEnabled = true;
  groupUpdate(() => {
    if (!activeParentId.value || unitActions.isUnitLocked(activeParentId.value)) return;
    const name = `${(activeParent.value?.subUnits?.length ?? 0) + 1}`;
    const sidc = new Sidc(activeSidc.value!);
    sidc.emt = currentEchelon.value;
    sidc.standardIdentity = currentSid.value;
    const unitId = unitActions.createSubordinateUnit(activeParentId.value, {
      sidc: sidc.toString(),
      name,
    });
    unitId && addUnitPosition(unitId, location);
  });
  if (addMultiple.value && activeSidc.value) {
    addUnit(activeSidc.value);
  }
});

bus.on((unit) => {
  if (isGetLocationActive.value) {
    if (!(addMultiple.value && activeSidc.value)) {
      cancelGetLocation();
    }
    const name = `${(activeParent.value?.subUnits?.length ?? 0) + 1}`;
    const sidc = new Sidc(activeSidc.value!);
    sidc.emt = currentEchelon.value;
    sidc.standardIdentity = unit.sidc[SID_INDEX];
    const unitId = unitActions.createSubordinateUnit(unit.id, {
      sidc: sidc.toString(),
      name,
    });
  }
});

watch(activeParent, (unitOrSideGroup) => {
  if (!unitOrSideGroup) return;
  if ("sidc" in unitOrSideGroup) {
    currentSid.value = unitOrSideGroup.sidc[SID_INDEX];
  } else {
    currentSid.value = getSideById(unitOrSideGroup._pid).standardIdentity;
  }
});

function selectEchelon(sidc: string) {
  currentEchelon.value = new Sidc(sidc).emt;
}
</script>
<style scoped>
.map-editor-main-toolbar {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
}

:global(.dark) .map-editor-main-toolbar {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .map-editor-main-toolbar {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  
  :global(.dark) .map-editor-main-toolbar {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
}
</style>
