<template>
  <div class="flex w-full items-center justify-between p-4">
    <div>
      <p class="text-sm font-medium text-gray-700">
        {{ persianDate }}
      </p>
      <p class="text-sm font-medium text-gray-900">
        {{ persianTime }}
      </p>
    </div>

    <BaseToolbar>
      <ToolbarButton @click="openTimeDialog" start>
        <span class="sr-only">انتخاب زمان و تاریخ</span>
        <CalendarIcon class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton @click="jumpToPrevEvent()">
        <span class="sr-only">قبلی</span>
        <IconSkipPrevious class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton @click="jumpToNextEvent()">
        <span class="sr-only">بعدی</span>
        <IconSkipNext class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton type="button" @click="subtract(1, 'day', true)">
        <span class="sr-only">قبلی</span>
        <IconChevronLeft class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton @click="add(1, 'day', true)" end>
        <span class="sr-only">بعدی</span>
        <IconChevronRight class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
    </BaseToolbar>

    <GlobalEvents
      v-if="uiStore.shortcutsEnabled"
      :filter="inputEventFilter"
      @keyup.t="openTimeDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { PhCalendar as CalendarIcon } from "@phosphor-icons/vue";
import { computed } from "vue";

import {
  IconChevronLeft,
  IconChevronRight,
  IconSkipNext,
  IconSkipPrevious,
} from "@iconify-prerendered/vue-mdi";
import { GlobalEvents } from "vue-global-events";
import { useUiStore } from "@/stores/uiStore";
import { inputEventFilter } from "./helpers";
import BaseToolbar from "./BaseToolbar.vue";
import ToolbarButton from "./ToolbarButton.vue";
import { injectStrict, toPersianDigits } from "@/utils";
import { activeScenarioKey, timeModalKey } from "@/components/injects";
import { 
  jalaliDateTimeFormatter,
  formatPersianDateShort,
  jalaliFormTimeFormatter 
} from "@/utils/jalaliFormatters";

const {
  store: { state },
  time: { scenarioTime, setCurrentTime, add, subtract, jumpToNextEvent, jumpToPrevEvent },
} = injectStrict(activeScenarioKey);

const { getModalTimestamp } = injectStrict(timeModalKey);

const uiStore = useUiStore();

// Computed properties for Persian Jalali date and time display
const persianDate = computed(() => {
  // نمایش تاریخ شمسی به جای میلادی
  return formatPersianDateShort(scenarioTime.value.valueOf());
});

const persianTime = computed(() => {
  // نمایش زمان با اعداد فارسی
  return toPersianDigits(scenarioTime.value.format("HH:mmZ"));
});

const openTimeDialog = async () => {
  const newTimestamp = await getModalTimestamp(state.currentTime, {
    timeZone: state.info.timeZone,
  });
  if (newTimestamp !== undefined) {
    setCurrentTime(newTimestamp);
  }
};
</script>
