<script setup lang="ts">
import { useTimeFormatSettingsStore, useTimeFormatStore } from "@/stores/timeFormatStore";
import { useActiveScenario } from "@/composables/scenarioUtils";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import AccordionPanel from "@/components/AccordionPanel.vue";
import TimeDateSettingsDetails from "@/components/TimeDateSettingsDetails.vue";
import TimezoneLocationSelect from "@/components/TimezoneLocationSelect.vue";

const { store } = useActiveScenario();

const currentTime = computed(() => store.state.currentTime);
const { track, scenario } = storeToRefs(useTimeFormatSettingsStore());
const fmt = useTimeFormatStore();
const scenarioTimeZone = computed({
  get: () => store.state.info.timeZone || "UTC",
  set: (value: string) => {
    store.update((s) => {
      s.info.timeZone = value;
    });
  },
});

const scenarioTimePreview = computed(() => {
  return fmt.scenarioFormatter.format(currentTime.value);
});

const mapTimePreview = computed(() => {
  return fmt.trackFormatter.format(currentTime.value);
});
</script>
<template>
  <div class="space-y-3 py-3">
    <section class="bg-card rounded-md border p-3">
      <div>
        <p class="text-foreground text-sm font-medium">موقعیت زمانی سناریو</p>
        <TimezoneLocationSelect class="mt-2" v-model="scenarioTimeZone" />
      </div>
    </section>
    <div class="bg-card overflow-hidden rounded-md border">
      <AccordionPanel label="فرمت زمان و تاریخ سناریو">
        <template #closedContent>
          <span class="text-sm leading-7 text-gray-600">
            {{ scenarioTimePreview }}
          </span>
        </template>
        <TimeDateSettingsDetails :sample-time="scenarioTimePreview" v-model="scenario" />
      </AccordionPanel>
      <AccordionPanel label="فرمت نقشه">
        <template #closedContent>
          <span class="text-sm leading-7 text-gray-600">
            {{ mapTimePreview }}
          </span>
        </template>
        <TimeDateSettingsDetails :sample-time="mapTimePreview" v-model="track" />
      </AccordionPanel>
    </div>
  </div>
</template>
