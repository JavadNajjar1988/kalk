<script setup lang="ts">
import { IconTriangleDown } from "@iconify-prerendered/vue-mdi";
import { computed, ref, unref, watch, watchEffect } from "vue";
import { useElementSize, useThrottleFn } from "@vueuse/core";
import { utcDay, utcHour } from "d3-time";
import { utcFormat } from "d3-time-format";
import { interpolateOranges } from "d3-scale-chromatic";
import { scaleSequential } from "d3-scale";
import { useActiveScenario } from "@/composables/scenarioUtils";
import { type NScenarioEvent } from "@/types/internalModels";
import { useTimeFormatStore } from "@/stores/timeFormatStore";
import TimelineContextMenu from "@/components/TimelineContextMenu.vue";
import { useSelectedItems } from "@/stores/selectedStore";
import { 
  getJalaliMinorFormatter, 
  getJalaliMajorFormatter,
  jalaliDateTimeFormatter 
} from "@/utils/jalaliFormatters";
import dayjs from "@/dayjs";

const MS_PER_HOUR = 3600 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const {
  time: {
    scenarioTime,
    setCurrentTime,
    timeZone,
    computeTimeHistogram,
    goToScenarioEvent,
    addScenarioEvent,
  },
  store,
} = useActiveScenario();
const fmt = useTimeFormatStore();

const el = ref<HTMLDivElement | null>(null);
const isPointerInteraction = ref(false);
const isDragging = ref(false);
const redrawCounter = ref(0);
const { width } = useElementSize(el);
const tzOffset = scenarioTime.value.utcOffset();

// فرمت‌کننده‌های شمسی برای تایم لاین
// Jalali formatters for timeline display
function getMinorFormatter(majorWidth: number) {
  try {
    return getJalaliMinorFormatter(majorWidth);
  } catch (error) {
    console.warn('Error creating Jalali minor formatter, falling back to default:', error);
    // Fallback to UTC formatter
    if (majorWidth < 50) {
      return (timestamp: number) => "";
    }
    return (timestamp: number) => new Date(timestamp).getUTCHours().toString().padStart(2, '0');
  }
}

function getMajorFormatter(majorWidth: number) {
  try {
    return getJalaliMajorFormatter(majorWidth);
  } catch (error) {
    console.warn('Error creating Jalali major formatter, falling back to default:', error);
    // Fallback to simple date format
    return (timestamp: number) => {
      const date = new Date(timestamp);
      return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
    };
  }
}

interface Tick {
  label: string;
  timestamp: number;
  id: string; // افزودن شناسه یکتا برای جلوگیری از تکرار key
}

interface EventWithX {
  x: number;
  event: NScenarioEvent;
}

interface BinWithX {
  x: number;
  count: number;
}

const hoveredDate = ref<Date | null>(null);
const majorTicks = ref<Tick[]>([]);
const minorTicks = ref<Tick[]>([]);
const eventsWithX = ref<EventWithX[]>([]);
const binsWithX = ref<BinWithX[]>([]);
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
let histogram: { t: number; count: number }[] = [];

const minorWidth = computed(() => majorWidth.value / (24 / minorStep.value));

// Responsive font sizing based on zoom level
const majorFontClass = computed(() => {
  if (majorWidth.value < 90) return "text-xs";
  if (majorWidth.value < 140) return "text-sm";
  return "text-base";
});
const minorFontClass = computed(() => {
  if (minorWidth.value < 22) return "text-[0.6rem]";
  if (minorWidth.value < 36) return "text-[0.7rem]";
  return "text-sm";
});

// Hide/skip labels when zoomed out to avoid overlaps
const showMajorLabels = computed(() => majorWidth.value >= 60);
const showMinorLabels = computed(() => minorWidth.value >= 14);
const minorLabelStep = computed(() => {
  if (minorWidth.value < 18) return 4; // every 4th minor tick
  if (minorWidth.value < 28) return 2; // every 2nd minor tick
  return 1; // all
});
const currentTimestamp = ref(0);
const animate = ref(false);
const hoveredX = ref(0);
const showHoverMarker = ref(false);

const { activeScenarioEventId } = useSelectedItems();

const countColor = scaleSequential(interpolateOranges).domain([1, maxCount]);

