<script setup lang="ts">
import { injectStrict } from "@/utils";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import { computed, ref } from "vue";
import type { NScenarioEvent } from "@/types/internalModels";
import PanelHeading from "@/components/PanelHeading.vue";
import { useTimeFormatStore } from "@/stores/timeFormatStore";
import ScenarioEventDropdownMenu from "@/modules/scenarioeditor/ScenarioEventDropdownMenu.vue";
import type { ScenarioEventAction } from "@/types/constants";
import { useSelectedItems } from "@/stores/selectedStore";
import { Button } from "@/components/ui/button";
import dayjs from "@/dayjs";
import { toPersianDigits } from "@/utils/persianNumbers";
import {
  filterScenarioEventsByTime,
  getEventTimeFilterBounds,
  type EventTimeFilterMode,
} from "./scenarioEventTimeFilter";

interface Props {
  selectOnly?: boolean;
  hideDropdown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectOnly: false,
  hideDropdown: false,
});
const emit = defineEmits(["event-click"]);

const {
  store,
  time: { goToScenarioEvent, deleteScenarioEvent, updateScenarioEvent, addScenarioEvent },
} = injectStrict(activeScenarioKey);
const { getModalTimestamp } = injectStrict(timeModalKey);
const { activeScenarioEventId } = useSelectedItems();
const fmt = useTimeFormatStore();
const t = computed(() => store.state.currentTime);
const allEvents = computed(() => store.state.events.map((id) => store.state.eventMap[id]));
const filterMode = ref<EventTimeFilterMode>("all");
const customFrom = ref("");
const customTo = ref("");
const filterBounds = computed(() =>
  getEventTimeFilterBounds({
    mode: filterMode.value,
    currentTime: t.value,
    customFrom: customFrom.value,
    customTo: customTo.value,
  }),
);
const events = computed(() => filterScenarioEventsByTime(allEvents.value, filterBounds.value));

function onEventClick(event: NScenarioEvent) {
  if (!props.selectOnly) goToScenarioEvent(event);
  emit("event-click", event);
}

async function onAction(action: ScenarioEventAction, eventId: string) {
  const scenarioEvent = store.state.eventMap[eventId];
  if (!scenarioEvent) return;
  switch (action) {
    case "changeTime":
      const newTimestamp = await getModalTimestamp(scenarioEvent.startTime, {
        timeZone: store.state.info.timeZone,
        title: "تنظیم زمان رویداد سناریو",
      });
      if (newTimestamp !== undefined) {
        updateScenarioEvent(eventId, { startTime: newTimestamp });
      }
      break;
    case "delete":
      deleteScenarioEvent(eventId);
      break;
  }
}

function addEvent() {
  // استفاده از روز شمسی به جای میلادی
  const jalaliDay = dayjs(t.value).calendar('jalali').date();
  const eventId = addScenarioEvent({ title: `رویداد ${jalaliDay}`, startTime: t.value });
  activeScenarioEventId.value = eventId;
}
</script>
<template>
  <div class="p-0.5">
    <PanelHeading>رویدادهای سناریو</PanelHeading>

    <div class="mt-3 space-y-2 rounded-md border p-2 text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <label for="events-panel-time-filter">بازه نمایش</label>
        <select
          id="events-panel-time-filter"
          v-model="filterMode"
          class="rounded border bg-transparent px-2 py-1"
        >
          <option value="all">همه زمان‌ها</option>
          <option value="day">روز جاری</option>
          <option value="week">هفته جاری</option>
          <option value="month">ماه جاری</option>
          <option value="custom">بازه دلخواه</option>
        </select>
        <span class="text-muted-foreground">
          {{ toPersianDigits(String(events.length)) }} از
          {{ toPersianDigits(String(allEvents.length)) }} رویداد
        </span>
      </div>
      <div v-if="filterMode === 'custom'" class="flex flex-wrap items-center gap-2">
        <input v-model="customFrom" type="datetime-local" class="rounded border bg-transparent px-2 py-1" />
        <span>تا</span>
        <input v-model="customTo" type="datetime-local" class="rounded border bg-transparent px-2 py-1" />
      </div>
    </div>

    <div class="flow-root">
      <p v-if="events.length === 0" class="mt-4 text-sm text-muted-foreground">
        در این بازه زمانی رویدادی وجود ندارد.
      </p>
      <ul class="mt-4">
        <li v-for="(event, eventIdx) in events" :key="event.id" class="group flex">
          <div class="relative flex-auto pb-4">
            <span
              v-if="eventIdx !== events.length - 1"
              class="absolute top-2 left-2 -ml-px h-full w-0.5 bg-gray-200"
              aria-hidden="true"
            />
            <div class="relative flex space-x-4">
              <button
                @click="onEventClick(event)"
                class="mt-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white"
                :class="{
                  'bg-amber-500': event.startTime > t,
                  'bg-gray-300': event.startTime < t,
                  'bg-red-900': event.startTime === t,
                }"
              ></button>
              <div
                class="min-w-0 flex-1 cursor-pointer text-sm"
                @click="onEventClick(event)"
              >
                <p class="text-xs font-medium text-red-900">
                  {{ fmt.scenarioDateFormatter.format(event.startTime) }}
                </p>
                <p class="font-medium">{{ event.title }}</p>
                <p v-if="event.subTitle" class="text-gray-700">
                  {{ event.subTitle }}
                </p>
              </div>
            </div>
          </div>
          <div
            v-if="!hideDropdown"
            class="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          >
            <ScenarioEventDropdownMenu hide-edit @action="onAction($event, event.id)" />
          </div>
        </li>
      </ul>
    </div>

    <Button
      v-if="!selectOnly"
      size="sm"
      variant="outline"
      @click="addEvent()"
      class="mt-4"
      >افزودن رویداد سناریو</Button
    >
  </div>
</template>
