<template>
  <div
    class="pointer-events-auto flex max-w-full flex-col items-center justify-center gap-1"
  >
    <nav
      class="map-editor-main-toolbar text-foreground pointer-events-auto flex w-auto flex-row-reverse items-center justify-between rounded-xl border p-2 text-sm sm:p-3"
    >
      <section class="flex flex-row-reverse items-center justify-between">
        <MainToolbarButton
          title="ابزار انتخاب شده را پس از کشیدن فعال نگه دار"
          @click="toggleAddMultiple()"
          class="toolbar-icon-button lock-button hidden sm:flex"
        >
          <IconLockOutline
            v-if="addMultiple"
            class="size-5 transition-all duration-300"
          />
          <IconLockOpenVariantOutline v-else class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <MainToolbarButton
          @click="setSelectMode()"
          :active="!moveUnitEnabled && !store.currentToolbar"
          class="toolbar-icon-button select-button"
        >
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
        <div class="h-7 border-r-2 border-slate-200 sm:mx-1 dark:border-slate-600" />
        <MainToolbarButton
          :active="store.currentToolbar === 'measurements'"
          @click="toggleMapToolbar('measurements')"
          title="اندازه‌گیری‌ها"
          class="toolbar-icon-button measurement-button"
        >
          <MeasurementIcon class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <MainToolbarButton
          :active="store.currentToolbar === 'draw'"
          @click="toggleMapToolbar('draw')"
          title="کشیدن"
          class="toolbar-icon-button draw-button"
        >
          <DrawIcon class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <MainToolbarButton
          title="مسیر واحد"
          :active="store.currentToolbar === 'track'"
          @click="toggleMapToolbar('track')"
          class="toolbar-icon-button track-button"
        >
          <IconMapMarkerPath class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <MainToolbarButton
          title="ویرایش نماد تاکتیکی (محو / برش)"
          :active="store.currentToolbar === 'tactical'"
          @click="toggleMapToolbar('tactical')"
          class="toolbar-icon-button tactical-button hidden sm:flex"
        >
          <TacticalEditIcon class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <MainToolbarButton
          title="کتابخانه نمادهای تاکتیکی"
          class="toolbar-icon-button symbol-library-button hidden sm:flex"
          @click="openSymbolSidebar"
        >
          <span class="sr-only">کتابخانه نمادهای تاکتیکی</span>
          <SymbolLibraryIcon
            class="size-5 transition-all duration-300"
            aria-hidden="true"
          />
        </MainToolbarButton>
        <MainToolbarButton
          title="ترسیم شرایط محیطی و هواشناسی"
          :active="store.currentToolbar === 'environment'"
          @click="toggleMapToolbar('environment')"
          class="toolbar-icon-button environment-button"
        >
          <WeatherIcon class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <div class="h-7 border-r-2 border-slate-200 sm:mx-1 dark:border-slate-600" />
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
              class="bg-opacity-70 absolute bottom-0 -left-2 h-4 w-4 rounded-full bg-white text-gray-600 transition-all duration-300 group-hover:text-gray-900"
            />
          </PanelSymbolButton>
          <SymbolPickerPopover
            :symbol-options="symbolOptions"
            :add-unit="addUnit"
            :disabled="!activeParentId || unitActions.isUnitLocked(activeParentId)"
          />
        </div>
      </section>
    </nav>

    <nav
      class="map-editor-playback-toolbar text-foreground pointer-events-auto flex w-auto flex-row-reverse items-center justify-center rounded-xl border p-2 text-sm sm:p-3"
    >
      <section class="flex flex-row-reverse items-center">
        <!-- Playback controls -->
        <MainToolbarButton
          title="اجرا / توقف سناریو"
          @click="playback.togglePlayback()"
          class="toolbar-icon-button playback-button"
        >
          <IconPause
            v-if="playback.playbackRunning"
            class="size-6 transition-all duration-300"
          />
          <IconPlay v-else class="size-6 transition-all duration-300" />
        </MainToolbarButton>
        <Popover v-if="props.storyboardVisible" v-model:open="storyboardPopoverOpen">
          <PopoverTrigger as-child>
            <MainToolbarButton
              title="کنترل‌های استوری‌بورد"
              :active="props.storyRunning"
              :disabled="!props.storyHasScenes"
              class="toolbar-icon-button storyboard-menu-button"
            >
              <IconStoryboard class="size-5 transition-all duration-300" />
            </MainToolbarButton>
          </PopoverTrigger>
          <PopoverContent
            class="storyboard-popover-content w-64 border !border-slate-200 !bg-white p-3 text-slate-900 shadow-xl dark:!border-slate-700 dark:!bg-slate-950 dark:text-slate-100"
            align="center"
            side="top"
            :sideOffset="10"
            dir="rtl"
          >
            <div class="flex flex-col gap-3">
              <div class="space-y-2">
                <div class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  نوع نمایش
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :class="storyModeButtonClass('toast')"
                    @click="selectStoryShowMode('toast')"
                  >
                    کارت کوتاه
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :class="storyModeButtonClass('cinematic')"
                    @click="selectStoryShowMode('cinematic')"
                  >
                    پخش استوری
                  </Button>
                </div>
              </div>
              <div class="h-px bg-slate-200 dark:bg-slate-800" />
              <Button
                v-if="!props.storyRunning"
                type="button"
                variant="default"
                size="sm"
                class="w-full justify-start gap-2"
                :disabled="!props.storyHasScenes"
                @click="startStoryPlayback"
              >
                <IconPlay class="size-4" />
                <span>شروع پخش استوری</span>
              </Button>
              <template v-else>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="w-full justify-start gap-2"
                  @click="previousStoryScene"
                >
                  <IconSkipPrevious class="size-4" />
                  <span>صحنه قبلی</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="w-full justify-start gap-2"
                  @click="nextStoryScene"
                >
                  <IconSkipNext class="size-4" />
                  <span>صحنه بعدی</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="w-full justify-start gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-200"
                  @click="stopStoryPlayback"
                >
                  <IconStop class="size-4" />
                  <span>توقف</span>
                </Button>
              </template>
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <MainToolbarButton
              title="تنظیم سرعت پخش"
              class="toolbar-icon-button playback-speed-button"
            >
              <SpeedControlIcon
                v-if="playback.playbackSpeedMultiplier === 1"
                class="size-5 transition-all duration-300"
              />
              <span v-else class="text-xs leading-none font-semibold">
                {{ formatSpeedMultiplier(playback.playbackSpeedMultiplier) }}
              </span>
            </MainToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent :side-offset="10" align="center" dir="rtl">
            <DropdownMenuItem
              v-for="multiplier in PLAYBACK_SPEED_MULTIPLIERS"
              :key="multiplier"
              :class="speedMenuItemClass(multiplier)"
              @select.prevent="playback.setSpeedMultiplier(multiplier)"
            >
              {{ formatSpeedMultiplier(multiplier) }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <MainToolbarButton
          title="پخش حلقه‌ای بین اولین و آخرین رویداد"
          :active="playback.playbackLooping"
          :disabled="!eventLoopAvailable"
          class="toolbar-icon-button event-loop-button hidden sm:flex"
          @click="toggleEventLoopPlayback"
        >
          <EventLoopIcon class="size-5 transition-all duration-300" />
        </MainToolbarButton>
        <div
          class="mx-2 hidden h-8 border-r-2 border-slate-200 sm:block dark:border-slate-600"
        />
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
          <IconFastForward
            class="size-5 transition-all duration-300"
            aria-hidden="true"
          />
        </MainToolbarButton>
        <MainToolbarButton
          title="رویداد بعدی"
          class="toolbar-icon-button next-event-button hidden sm:flex"
          @click="emit('next-event')"
        >
          <span class="sr-only">رویداد بعدی</span>
          <IconSkipNext
            class="size-5 w-5 transition-all duration-300"
            aria-hidden="true"
          />
        </MainToolbarButton>
        <MainToolbarButton
          title="روز بعد"
          class="toolbar-icon-button next-day-button hidden sm:flex"
          @click="emit('inc-day')"
        >
          <span class="sr-only">روز بعد</span>
          <IconChevronRight
            class="size-5 transition-all duration-300"
            aria-hidden="true"
          />
        </MainToolbarButton>
        <MainToolbarButton
          title="روز قبل"
          class="toolbar-icon-button prev-day-button hidden sm:flex"
          @click="emit('dec-day')"
        >
          <span class="sr-only">روز قبل</span>
          <IconChevronLeft
            class="size-5 transition-all duration-300"
            aria-hidden="true"
          />
        </MainToolbarButton>
        <MainToolbarButton
          title="رویداد قبلی"
          class="toolbar-icon-button prev-event-button hidden sm:flex"
          @click="emit('prev-event')"
        >
          <span class="sr-only">رویداد قبلی</span>
          <IconSkipPrevious
            class="size-5 transition-all duration-300"
            aria-hidden="true"
          />
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
    </nav>
    <FloatingPanel
      v-if="isGetLocationActive"
      class="bg-opacity-75 absolute bottom-14 overflow-visible p-2 px-4 text-sm sm:bottom-16 sm:left-1/2 sm:-translate-x-1/2"
    >
      روی نقشه یا آرایش نبرد کلیک کنید تا واحد را قرار دهید.
      <Button type="button" variant="link" size="sm" @click="cancelGetLocation()">
        لغو
      </Button>
    </FloatingPanel>
  </div>
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
  PhStop as IconStop,
  PhFilmSlate as IconStoryboard,
  PhBooks as SymbolLibraryIcon,
  PhEraser as TacticalEditIcon,
  PhGauge as SpeedControlIcon,
  PhRepeat as EventLoopIcon,
  PhCloudSun as WeatherIcon,
} from "@phosphor-icons/vue";
import { useRouter } from "vue-router";
import { SIMPLE_TACTICAL_MAP_ROUTE } from "@/router/names";
import MainToolbarButton from "@/components/MainToolbarButton.vue";
import {
  useMainToolbarStore,
  type ToolbarType,
} from "@/stores/mainToolbarStore";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PLAYBACK_SPEED_MULTIPLIERS,
  type PlaybackSpeedMultiplier,
  usePlaybackStore,
} from "@/stores/playbackStore";
import { hasEventPlaybackLoopRange } from "@/modules/scenarioeditor/scenarioPlayback";
import SymbolSidebarModal from "./SymbolSidebarModal.vue";
import type { StoryboardShowMode } from "@/types/scenarioModels";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import { cancelTacticalErase } from "./tacticalToolLifecycle";

