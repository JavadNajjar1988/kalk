<template>
  <nav
    class="map-editor-main-toolbar pointer-events-auto flex w-auto flex-row-reverse items-center justify-between rounded-xl border p-2 text-sm text-foreground sm:p-3"
  >
    <section class="flex flex-row-reverse items-center justify-between">
      <MainToolbarButton
        title="ابزار انتخاب شده را پس از کشیدن فعال نگه دار"
        @click="toggleAddMultiple()"
        class="toolbar-icon-button lock-button hidden sm:flex"
      >
        <IconLockOutline v-if="addMultiple" class="size-5 transition-all duration-300" />
        <IconLockOpenVariantOutline v-else class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton @click="setSelectMode()" :active="!moveUnitEnabled" class="toolbar-icon-button select-button">
        <SelectIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton
        :active="moveUnitEnabled"
        @click="setMoveMode()"
        :title="
          recordingStore.isRecordingLocation
            ? 'جابجایی واحد'
            : 'جابجایی واحد غیرفعال است؛ ابتدا «موقعیت واحد» را در منوی ضبط فعال کنید.'
        "
        :disabled="!recordingStore.isRecordingLocation"
        class="toolbar-icon-button move-button"
      >
        <MoveIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton
        @click="emit('show-settings')"
        title="نمایش تنظیمات"
        class="toolbar-icon-button settings-toolbar-button hidden md:flex"
      >
        <SettingsIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <div class="border-slate-200 dark:border-slate-600 h-7 border-r-2 sm:mx-1" />
      <MainToolbarButton
        :active="store.currentToolbar === 'measurements'"
        @click="store.toggleToolbar('measurements')"
        title="اندازه‌گیری‌ها"
        class="toolbar-icon-button measurement-button"
      >
        <MeasurementIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton
        :active="store.currentToolbar === 'draw'"
        @click="store.toggleToolbar('draw')"
        title="کشیدن"
        class="toolbar-icon-button draw-button"
      >
        <DrawIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton
        title="مسیر واحد"
        :active="store.currentToolbar === 'track'"
        @click="store.toggleToolbar('track')"
        class="toolbar-icon-button track-button"
      >
        <IconMapMarkerPath class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton
        title="ویرایش نماد تاکتیکی (محو / برش)"
        :active="store.currentToolbar === 'tactical'"
        @click="store.toggleToolbar('tactical')"
        class="toolbar-icon-button tactical-button hidden sm:flex"
      >
        <TacticalEditIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <div class="border-slate-200 dark:border-slate-600 h-7 border-r-2 sm:mx-1" />
      <div class="mr-2 flex items-center">
        <EchelonPickerPopover
          :symbol-options="symbolOptions"
          :select-echelon="selectEchelon"
        />
        <PanelSymbolButton
          :size="22"
          :sidc="computedSidc"
          class="group relative mr-2 sm:mr-5"
          :symbol-options="symbolOptions"
          @click="addUnit(activeSidc)"
          title="افزودن واحد"
          :disabled="!activeParentId || unitActions.isUnitLocked(activeParentId)"
        >
          <AddSymbolIcon
            class="bg-opacity-70 absolute -left-2 bottom-0 h-4 w-4 rounded-full bg-white text-gray-600 group-hover:text-gray-900 transition-all duration-300"
          />
        </PanelSymbolButton>
        <SymbolPickerPopover :symbol-options="symbolOptions" :add-unit="addUnit" />
      </div>
    </section>
    <section class="flex flex-row-reverse items-center">
      <div class="border-slate-200 dark:border-slate-600 -mx-1 h-8 border-r-2 sm:mx-2" />
      <!-- Playback controls -->
      <MainToolbarButton
        title="اجرا / توقف سناریو"
        @click="playback.togglePlayback()"
        class="toolbar-icon-button playback-button"
      >
        <IconPause v-if="playback.playbackRunning" class="size-6 transition-all duration-300" />
        <IconPlay v-else class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <MainToolbarButton title="منوی پخش" class="toolbar-icon-button playback-menu-button">
            <IconChevronDown class="size-6 transition-all duration-300" />
          </MainToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent :side-offset="10">
          <DropdownMenuItem @select.prevent="playback.togglePlayback()">
            <IconPause v-if="playback.playbackRunning" class="mr-2 h-4 w-4" />
            <IconPlay v-else class="mr-2 h-4 w-4" />
            <span>{{ playback.playbackRunning ? "توقف" : "پخش" }}</span>
            <DropdownMenuShortcut>k, alt+p</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem @select.prevent="playback.increaseSpeed()">
            <IconSpeedometer class="mr-2 h-4 w-4" />
            <span>افزایش سرعت</span>
            <DropdownMenuShortcut>&gt;</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem @select.prevent="playback.decreaseSpeed()">
            <IconSpeedometerSlow class="mr-2 h-4 w-4" />
            <span>کاهش سرعت</span>
            <DropdownMenuShortcut>&lt;</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem v-model="playback.playbackLooping" @select.prevent>
            پخش حلقه‌ای
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem
            inset
            @select.prevent="playback.addMarker(state.currentTime)"
          >
            افزودن نشانگر
            <span class="ml-1"
              >({{
                playback.startMarker && playback.endMarker
                  ? 2
                  : playback.startMarker || playback.endMarker
                    ? 1
                    : 0
              }}
              / 2)</span
            >
          </DropdownMenuItem>
          <DropdownMenuItem
            inset
            @select.prevent="playback.clearMarkers()"
            :disabled="!playback.startMarker && !playback.endMarker"
          >
            پاک کردن نشانگرها
          </DropdownMenuItem>
          <DropdownMenuItem v-if="playback.startMarker !== undefined" disabled>
            <IconClockStart class="mr-2 h-4 w-4" />
            <span>{{
              tm.scenarioFormatter.format(playback.startMarker)
            }}</span></DropdownMenuItem
          >
          <DropdownMenuItem v-if="playback.endMarker !== undefined" disabled>
            <IconClockEnd class="mr-2 h-4 w-4" />
            <span>{{
              tm.scenarioFormatter.format(playback.endMarker)
            }}</span></DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>
      <div class="border-slate-200 dark:border-slate-600 mx-2 hidden h-8 border-r-2 sm:block" />
      <MainToolbarButton
        title="انتخاب زمان و تاریخ"
        class="toolbar-icon-button calendar-button hidden sm:flex"
        @click="emit('open-time-modal')"
      >
        <span class="sr-only">انتخاب زمان و تاریخ</span>
        <CalendarIcon class="size-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>

      <MainToolbarButton
        title="کتابخانه نمادهای تاکتیکی"
        class="toolbar-icon-button hidden sm:flex"
        @click="openSymbolSidebar"
      >
        <span class="sr-only">کتابخانه نمادهای تاکتیکی</span>
        <SimpleTacticalIcon class="size-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>

      <MainToolbarButton
        title="برو به زمان پایان سناریو"
        class="toolbar-icon-button end-time-button hidden sm:flex"
        @click="goToEndTime()"
      >
        <span class="sr-only">برو به زمان پایان سناریو</span>
        <IconFastForward class="size-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="رویداد بعدی"
        class="toolbar-icon-button next-event-button hidden sm:flex"
        @click="emit('next-event')"
      >
        <span class="sr-only">رویداد بعدی</span>
        <IconSkipNext class="size-5 w-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton title="روز بعد" class="toolbar-icon-button next-day-button hidden sm:flex" @click="emit('inc-day')">
        <span class="sr-only">روز بعد</span>
        <IconChevronRight class="size-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="روز قبل"
        class="toolbar-icon-button prev-day-button hidden sm:flex"
        @click="emit('dec-day')"
      >
        <span class="sr-only">روز قبل</span>
        <IconChevronLeft class="size-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="رویداد قبلی"
        class="toolbar-icon-button prev-event-button hidden sm:flex"
        @click="emit('prev-event')"
      >
        <span class="sr-only">رویداد قبلی</span>
        <IconSkipPrevious class="size-5 transition-all duration-300" aria-hidden="true" />
      </MainToolbarButton>
      <MainToolbarButton
        title="برو به زمان شروع سناریو"
        class="toolbar-icon-button start-time-button hidden sm:flex"
        @click="goToStartTime()"
      >
        <span class="sr-only">برو به زمان شروع سناریو</span>
        <IconRewind class="size-5 transition-all duration-300" aria-hidden="true" />
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
  <SymbolSidebarModal v-model:open="symbolSidebarOpen" />
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
  PhRewind as IconRewind,
  PhFastForward as IconFastForward,
  PhPlay as IconPlay,
  PhPause as IconPause,
  PhCaretDown as IconChevronDown,
  PhClockCountdown as IconClockStart,
  PhClockClockwise as IconClockEnd,
  PhSquaresFour as SimpleTacticalIcon,
  PhEraser as TacticalEditIcon,
} from "@phosphor-icons/vue";
import { useRouter } from "vue-router";
import { SIMPLE_TACTICAL_MAP_ROUTE } from "@/router/names";
import {
  IconSpeedometer,
  IconSpeedometerSlow,
} from "@iconify-prerendered/vue-mdi";
import MainToolbarButton from "@/components/MainToolbarButton.vue";
import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import { injectStrict } from "@/utils";
import { activeMapKey, activeScenarioKey } from "@/components/injects";
import { storeToRefs } from "pinia";
import { useUnitSettingsStore } from "@/stores/geoStore";
import { useEventBus, useToggle } from "@vueuse/core";
import { useRecordingStore } from "@/stores/recordingStore";
import PanelSymbolButton from "@/components/PanelSymbolButton.vue";
import FloatingPanel from "@/components/FloatingPanel.vue";
import { computed, onMounted, ref, type Ref, watch } from "vue";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useTimeFormatStore } from "@/stores/timeFormatStore";
import SymbolSidebarModal from "./SymbolSidebarModal.vue";

