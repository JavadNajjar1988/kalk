<script setup lang="ts">
import { IconTriangleDown } from "@iconify-prerendered/vue-mdi";
import { computed, onUnmounted, ref, unref, watch } from "vue";
import { useElementSize, useThrottleFn } from "@vueuse/core";
import { utcDay, utcHour } from "d3-time";
import { interpolateOranges } from "d3-scale-chromatic";
import { scaleSequential } from "d3-scale";
import { storeToRefs } from "pinia";
import { useActiveScenario } from "@/composables/scenarioUtils";
import { type NScenarioEvent } from "@/types/internalModels";
import TimelineContextMenu from "@/components/TimelineContextMenu.vue";
import { useSelectedItems } from "@/stores/selectedStore";
import { MS_PER_DAY, MS_PER_HOUR } from "@/utils/time";
import dayjs from "@/dayjs";
import { toPersianDigits } from "@/utils/persianNumbers";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import {
  buildTimelineRenderData,
  calculatePixelDateFromViewport,
  collectTacticalTimelineMarkers,
  getMsPerPixel,
  roundToNearestQuarterHour,
  toLocalX,
  type BinWithX,
  type EventWithX,
  type EnvironmentWithX,
  type HistogramBin,
  type PhaseWithX,
  type TacticalMarkerWithX,
  type TacticalTimelineMarker,
  type TimelineAction,
  type TimelineRenderInputs,
} from "./scenarioTimelineMath";
import {
  filterScenarioEventsByTime,
  getEventTimeFilterBounds,
  type EventTimeFilterMode,
} from "./scenarioEventTimeFilter";

const HOURS_PER_DAY = MS_PER_DAY / MS_PER_HOUR;

const {
  time: {
    scenarioTime,
    setCurrentTime,
    computeTimeHistogram,
    goToScenarioEvent,
    addScenarioEvent,
  },
  store,
} = useActiveScenario();

const el = ref<HTMLDivElement | null>(null);
const isPointerInteraction = ref(false);
const isDragging = ref(false);
const redrawCounter = ref(0);
const { width } = useElementSize(el);
const tzOffset = scenarioTime.value.utcOffset();

function formatJalaliUtc(timestamp: number, format: string) {
  try {
    return toPersianDigits(
      dayjs.utc(timestamp).calendar("jalali").locale("fa").format(format),
    );
  } catch {
    return toPersianDigits(dayjs.utc(timestamp).format(format));
  }
}

function getMinorFormatter(majorWidth: number) {
  if (majorWidth < 50) {
    return () => "";
  }
  // Keep hours aligned with UTC tick boundaries so day-start (00) is exact.
  return (timestamp: number) => formatJalaliUtc(timestamp, "HH");
}

function getMajorFormatter(majorWidth: number) {
  if (majorWidth < 100) {
    return (timestamp: number) => formatJalaliUtc(timestamp, "DD MMMM");
  }
  return (timestamp: number) => formatJalaliUtc(timestamp, "dddd DD MMMM");
}

interface Tick {
  label: string;
  timestamp: number;
}

const hoveredDate = ref<Date | null>(null);
const majorTicks = ref<Tick[]>([]);
const minorTicks = ref<Tick[]>([]);
const eventsWithX = ref<EventWithX[]>([]);
const binsWithX = ref<BinWithX[]>([]);
const tacticalMarkers = ref<TacticalTimelineMarker[]>([]);
const tacticalMarkersWithX = ref<TacticalMarkerWithX[]>([]);
const phasesWithX = ref<PhaseWithX[]>([]);
const environmentWithX = ref<EnvironmentWithX[]>([]);
const centerTimeStamp = ref(0);
const xOffset = ref(0);
const draggedDiff = ref(0);
const majorWidth = ref(100);
const minorStep = computed(() => {
  if (majorWidth.value < 100) {
    return 12;
  }
  if (majorWidth.value < 180) {
    return 6;
  }
  if (majorWidth.value < 300) {
    return 4;
  }
  if (majorWidth.value < 500) {
    return 2;
  }
  return 1;
});

let maxCount = 1;
let histogram: HistogramBin[] = [];

const minorWidth = computed(() => majorWidth.value / (HOURS_PER_DAY / minorStep.value));
const currentTimestamp = ref(0);
const animate = ref(false);
const hoveredX = ref(0);
const showHoverMarker = ref(false);
const filterMode = ref<EventTimeFilterMode>("all");
const customFrom = ref("");
const customTo = ref("");