const props = withDefaults(
  defineProps<{
    storyboardVisible?: boolean;
    storyRunning?: boolean;
    storyHasScenes?: boolean;
    storyShowMode?: StoryboardShowMode;
  }>(),
  {
    storyboardVisible: false,
    storyRunning: false,
    storyHasScenes: false,
    storyShowMode: "cinematic",
  },
);

const emit = defineEmits([
  "open-time-modal",
  "inc-day",
  "dec-day",
  "next-event",
  "prev-event",
  "show-settings",
  "start-story",
  "stop-story",
  "previous-story",
  "next-story",
  "select-story-show-mode",
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
const tacticalServicesStore = useServicesStore();
const { addMultiple } = storeToRefs(store);
const { moveUnitEnabled } = storeToRefs(useUnitSettingsStore());
const recordingStore = useRecordingStore();
const playback = usePlaybackStore();
const storyboardPopoverOpen = ref(false);
const selectedStoryShowMode = ref<StoryboardShowMode>(props.storyShowMode);
const selectStore = useMapSelectStore();
const toggleAddMultiple = useToggle(addMultiple);
const bus = useEventBus(orbatUnitClick);
const { activeUnitId, resetActiveParent, activeParent, activeParentId } =
  useActiveUnitStore();

const { currentSid, currentEchelon, activeSidc } = useToolbarUnitSymbolData();

const eventPlaybackTimes = computed(() =>
  state.events.flatMap((eventId) => {
    const startTime = state.eventMap[eventId]?.startTime;
    return startTime === undefined ? [] : [startTime];
  }),
);
const eventLoopAvailable = computed(() =>
  hasEventPlaybackLoopRange(eventPlaybackTimes.value),
);

const computedSidc = computed(() => {
  const parsedSidc = new Sidc(activeSidc.value);
  parsedSidc.standardIdentity = currentSid.value;
  parsedSidc.emt = "00";
  parsedSidc.hqtfd = "0";
  return parsedSidc.toString();
});

function setSelectMode() {
  leaveTransientMapTool();
  moveUnitEnabled.value = false;
}

function setMoveMode() {
  if (!recordingStore.isRecordingLocation) return;
  leaveTransientMapTool();
  moveUnitEnabled.value = true;
}

function leaveTransientMapTool() {
  cancelTacticalErase(tacticalServicesStore.getServices()?.emitter);
  store.clearToolbar();
}

function toggleMapToolbar(toolbar: ToolbarType) {
  cancelTacticalErase(tacticalServicesStore.getServices()?.emitter);
  moveUnitEnabled.value = false;
  store.toggleToolbar(toolbar);
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
        event.startTime > latest.startTime ? event : latest,
      );
      setCurrentTime(lastEvent.startTime);
    }
  }
}