const timelineWidth = computed(() => {
  return majorTicks.value.length * majorWidth.value;
});

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
  majorTicks.value = dayRange.map((d, index) => ({
    label: majorFormatter(+d),
    timestamp: +d,
    id: `major-${+d}-${index}`, // شناسه یکتا برای هر tick
  }));

  const hourRange = utcHour.range(start, end, minorStep);
  const minorFormatter = getMinorFormatter(majorWidth);
  minorTicks.value = hourRange.map((d, index) => ({
    label: minorFormatter(+d),
    timestamp: +d,
    id: `minor-${+d}-${index}`, // شناسه یکتا برای هر tick
  }));
  return { minDate: start, maxDate: end };
}

function calculatePixelDate(x: number) {
  const center = width.value / 2;
  const msPerPixel = (MS_PER_HOUR * 24) / majorWidth.value;
  const diff = x - center;
  const newDate = centerTimeStamp.value + diff * msPerPixel;
  const date = new Date(newDate);
  date.setUTCSeconds(0, 0);
  return { date, diff };
}

function getRelativeX(clientX: number): number {
  const rect = el.value?.getBoundingClientRect();
  if (!rect) return 0;
  return clientX - rect.left;
}

let startX = 0;
let accumulatedDrag = 0;
let startTimestamp = 0;

function onPointerDown(evt: PointerEvent) {
  const e = unref(el)!;
  startX = getRelativeX(evt.clientX);
  startTimestamp = scenarioTime.value.valueOf();
  e.setPointerCapture(evt.pointerId);
  isPointerInteraction.value = true;
  isDragging.value = false;
}

function onPointerUp(evt: PointerEvent) {
  if (!isDragging.value && evt.button !== 2) {
    const relativeX = getRelativeX(evt.clientX);
    const { date, diff } = calculatePixelDate(relativeX);
    animate.value = true;
    draggedDiff.value = -diff;
    // round to the nearest 15 minutes
    date.setUTCMinutes(Math.round(date.getUTCMinutes() / 15) * 15);
    setCurrentTime(date.valueOf());
  } else {
    animate.value = false;
    draggedDiff.value = 0;
  }
  isPointerInteraction.value = false;
  isDragging.value = false;
  accumulatedDrag = 0;
}

function onPointerMove(evt: PointerEvent) {
  if (isPointerInteraction.value) {
    const relativeX = getRelativeX(evt.clientX);
    const diff = relativeX - startX;
    accumulatedDrag += Math.abs(diff);
    if (accumulatedDrag < 5) {
      isDragging.value = false;
      return;
    } else {
      isDragging.value = true;
    }
    draggedDiff.value = diff;
    const msPerPixel = (MS_PER_HOUR * 24) / majorWidth.value;
    currentTimestamp.value = Math.floor(startTimestamp - diff * msPerPixel);
    throttledTimeUpdate(currentTimestamp.value);
  }
}

const throttledTimeUpdate = useThrottleFn(setCurrentTime, 100); // افزایش throttle به 100ms

function onHover(e: MouseEvent) {
  const relativeX = getRelativeX(e.clientX);
  const { date } = calculatePixelDate(relativeX);
  // round to the nearest 15 minutes
  date.setUTCMinutes(Math.round(date.getUTCMinutes() / 15) * 15);
  hoveredX.value = relativeX;
  hoveredDate.value = date;
}

const formattedHoveredDate = computed(() => {
  if (!hoveredDate.value) return "";
  // استفاده از فرمت‌کننده شمسی برای hover date
  return jalaliDateTimeFormatter(+hoveredDate.value);
});

function onWheel(e: WheelEvent) {
  if (e.deltaY > 0) {
    majorWidth.value = Math.max(majorWidth.value - 40, 55);
  } else {
    majorWidth.value += 40;
  }
}

const events = computed(() => {
  return store.state.events.map((id) => store.state.eventMap[id]);
  // if (store.state.info.startTime)
  //   scenarioEvents.push({
  //     id: "xx",
  //     title: "Scenario start time",
  //     _type: "scenario",
  //     startTime: store.state.info.startTime,
  //   });
});

function updateEvents(minDate: Date, maxDate: Date) {
  const minTs = +minDate;
  const maxTs = +maxDate;
  const msPerPixel = majorWidth.value / (MS_PER_HOUR * 24);
  eventsWithX.value = events.value
    .filter((e) => {
      return e.startTime >= minTs && e.startTime <= maxTs;
    })
    .map((event) => {
      return { x: (event.startTime - minTs + tzOffset * 60 * 1000) * msPerPixel, event };
    });
  binsWithX.value = histogram
    .filter((bin) => {
      return bin.t >= minTs && bin.t <= maxTs;
    })
    .map((event) => ({
      x: (event.t - minTs + tzOffset * 60 * 1000) * msPerPixel,
      count: event.count,
    }));
}

