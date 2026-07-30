<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { rawTimeZones } from "@vvo/tzdb";
import SimpleSelect from "@/components/SimpleSelect.vue";
import { buildTimezoneLocationOptions } from "@/components/timezoneLocationOptions";

const timeZone = defineModel<string>({ default: "UTC" });
const options = buildTimezoneLocationOptions(rawTimeZones);
options.countries.unshift({ label: "زمان هماهنگ جهانی", value: "ZZ" });
options.locationsByCountry.ZZ = [{ label: "UTC", value: "UTC" }];

function findCountry(zoneName: string) {
  return (
    Object.entries(options.locationsByCountry).find(([, locations]) =>
      locations.some((location) => location.value === zoneName),
    )?.[0] || "ZZ"
  );
}

const selectedCountry = ref(findCountry(timeZone.value));
const locations = computed(() => options.locationsByCountry[selectedCountry.value] || []);

watch(timeZone, (value) => {
  selectedCountry.value = findCountry(value);
});

watch(selectedCountry, (country) => {
  if (findCountry(timeZone.value) === country) return;
  const firstLocation = options.locationsByCountry[country]?.[0];
  if (firstLocation) timeZone.value = firstLocation.value;
});
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <SimpleSelect label="کشور" :items="options.countries" v-model="selectedCountry" />
    <SimpleSelect label="شهر / منطقه زمانی" :items="locations" v-model="timeZone" />
  </div>
</template>
