<template>
  <nav
    class="map-editor-main-toolbar pointer-events-auto flex w-auto items-center justify-between p-2 text-sm sm:p-3 rounded-2xl shadow-xl text-foreground backdrop-blur-md"
  >
    <section class="flex items-center justify-between">
      <MainToolbarButton
        title="ابزار انتخاب شده را پس از کشیدن فعال نگه دار"
        @click="toggleAddMultiple()"
        class="toolbar-icon-button lock-button hidden sm:flex"
      >
        <IconLockOutline v-if="addMultiple" class="size-5 transition-all duration-300" />
        <IconLockOpenVariantOutline v-else class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton @click="toggleMoveUnit(false)" :active="!moveUnitEnabled" class="toolbar-icon-button select-button">
        <SelectIcon class="size-6 transition-all duration-300" />
      </MainToolbarButton>
      <MainToolbarButton
        :active="moveUnitEnabled"
        @click="toggleMoveUnit(true)"
        title="جابجایی واحد"
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
      <div class="border-slate-200 dark:border-slate-600 h-7 border-l-2 sm:mx-1" />
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
            class="bg-opacity-70 absolute -right-2 bottom-0 h-4 w-4 rounded-full bg-white text-gray-600 group-hover:text-gray-900 transition-all duration-300"
          />
        </PanelSymbolButton>
        <SymbolPickerPopover :symbol-options="symbolOptions" :add-unit="addUnit" />
      </div>
    </section>
    <section class="flex items-center">
      <div class="border-slate-200 dark:border-slate-600 -mx-1 h-8 border-l-2 sm:mx-2" />
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
      <div class="border-slate-200 dark:border-slate-600 mx-2 hidden h-8 border-l-2 sm:block" />
      <MainToolbarButton
        title="انتخاب زمان و تاریخ"
        class="toolbar-icon-button calendar-button hidden sm:flex"
        @click="emit('open-time-modal')"
      >
        <span class="sr-only">انتخاب زمان و تاریخ</span>
        <CalendarIcon class="size-5 transition-all duration-300" aria-hidden="true" />
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
} from "@phosphor-icons/vue";
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
  time: { setCurrentTime },
  unitActions,
  geo: { addUnitPosition },
  helpers: { getSideById },
} = injectStrict(activeScenarioKey);
const mapRef = injectStrict(activeMapKey);

const store = useMainToolbarStore();
const { addMultiple } = storeToRefs(store);
const { moveUnitEnabled } = storeToRefs(useUnitSettingsStore());
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

/* انیمیشن‌های متنوع برای آیکون‌های toolbar */

.toolbar-icon-button {
  position: relative;
}

.toolbar-icon-button svg {
  will-change: transform;
  transform-origin: center;
}

/* آیکون قفل - bounce */
.lock-button:hover svg {
  animation: lock-bounce 0.5s ease-in-out;
  filter: drop-shadow(0 2px 6px rgba(107, 114, 128, 0.4));
}

@keyframes lock-bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-3px) scale(1.15);
  }
}

/* آیکون انتخاب - pulse */
.select-button:hover svg {
  animation: select-pulse 0.6s ease-in-out;
  filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4));
}

@keyframes select-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* آیکون جابجایی - shake */
.move-button:hover svg {
  animation: move-shake 0.5s ease-in-out;
  filter: drop-shadow(0 2px 6px rgba(34, 197, 94, 0.4));
}

@keyframes move-shake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-3px) rotate(-5deg);
  }
  75% {
    transform: translateX(3px) rotate(5deg);
  }
}

/* آیکون تنظیمات - چرخش */
.settings-toolbar-button:hover svg {
  animation: settings-spin 0.8s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4));
}

@keyframes settings-spin {
  from {
    transform: rotate(0deg) scale(1);
  }
  to {
    transform: rotate(360deg) scale(1.2);
  }
}

/* آیکون اندازه‌گیری - scale up */
.measurement-button:hover svg {
  transform: scale(1.25) rotate(5deg);
  filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.4));
}

/* آیکون کشیدن - rotate */
.draw-button:hover svg {
  transform: rotate(15deg) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(236, 72, 153, 0.4));
}

/* آیکون مسیر - wave */
.track-button:hover svg {
  animation: track-wave 0.6s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4));
}

@keyframes track-wave {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-4px) rotate(10deg);
  }
}

/* آیکون افزودن واحد - pulse + scale */
.group:hover .bg-opacity-70 {
  animation: add-pulse 0.5s ease-in-out;
  transform: scale(1.3);
}

@keyframes add-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

/* آیکون پخش/توقف - bounce */
.playback-button:hover svg {
  animation: playback-bounce 0.5s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

@keyframes playback-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
}

/* آیکون منوی پخش - rotate down */
.playback-menu-button:hover svg {
  transform: rotate(180deg) scale(1.15);
  filter: drop-shadow(0 2px 6px rgba(59, 130, 246, 0.4));
}

/* آیکون تقویم - flip */
.calendar-button:hover svg {
  animation: calendar-flip 0.6s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(168, 85, 247, 0.4));
}

@keyframes calendar-flip {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  50% {
    transform: rotateY(180deg) scale(1.2);
  }
  100% {
    transform: rotateY(360deg) scale(1.15);
  }
}

/* آیکون پایان سناریو - slide right */
.end-time-button:hover svg {
  animation: fast-forward-slide 0.5s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

@keyframes fast-forward-slide {
  0%, 100% {
    transform: translateX(0) scale(1);
  }
  50% {
    transform: translateX(5px) scale(1.2);
  }
}

/* آیکون رویداد بعدی - slide right */
.next-event-button:hover svg {
  transform: translateX(3px) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.4));
}

/* آیکون روز بعد - slide right */
.next-day-button:hover svg {
  transform: translateX(4px) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

/* آیکون روز قبل - slide left */
.prev-day-button:hover svg {
  transform: translateX(-4px) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

/* آیکون رویداد قبلی - slide left */
.prev-event-button:hover svg {
  transform: translateX(-3px) scale(1.2);
  filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.4));
}

/* آیکون شروع سناریو - slide left */
.start-time-button:hover svg {
  animation: rewind-slide 0.5s ease-in-out;
  filter: drop-shadow(0 2px 8px rgba(34, 197, 94, 0.4));
}

@keyframes rewind-slide {
  0%, 100% {
    transform: translateX(0) scale(1);
  }
  50% {
    transform: translateX(-5px) scale(1.2);
  }
}

/* افکت کلی برای dark mode */
:global(.dark) .toolbar-icon-button:hover svg {
  filter: drop-shadow(0 2px 6px rgba(255, 255, 255, 0.15));
}
</style>