watch(
  [() => store.state.unitStateCounter, () => store.state.featureStateCounter],
  (a, b) => {
    // فقط وقتی histogram رو بروزرسانی کن که واقعا تغییری اتفاق افتاده باشه
    const oldUnitCounter = b ? b[0] : 0;
    const oldFeatureCounter = b ? b[1] : 0;
    const newUnitCounter = a[0];
    const newFeatureCounter = a[1];
    
    if (newUnitCounter !== oldUnitCounter || newFeatureCounter !== oldFeatureCounter) {
      const { histogram: hg, max: mc } = computeTimeHistogram();
      histogram = hg;
      maxCount = mc;
      redrawCounter.value += 1;
    }
  },
  { immediate: true },
);

// متغیر برای جلوگیری از re-render مکرر
const lastCenterTimestamp = ref(0);
const lastMajorWidth = ref(0);
const lastWidth = ref(0);

watchEffect(() => {
  if (!width.value) return;
  const currentScenarioTimestamp = store.state.currentTime;
  
  // اضافه کردن redrawCounter برای اجبار به رسم مجدد فقط وقتی لازم باشه
  redrawCounter.value;
  
  const tt = new Date(currentScenarioTimestamp);
  let redrawTimeline = false;
  
  if (isDragging.value) {
    // در حین drag کردن timeline رو ادامه نده
    return;
  } else if (animate.value === true) {
    setTimeout(() => {
      animate.value = false;
      draggedDiff.value = 0;
    }, 100);
    return;
  } else {
    // فقط وقتی redraw کن که واقعا تغییری صورت گرفته باشه
    const timestampChanged = Math.abs(currentScenarioTimestamp - lastCenterTimestamp.value) > 60000; // 1 minute threshold
    const widthChanged = Math.abs(majorWidth.value - lastMajorWidth.value) > 5;
    const containerWidthChanged = Math.abs(width.value - lastWidth.value) > 10;
    
    redrawTimeline = timestampChanged || widthChanged || containerWidthChanged || lastCenterTimestamp.value === 0;
  }
  
  if (redrawTimeline) {
    // ذخیره آخرین مقادیر برای مقایسه در دفعه بعد
    lastCenterTimestamp.value = currentScenarioTimestamp;
    lastMajorWidth.value = majorWidth.value;
    lastWidth.value = width.value;
    
    centerTimeStamp.value = currentScenarioTimestamp;
    animate.value = false;
    xOffset.value =
      (tt.getUTCHours() * 60 + tt.getUTCMinutes() + tzOffset + tt.getUTCSeconds() / 60) *
      (majorWidth.value / (24 * 60)) *
      -1;
    const { minDate, maxDate } = updateTicks(
      tt,
      width.value,
      majorWidth.value,
      minorStep.value,
    );
    updateEvents(minDate, maxDate);
  }
});

function onEventClick(event: NScenarioEvent) {
  goToScenarioEvent(event);
}