const { activeScenarioEventId } = useSelectedItems();
const servicesStore = useServicesStore();
const serviceRefs = storeToRefs(servicesStore as any) as any;
const tacticalStoreRef = serviceRefs.store;

const countColor = scaleSequential(interpolateOranges).domain([1, maxCount]);

const timelineWidth = computed(() => {
  return majorTicks.value.length * majorWidth.value;
});

const phaseIds = computed(() => new Set(phases.value.map((phase) => phase.id)));

const eventsWithoutPhase = computed(() =>
  eventsWithX.value.filter(
    ({ event }) => !event.phaseId || !phaseIds.value.has(event.phaseId),
  ),
);

function eventsInPhase(phaseId: string) {
  return eventsWithX.value.filter(({ event }) => event.phaseId === phaseId);
}

const totalXOffset = computed(() => {
  return xOffset.value + draggedDiff.value;
});

function updateTicks(
  centerTime: Date,
  containerWidth: number,
  majorWidth: number,
  minorStep: number,
) {
  const dayPadding = Math.ceil((containerWidth * 2) / majorWidth);
  const currentUtcDay = utcDay.floor(centerTime);
  const start = utcDay.offset(currentUtcDay, -dayPadding);
  const end = utcDay.offset(currentUtcDay, dayPadding);

  const dayRange = utcDay.range(start, end);
  const majorFormatter = getMajorFormatter(majorWidth);
  majorTicks.value = dayRange.map((d) => ({
    label: majorFormatter(+d),
    timestamp: +d,
  }));

  const hourRange = utcHour.range(start, end, minorStep);
  const minorFormatter = getMinorFormatter(majorWidth);
  minorTicks.value = hourRange.map((d) => ({
    label: minorFormatter(+d),
    timestamp: +d,
  }));
  return { minDate: start, maxDate: end };
}

function getLocalX(clientX: number) {
  const host = unref(el);
  if (!host) return clientX;
  const rect = host.getBoundingClientRect();
  return toLocalX(clientX, rect.left);
}

function calculatePixelDate(localX: number) {
  return calculatePixelDateFromViewport(localX, {
    centerTimestamp: centerTimeStamp.value,
    viewportWidth: width.value,
    majorWidth: majorWidth.value,
  });
}

let startX = 0;
let accumulatedDrag = 0;
let startTimestamp = 0;

function recomputeTimelineLayout(currentScenarioTimestamp: number) {
  if (!width.value) return;
  const tt = new Date(currentScenarioTimestamp);

  centerTimeStamp.value = currentScenarioTimestamp;
  animate.value = false;
  xOffset.value =
    (tt.getUTCHours() * 60 + tt.getUTCMinutes() + tzOffset + tt.getUTCSeconds() / 60) *
    (majorWidth.value / (HOURS_PER_DAY * 60)) *
    -1;

  const { minDate, maxDate } = updateTicks(
    tt,
    width.value,
    majorWidth.value,
    minorStep.value,
  );
  updateEvents(minDate, maxDate);
}

function onPointerDown(evt: PointerEvent) {
  const host = unref(el);
  if (!host) return;

  startX = evt.clientX;
  startTimestamp = scenarioTime.value.valueOf();
  host.setPointerCapture(evt.pointerId);
  isPointerInteraction.value = true;
  isDragging.value = false;
}

function onPointerUp(evt: PointerEvent) {
  const wasDragging = isDragging.value;

  if (!isDragging.value && evt.button !== 2) {
    const { date, diff } = calculatePixelDate(getLocalX(evt.clientX));
    animate.value = true;
    draggedDiff.value = -diff;
    setCurrentTime(roundToNearestQuarterHour(date).valueOf());
  } else {
    animate.value = false;
    draggedDiff.value = 0;
  }

  isPointerInteraction.value = false;
  isDragging.value = false;
  accumulatedDrag = 0;

  if (wasDragging) {
    recomputeTimelineLayout(store.state.currentTime);
  }
}

function onPointerMove(evt: PointerEvent) {
  if (isPointerInteraction.value) {
    const diff = evt.clientX - startX;
    accumulatedDrag += Math.abs(diff);
    if (accumulatedDrag < 5) {
      isDragging.value = false;
      return;
    }

    isDragging.value = true;
    draggedDiff.value = diff;
    currentTimestamp.value = Math.floor(
      startTimestamp - diff * getMsPerPixel(majorWidth.value),
    );
    throttledTimeUpdate(currentTimestamp.value);
  }
}

const throttledTimeUpdate = useThrottleFn(setCurrentTime, 0);

