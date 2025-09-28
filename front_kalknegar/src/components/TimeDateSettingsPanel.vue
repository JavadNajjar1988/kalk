<script setup lang="ts">
import PanelHeading from "@/components/PanelHeading.vue";
import HeadingDesciption from "@/components/HeadingDescription.vue";
import { useTimeFormatSettingsStore, useTimeFormatStore } from "@/stores/timeFormatStore";
import { useActiveScenario } from "@/composables/scenarioUtils";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import AccordionPanel from "@/components/AccordionPanel.vue";
import TimeDateSettingsDetails from "@/components/TimeDateSettingsDetails.vue";
import { toPersianDigits } from "@/utils";

const { store } = useActiveScenario();

const currentTime = store.state.currentTime;
const { track, scenario } = storeToRefs(useTimeFormatSettingsStore());
const fmt = useTimeFormatStore();

// Computed properties for Persian time display
const persianScenarioTime = computed(() => {
  return toPersianDigits(fmt.scenarioFormatter.format(currentTime));
});

const persianTrackTime = computed(() => {
  return toPersianDigits(fmt.trackFormatter.format(currentTime));
});
</script>
<template>
  <PanelHeading>زمان و تاریخ</PanelHeading>
  <HeadingDesciption
    >نحوه قالب‌بندی زمان و تاریخ سناریو را انتخاب کنید.</HeadingDesciption
  >
  <AccordionPanel label="فرمت زمان و تاریخ سناریو">
    <template #closedContent>
      <span class="text-sm leading-7 text-gray-600">
        {{ persianScenarioTime }}
      </span>
    </template>
    <TimeDateSettingsDetails
      :sample-time="persianScenarioTime"
      v-model="scenario"
    />
  </AccordionPanel>
  <AccordionPanel label="فرمت نقشه">
    <template #closedContent>
      <span class="text-sm leading-7 text-gray-600">
        {{ persianTrackTime }}
      </span>
    </template>
    <TimeDateSettingsDetails
      :sample-time="persianTrackTime"
      v-model="track"
    />
  </AccordionPanel>
</template>