function onContextMenuAction(action: string, options?: Record<string, any>) {
  if (action === "zoomIn") {
    majorWidth.value += 40;
  } else if (action === "zoomOut") {
    majorWidth.value = Math.max(majorWidth.value - 40, 55);
  } else if (action === "addScenarioEvent") {
    // استفاده از روز شمسی به جای میلادی
    const jalaliDay = dayjs(+hoveredDate.value!).calendar('jalali').date();
    const eventId = addScenarioEvent({
      title: `Event ${jalaliDay}`,
      startTime: +hoveredDate.value!,
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
    <div
      ref="el"
      class="mb-2 w-full sm:max-w-5xl lg:max-w-7xl mx-auto transform overflow-hidden rounded-2xl shadow-xl text-xs transition-all select-none relative text-foreground backdrop-blur-md bg-blue-400/10 supports-[backdrop-filter]:bg-blue-400/15 border border-blue-400/30 dark:border-blue-500/30"
      style="direction: ltr; text-align: left;"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointermove="onPointerMove"
      @wheel="onWheel"
      @mousemove="onHover"
      @mouseenter="showHoverMarker = true"
      @mouseleave="showHoverMarker = false"
      @contextmenu="onContextMenu"
    >
      <div class="bg-muted/60 flex h-6 items-center justify-center overflow-clip">
        <IconTriangleDown class="h-5 w-5 scale-x-150 transform text-gray-600 dark:text-gray-300" />
      </div>
      <div
        class="touch-none text-sm select-none will-change-transform"
        :class="animate ? 'transition-all' : 'transition-none'"
        :style="`transform:translate(${totalXOffset}px)`"
      >
        <div class="flex justify-center">
          <div
            class="relative h-4 flex-none text-center"
            :style="`width: ${timelineWidth}px`"
          >
            <div
              v-for="{ x, count } in binsWithX"
              :key="x"
              class="absolute top-1 h-2 w-4 rounded border border-gray-500"
              :style="`left: ${x}px; width: ${Math.max(
                majorWidth / 24,
                8,
              )}px;background-color: ${countColor(count)}`"
              @mousemove.stop
              :title="`${count} رویداد واحد`"
            ></div>
            <button
              v-for="{ x, event } in eventsWithX"
              type="button"
              :key="event.id"
              class="absolute h-4 w-4 -translate-x-1/2 rounded-full border border-gray-500 bg-amber-500 hover:bg-red-900"
              :style="`left: ${x}px;`"
              @mousemove.stop
              :title="event.title"
              @click.stop="onEventClick(event)"
            />
          </div>
        </div>
        <div class="flex justify-center">
          <div
            class="relative flex-none text-center"
            :style="`width: ${timelineWidth}px`"
          ></div>
        </div>
        <div class="border-border flex justify-center text-foreground text-base">
          <div
            v-for="tick in majorTicks"
            :key="tick.id"
            class="border-border flex-none border-r border-b pl-1 pr-1 py-1 text-center whitespace-nowrap box-border transition-opacity duration-200"
            :class="majorFontClass"
            :style="`width: ${majorWidth}px`"
          >
            <template v-if="showMajorLabels">{{ tick.label }}</template>
          </div>
        </div>
        <div class="flex justify-center text-sm">
          <div
            v-for="(tick, idx) in minorTicks"
            :key="tick.id"
            class="text-muted-foreground border-border min-h-[1.25rem] flex-none border-r pl-1 pr-1 py-0.5 text-center whitespace-nowrap box-border transition-opacity duration-200"
            :class="minorFontClass"
            :style="`width: ${minorWidth}px`"
          >
            <template v-if="showMinorLabels && idx % minorLabelStep === 0">{{ tick.label }}</template>
          </div>
        </div>
      </div>

      <p
        v-if="showHoverMarker && !isDragging"
        class="absolute top-0 right-1 hidden p-0 text-[0.72rem] text-primary select-none sm:block"
      >
        {{ formattedHoveredDate }}
      </p>
      <div
        v-if="showHoverMarker"
        class="hover-hover:flex absolute top-0 w-0.5 bg-primary/50 pointer-events-none"
        :style="`left: ${hoveredX}px; height: 100%`"
      />

      <!-- Hover tooltip -->
      <div
        v-if="showHoverMarker && !isDragging && formattedHoveredDate"
        class="absolute -top-6 translate-x-1 bg-popover text-popover-foreground border border-border rounded px-1.5 py-0.5 text-[0.7rem] shadow"
        :style="`left: ${Math.max(8, Math.min(hoveredX - 24, (el?.getBoundingClientRect()?.width || 0) - 72))}px;`"
      >
        {{ formattedHoveredDate }}
      </div>

      <!-- Compact controls -->
      <div class="absolute left-1 top-1 hidden gap-1 sm:flex">
        <button type="button" class="rounded bg-muted/60 px-1.5 py-0.5 text-[0.7rem] hover:bg-muted" @click.stop="majorWidth = Math.max(majorWidth - 40, 55)">-</button>
        <button type="button" class="rounded bg-muted/60 px-1.5 py-0.5 text-[0.7rem] hover:bg-muted" @click.stop="majorWidth += 40">+</button>
        <button type="button" class="rounded bg-primary/15 px-1.5 py-0.5 text-[0.7rem] text-primary hover:bg-primary/20" @click.stop="setCurrentTime(Date.now())">اکنون</button>
      </div>
    </div>
  </TimelineContextMenu>
</template>