function onHover(e: MouseEvent) {
  updateHoverFromClientX(e.clientX);
}

function updateHoverFromClientX(clientX: number) {
  const localX = getLocalX(clientX);
  const { date } = calculatePixelDate(localX);
  hoveredX.value = localX;
  hoveredDate.value = roundToNearestQuarterHour(date);
}

function onContextMenuOpen(
  event: MouseEvent,
  onContextMenu: (event: MouseEvent) => void,
) {
  updateHoverFromClientX(event.clientX);
  onContextMenu(event);
}

const formattedHoveredDate = computed(() => {
  if (!hoveredDate.value) return "";
  return formatJalaliUtc(+hoveredDate.value, "YYYY/MM/DD HH:mm");
});

function zoomIn() {
  majorWidth.value += 40;
}

function zoomOut() {
  majorWidth.value = Math.max(majorWidth.value - 40, 55);
}

function onWheel(e: WheelEvent) {
  if (e.deltaY > 0) {
    zoomOut();
  } else {
    zoomIn();
  }
}

const allEvents = computed(() =>
  store.state.events.map((id) => store.state.eventMap[id]),
);

const filterBounds = computed(() => {
  return getEventTimeFilterBounds({
    mode: filterMode.value,
    currentTime: scenarioTime.value.valueOf(),
    customFrom: customFrom.value,
    customTo: customTo.value,
  });
});

const events = computed(() => filterScenarioEventsByTime(allEvents.value, filterBounds.value));
const phases = computed(() => store.state.phases);
const environmentalConditions = computed(() => store.state.environmentalConditions);

function updateEvents(minDate: Date, maxDate: Date) {
  const renderInputs: TimelineRenderInputs = {
    events: events.value,
    histogram,
    tacticalMarkers: tacticalMarkers.value,
    phases: phases.value,
    environmentalConditions: environmentalConditions.value,
    minTimestamp: +minDate,
    maxTimestamp: +maxDate,
    majorWidth: majorWidth.value,
    tzOffsetMinutes: tzOffset,
  };
  const {
    eventsWithX: renderEvents,
    binsWithX: renderBins,
    tacticalMarkersWithX: renderTacticalMarkers,
    phasesWithX: renderPhases,
    environmentWithX: renderEnvironment,
  } = buildTimelineRenderData(renderInputs);
  eventsWithX.value = renderEvents;
  binsWithX.value = renderBins;
  tacticalMarkersWithX.value = renderTacticalMarkers;
  phasesWithX.value = renderPhases;
  environmentWithX.value = renderEnvironment;
}

let activeTacticalStore: any = null;
let tacticalRefreshSerial = 0;

function detachTacticalStoreListener() {
  if (activeTacticalStore && typeof activeTacticalStore.off === "function") {
    activeTacticalStore.off("batch", onTacticalStoreBatch);
  }
  activeTacticalStore = null;
}

async function refreshTacticalTimelineMarkers() {
  const serial = ++tacticalRefreshSerial;
  const tacticalStore = tacticalStoreRef.value;
  if (!tacticalStore || typeof tacticalStore.tuples !== "function") {
    tacticalMarkers.value = [];
    redrawCounter.value += 1;
    return;
  }

  const tuples = await tacticalStore.tuples("timed+feature:");
  if (serial !== tacticalRefreshSerial) return;
  tacticalMarkers.value = collectTacticalTimelineMarkers(tuples);
  redrawCounter.value += 1;
}

function onTacticalStoreBatch() {
  void refreshTacticalTimelineMarkers();
}

function attachTacticalStoreListener(tacticalStore: any) {
  detachTacticalStoreListener();
  activeTacticalStore = tacticalStore;
  if (activeTacticalStore && typeof activeTacticalStore.on === "function") {
    activeTacticalStore.on("batch", onTacticalStoreBatch);
  }
  void refreshTacticalTimelineMarkers();
}

watch(
  [() => store.state.unitStateCounter, () => store.state.featureStateCounter],
  () => {
    const { histogram: hg, max: mc } = computeTimeHistogram();
    histogram = hg;
    maxCount = mc;
    redrawCounter.value += 1;
  },
  { immediate: true },
);

watch(
  () => tacticalStoreRef.value,
  (tacticalStore) => attachTacticalStoreListener(tacticalStore),
  { immediate: true },
);

onUnmounted(() => {
  detachTacticalStoreListener();
});

watch([events, phases, environmentalConditions], () => {
  if (!width.value) return;
  if (isDragging.value) return;
  recomputeTimelineLayout(store.state.currentTime);
});

