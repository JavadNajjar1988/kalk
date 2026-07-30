<script setup lang="ts">
import PanelHeading from "@/components/PanelHeading.vue";
import HeadingDesciption from "@/components/HeadingDescription.vue";
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
  <div class="space-y-4 py-4">
    <section class="bg-card rounded-xl border p-4 shadow-sm">
      <PanelHeading>زمان و تاریخ</PanelHeading>
      <HeadingDesciption>
        قالب نمایش زمان سناریو و نوشته‌های روی نقشه را جداگانه انتخاب کنید.
      </HeadingDesciption>
      <div class="mt-4 border-t pt-4">
        <p class="text-foreground text-sm font-medium">موقعیت زمانی سناریو</p>
        <p class="text-muted-foreground mt-1 mb-3 text-xs leading-5">
          کشور و نزدیک‌ترین شهر را انتخاب کنید. ساعت نقشه و سایه شب‌و‌روز با این انتخاب
          هماهنگ می‌شوند.
        </p>
        <TimezoneLocationSelect v-model="scenarioTimeZone" />
      </div>
    </section>
    <div class="bg-card overflow-hidden rounded-xl border shadow-sm">
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
