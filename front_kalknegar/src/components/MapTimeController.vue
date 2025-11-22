<template>
  <div class="flex items-center space-x-2">
    <p
      v-if="!hideTime"
      class="pointer-events-none font-mono text-xl font-bold sm:text-2xl text-gray-900 dark:text-gray-100"
      style="text-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 4px rgba(0, 0, 0, 0.3);"
    >
      {{ persianTimeDisplay }}
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
import { useUiStore } from "@/stores/uiStore";
import BaseToolbar from "./BaseToolbar.vue";
import ToolbarButton from "./ToolbarButton.vue";
import { injectStrict, toPersianDigits } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { useTimeFormatStore } from "@/stores/timeFormatStore";

const props = withDefaults(
  defineProps<{
    showControls?: boolean;
    hideTime?: boolean;
  }>(),
  { showControls: true, hideTime: false },
);

const fmt = useTimeFormatStore();

// Computed property for Persian time display
const persianTimeDisplay = computed(() => {
  return toPersianDigits(fmt.scenarioFormatter.format(state.currentTime));
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
  time: { scenarioTime },
} = injectStrict(activeScenarioKey);

const uiStore = useUiStore();
</script>
