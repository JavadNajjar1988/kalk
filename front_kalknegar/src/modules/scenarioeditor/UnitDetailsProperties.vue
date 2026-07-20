<script setup lang="ts">
import type { NUnit, UnitPropertyUpdate } from "@/types/internalModels";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import type { SpeedUnitOfMeasure, UnitProperty } from "@/types/scenarioModels";
import PropertyInput from "@/components/PropertyInput.vue";
import { computed, ref } from "vue";

interface Props {
  unit: NUnit;
  isLocked?: boolean;
}

const props = defineProps<Props>();
const showMax = ref(false);
const showAverage = ref(false);

const activeScenario = injectStrict(activeScenarioKey);
const { unitActions, store } = activeScenario;

const maxSpeed = computed(() => {
  const v = props.unit.properties?.maxSpeed;
  if (v === undefined) return "تنظیم نشده";
  return formatSpeed(v);
});

const averageSpeed = computed(() => {
  const v = props.unit.properties?.averageSpeed;
  if (v === undefined) return "تنظیم نشده";
  return formatSpeed(v);
});

function formatSpeed({ value, uom }: { value: number; uom: SpeedUnitOfMeasure }): string {
  switch (uom) {
    case "km/h":
      return value.toFixed(1) + " کیلومتر در ساعت";
    case "knots":
      return value.toFixed(1) + " گره دریایی";
    case "mph":
      return value.toFixed(1) + " مایل در ساعت";
    case "ft/s":
      return value.toFixed(1) + " فوت در ثانیه";
    default:
      return value.toFixed(1) + " متر در ثانیه";
  }
}

function updateMaxSpeed(data: UnitPropertyUpdate) {
  showMax.value = false;
  // @ts-ignore
  if (isNaN(data.value)) return;
  if (data.value === null || data.value === "" || data.value === undefined) {
    unitActions.updateUnitProperties(props.unit.id, {
      maxSpeed: undefined,
    });
    return;
  }
  unitActions.updateUnitProperties(props.unit.id, {
    maxSpeed: data as UnitProperty,
  });
}

function updateAverageSpeed(data: UnitPropertyUpdate) {
  showAverage.value = false;
  // @ts-ignore
  if (isNaN(data.value)) return;
  if (data.value === null || data.value === "" || data.value === undefined) {
    unitActions.updateUnitProperties(props.unit.id, {
      averageSpeed: undefined,
    });
    return;
  } else {
    unitActions.updateUnitProperties(props.unit.id, {
      averageSpeed: data as UnitProperty,
    });
  }
}
</script>
<template>
  <section class="prose mt-4">
    <div class="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-md overflow-hidden">
      <table class="w-full">
      <thead class="bg-white/5">
        <tr>
          <th>ویژگی واحد</th>
          <th class="w-36">مقدار</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/10 bg-transparent">
        <tr>
          <td>سرعت متوسط</td>
          <td
            class="flex cursor-pointer items-center justify-start"
            @click="showAverage = true"
          >
            <PropertyInput
              v-if="!isLocked && showAverage"
              class="w-32"
              :property="props.unit.properties?.averageSpeed"
              @update-value="updateAverageSpeed"
            />
            <span v-else>{{ averageSpeed }}</span>
          </td>
        </tr>
        <tr>
          <td>حداکثر سرعت</td>
          <td
            class="flex cursor-pointer items-center justify-start"
            @click="showMax = true"
          >
            <PropertyInput
              v-if="!isLocked && showMax"
              class="w-32"
              @update-value="updateMaxSpeed"
            />
            <span v-else>{{ maxSpeed }}</span>
          </td>
        </tr>
      </tbody>
      </table>
    </div>
  </section>
</template>