const emit = defineEmits([
  "open-time-modal",
  "inc-day",
  "dec-day",
  "next-event",
  "prev-event",
  "show-settings",
]);

const router = useRouter();

const {
  store: { undo, redo, canRedo, canUndo, groupUpdate, state },
  time: { setCurrentTime },
  unitActions,
  geo: { addUnitPosition },
  helpers: { getSideById },
} = injectStrict(activeScenarioKey);
const mapRef = injectStrict(activeMapKey);

const store = useMainToolbarStore();
const { addMultiple } = storeToRefs(store);
const { moveUnitEnabled } = storeToRefs(useUnitSettingsStore());
const recordingStore = useRecordingStore();
const playback = usePlaybackStore();
const tm = useTimeFormatStore();
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

function setSelectMode() {
  moveUnitEnabled.value = false;
}

function setMoveMode() {
  if (!recordingStore.isRecordingLocation) return;
  moveUnitEnabled.value = true;
}

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

function goToStartTime() {
  if (state.info.startTime) {
    setCurrentTime(state.info.startTime);
  }
}

function goToEndTime() {
  // پیدا کردن آخرین زمان از state واحدها و featureها (آخرین انیمیشن/حرکت)
  let maxTime = 0;
  
  // بررسی state واحدها
  Object.values(state.unitMap).forEach((unit) => {
    if (unit?.state && unit.state.length > 0) {
      const lastState = unit.state[unit.state.length - 1];
      if (lastState.t > maxTime) {
        maxTime = lastState.t;
      }
    }
  });
  
  // بررسی state featureها
  Object.values(state.featureMap).forEach((feature) => {
    if (feature?.state && feature.state.length > 0) {
      const lastState = feature.state[feature.state.length - 1];
      if (lastState.t > maxTime) {
        maxTime = lastState.t;
      }
    }
  });
  
  if (maxTime > 0) {
    setCurrentTime(maxTime);
  } else {
    // اگر هیچکدام نبود، آخرین رویداد را پیدا کن
    const events = state.events.map((id) => state.eventMap[id]);
    if (events.length > 0) {
      const lastEvent = events.reduce((latest, event) => 
        event.startTime > latest.startTime ? event : latest
      );
      setCurrentTime(lastEvent.startTime);
    }
  }
}

const symbolSidebarOpen = ref(false)

function openSymbolSidebar() {
  symbolSidebarOpen.value = true
}

function openSimpleTacticalSymbols() {
  const route = router.resolve({ name: SIMPLE_TACTICAL_MAP_ROUTE });
  window.open(route.href, "_blank");
}
</script>
<style scoped>
.map-editor-main-toolbar {
  background-color: var(--surface-panel);
  border-color: var(--surface-border);
  box-shadow: 0 8px 22px rgba(17, 24, 39, 0.16);
  opacity: 1;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

:global(.dark) .map-editor-main-toolbar {
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.42);
}

.toolbar-icon-button svg {
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.toolbar-icon-button:hover svg,
.toolbar-icon-button:active svg {
  transform: none;
  filter: none;
}
</style>