watch(
  [width, () => store.state.currentTime, majorWidth, redrawCounter],
  ([currentWidth, currentScenarioTimestamp]) => {
    if (!currentWidth) return;
    if (isDragging.value) return;

    if (animate.value === true) {
      setTimeout(() => {
        animate.value = false;
        draggedDiff.value = 0;
        recomputeTimelineLayout(store.state.currentTime);
      }, 100);
      return;
    }

    recomputeTimelineLayout(currentScenarioTimestamp);
  },
  { immediate: true },
);

function onEventClick(event: NScenarioEvent) {
  goToScenarioEvent(event);
}

function isTimelineAction(action: string): action is TimelineAction {
  return action === "zoomIn" || action === "zoomOut" || action === "addScenarioEvent";
}

function onContextMenuAction(action: string) {
  if (!isTimelineAction(action)) return;

  if (action === "zoomIn") {
    zoomIn();
  } else if (action === "zoomOut") {
    zoomOut();
  } else if (action === "addScenarioEvent") {
    const hovered = hoveredDate.value;
    if (!hovered) return;
    const jalaliDay = dayjs(+hovered).calendar("jalali").date();
    const eventId = addScenarioEvent({
      title: `رویداد ${jalaliDay}`,
      startTime: +hovered,
    });
    activeScenarioEventId.value = eventId;
  }
}
</script>