function startStoryPlayback() {
  emit("start-story", selectedStoryShowMode.value);
  storyboardPopoverOpen.value = false;
}

function stopStoryPlayback() {
  emit("stop-story");
  storyboardPopoverOpen.value = false;
}

function previousStoryScene() {
  emit("previous-story");
}

function nextStoryScene() {
  emit("next-story");
}

function selectStoryShowMode(showMode: StoryboardShowMode) {
  selectedStoryShowMode.value = showMode;
  emit("select-story-show-mode", showMode);
}

function formatSpeedMultiplier(multiplier: PlaybackSpeedMultiplier) {
  if (multiplier === 1) return "1X";
  return multiplier > 0 ? `+${multiplier}X` : `${multiplier}X`;
}

function speedMenuItemClass(multiplier: PlaybackSpeedMultiplier) {
  return playback.playbackSpeedMultiplier === multiplier
    ? "bg-primary/15 text-primary"
    : "";
}

function toggleEventLoopPlayback() {
  if (!eventLoopAvailable.value) return;
  playback.toggleLooping();
}

function storyModeButtonClass(showMode: StoryboardShowMode) {
  return [
    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
    selectedStoryShowMode.value === showMode
      ? "border-primary/30 bg-primary/15 text-primary ring-1 ring-primary/30"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
  ];
}

watch(
  () => props.storyShowMode,
  (showMode) => {
    selectedStoryShowMode.value = showMode;
  },
);

watch(eventLoopAvailable, (available) => {
  if (!available && playback.playbackLooping) {
    playback.toggleLooping(false);
  }
});

const symbolSidebarOpen = ref(false);

function openSymbolSidebar() {
  leaveTransientMapTool();
  moveUnitEnabled.value = false;
  symbolSidebarOpen.value = true;
}

function openSimpleTacticalSymbols() {
  const route = router.resolve({ name: SIMPLE_TACTICAL_MAP_ROUTE });
  window.open(route.href, "_blank");
}
</script>
<style scoped>
.map-editor-main-toolbar,
.map-editor-playback-toolbar {
  background-color: var(--surface-panel);
  border-color: var(--surface-border);
  box-shadow: 0 8px 22px rgba(17, 24, 39, 0.16);
  opacity: 1;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

:global(.dark) .map-editor-main-toolbar,
:global(.dark) .map-editor-playback-toolbar {
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
