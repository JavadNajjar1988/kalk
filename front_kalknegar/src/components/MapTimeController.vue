<template>
  <div class="flex items-center space-x-2">
    <p
      v-if="!hideTime"
      class="pointer-events-none flex min-w-[18rem] flex-row items-baseline justify-between gap-8 font-sans text-xl font-semibold tracking-[0.02em] text-slate-900 sm:min-w-[21rem] sm:text-2xl dark:text-slate-100"
      dir="rtl"
    >
      <span class="whitespace-nowrap">{{ mapTimeDisplay.date }}</span>
      <span class="w-20 shrink-0 text-left font-mono tabular-nums tracking-normal">{{ mapTimeDisplay.time }}</span>
    </p>
    <BaseToolbar v-if="showControls">
      <ToolbarButton @click="emit('show-settings')" start>
        <span class="sr-only">نمایش تنظیمات</span>
        <SettingsIcon class="h-5 w-5" aria-hidden="true"
      /></ToolbarButton>
      <ToolbarButton @click="emit('open-time-modal')">
        <span class="sr-only">انتخاب زمان و تاریخ</span>
        <CalendarIcon class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton type="button" @click="emit('dec-day')">
        <span class="sr-only">قبلی</span>
        <IconChevronLeft class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton @click="emit('inc-day')">
        <span class="sr-only">بعدی</span>
        <IconChevronRight class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton @click="emit('prev-event')">
        <span class="sr-only">بعدی</span>
        <IconSkipPrevious class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton @click="emit('next-event')" end>
        <span class="sr-only">بعدی</span>
        <IconSkipNext class="h-5 w-5" aria-hidden="true" />
      </ToolbarButton>
    </BaseToolbar>
  </div>
</template>

<script setup lang="ts">
import { PhCalendar as CalendarIcon } from "@phosphor-icons/vue";
import { computed } from "vue";

import {
  IconChevronLeft,
  IconChevronRight,
  IconCogOutline as SettingsIcon,
  IconSkipNext,
  IconSkipPrevious,
} from "@iconify-prerendered/vue-mdi";
import BaseToolbar from "./BaseToolbar.vue";
import ToolbarButton from "./ToolbarButton.vue";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { formatMapTimeDisplay } from "./mapTimeControllerDisplay";

const props = withDefaults(
  defineProps<{
    showControls?: boolean;
    hideTime?: boolean;
  }>(),
  { showControls: true, hideTime: false },
);

const mapTimeDisplay = computed(() => {
  return formatMapTimeDisplay(state.currentTime, state.info.timeZone || "UTC");
});

const emit = defineEmits([
  "open-time-modal",
  "inc-day",
  "dec-day",
  "next-event",
  "prev-event",
  "show-settings",
]);
const {
  store: { state },
} = injectStrict(activeScenarioKey);
</script>