<template>
  <TimelineContextMenu
    @action="onContextMenuAction"
    v-slot="{ onContextMenu }"
    :formattedHoveredDate="formattedHoveredDate"
  >
    <div class="relative">
      <div
        class="flex flex-wrap items-center gap-2 border-t px-2 py-1 text-xs"
        style="direction: rtl"
        @pointerdown.stop
        @pointerup.stop
        @wheel.stop
      >
        <label for="timeline-filter">نمایش رویدادها</label>
        <select
          id="timeline-filter"
          v-model="filterMode"
          class="rounded border bg-transparent px-2 py-1"
        >
          <option value="all">همه زمان‌ها</option>
          <option value="day">روز جاری</option>
          <option value="week">هفته جاری</option>
          <option value="month">ماه جاری</option>
          <option value="custom">بازه دلخواه</option>
        </select>
        <template v-if="filterMode === 'custom'">
          <input v-model="customFrom" type="datetime-local" class="rounded border bg-transparent px-2 py-1" />
          <span>تا</span>
          <input v-model="customTo" type="datetime-local" class="rounded border bg-transparent px-2 py-1" />
        </template>
        <span class="text-muted-foreground">
          {{ toPersianDigits(String(events.length)) }} رویداد از
          {{ toPersianDigits(String(allEvents.length)) }} رویداد
        </span>
      </div>
      <div
      ref="el"
      data-testid="scenario-timeline"
      class="scenario-timeline relative mb-2 w-full transform overflow-x-hidden border-t text-sm transition-all select-none"
      style="direction: ltr; text-align: left"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointermove="onPointerMove"
      @wheel="onWheel"
      @mousemove="onHover"
      @mouseenter="showHoverMarker = true"
      @mouseleave="showHoverMarker = false"
      @contextmenu="onContextMenuOpen($event, onContextMenu)"
    >
      <div
        class="timeline-indicator-strip flex h-3.5 items-center justify-center overflow-clip"
      >
        <IconTriangleDown class="h-4 w-4 scale-x-150 transform text-red-900" />
      </div>

      <div
        class="touch-none text-sm select-none"
        :class="animate ? 'transition-all' : 'transition-none'"
        :style="`transform:translate(${totalXOffset}px)`"
      >
        <div class="flex justify-center">
          <div
            class="relative h-16 flex-none text-center"
            :style="`width: ${timelineWidth}px`"
          >
            <div
              v-for="{ x, width: environmentWidth, condition } in environmentWithX"
              :key="`environment-${condition.id}`"
              data-testid="environment-timeline-band"
              class="absolute top-0 h-4 overflow-hidden rounded-sm border border-sky-700/40 bg-sky-500/25 px-1 text-[10px] leading-4 text-sky-950 dark:text-sky-100"
              :class="{ 'opacity-40': condition.enabled === false }"
              :style="`left: ${x}px; width: ${environmentWidth}px;`"
              :title="`شرایط محیطی: ${condition.name || condition.kind}`"
            >
              <span v-if="environmentWidth > 48">{{ condition.name || condition.kind }}</span>
            </div>
            <div
              v-for="{ x, width: phaseWidth, phase } in phasesWithX"
              :key="`phase-${phase.id}`"
              data-testid="scenario-phase-band"
              class="absolute top-5 h-6 overflow-hidden rounded-sm border border-emerald-700/50 bg-emerald-500/25 text-[10px] leading-6 text-emerald-950 dark:text-emerald-100"
              :style="`left: ${x}px; width: ${phaseWidth}px;`"
              :title="`فاز: ${phase.name}`"
            >
              <span
                v-if="phaseWidth > 48"
                class="pointer-events-none block truncate px-1"
              >
                {{ phase.name }}
              </span>
              <button
                v-for="{ x: eventX, event } in eventsInPhase(phase.id)"
                type="button"
                :key="event.id"
                data-testid="scenario-event-marker"
                data-phase-event="true"
                class="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-950 bg-amber-400 shadow-sm hover:bg-red-700 dark:border-emerald-100"
                :style="`left: ${eventX - x}px;`"
                :title="`${event.title} — فاز ${phase.name}`"
                @pointerdown.stop
                @pointerup.stop
                @mousemove.stop
                @click.stop="onEventClick(event)"
              />
            </div>
            <div
              v-for="{ x, count } in binsWithX"
              :key="x"
              class="absolute top-14 h-2 w-4 rounded border border-gray-500"
              :style="`left: ${x}px; width: ${Math.max(
                majorWidth / 24,
                8,
              )}px;background-color: ${countColor(count)}`"
              @mousemove.stop
              :title="`${count} رویداد واحد`"
            ></div>
            <button
              v-for="{ x, event } in eventsWithoutPhase"
              type="button"
              :key="event.id"
              data-testid="scenario-event-marker"
              class="absolute top-12 h-4 w-4 -translate-x-1/2 rounded-full border border-gray-500 bg-amber-500 hover:bg-red-900"
              :style="`left: ${x}px;`"
              @mousemove.stop
              :title="event.title"
              @click.stop="onEventClick(event)"
            />
            <div
              v-for="{ x, count } in tacticalMarkersWithX"
              :key="`tactical-${x}-${count}`"
              data-testid="tactical-timeline-marker"
              class="absolute top-12 h-3 w-3 -translate-x-1/2 rounded-full border border-blue-800 bg-blue-500 shadow-sm shadow-blue-900/30"
              :style="`left: ${x}px;`"
              @mousemove.stop
              :title="
                count > 1
                  ? `${toPersianDigits(String(count))} تغییر نماد تاکتیکی`
                  : 'تغییر نماد تاکتیکی'
              "
            />
          </div>
        </div>

        <div class="flex justify-center">
          <div
            class="relative flex-none text-center"
            :style="`width: ${timelineWidth}px`"
          ></div>
        </div>

        <div class="timeline-major-row flex justify-center">
          <div
            v-for="tick in majorTicks"
            :key="tick.timestamp"
            data-testid="major-tick"
            class="timeline-major-tick flex-none border-r border-b pl-0.5"
            :style="`width: ${majorWidth}px`"
          >
            {{ tick.label }}
          </div>
        </div>

        <div class="flex justify-center text-xs">
          <div
            v-for="tick in minorTicks"
            :key="tick.timestamp"
            class="timeline-minor-tick min-h-[1rem] flex-none border-r pl-0.5"
            :style="`width: ${minorWidth}px`"
          >
            {{ tick.label }}
          </div>
        </div>
      </div>

      <p
        v-if="showHoverMarker && !isDragging"
        class="absolute top-0 right-1 hidden p-0 text-xs text-red-900 select-none sm:block dark:text-red-600"
      >
        {{ formattedHoveredDate }}
      </p>

      <div
        v-if="showHoverMarker"
        class="hover-hover:flex absolute top-0 bottom-0 w-0.5 bg-red-900/50 dark:bg-red-600/50"
        :style="`left: ${hoveredX}px`"
      />
      </div>
    </div>
  </TimelineContextMenu>
</template>

<style scoped>
.scenario-timeline {
  background-color: var(--surface-panel);
  border-top-color: var(--surface-border);
  box-shadow: none;
}

.timeline-indicator-strip {
  background-color: var(--surface-panel);
}

.timeline-major-row {
  border-color: var(--surface-border);
}

.timeline-major-tick {
  border-color: var(--surface-border);
  color: hsl(var(--foreground));
}

.timeline-minor-tick {
  border-color: var(--surface-border);
  color: hsl(var(--muted-foreground));
}
</style>
