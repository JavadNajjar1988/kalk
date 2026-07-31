<template>
  <div>
    <header class="pr-7 text-right">
      <EditableLabel
        v-model="scenarioName"
        text-class="text-base font-semibold leading-6 text-foreground text-right"
        @update-value="updateScenarioInfo({ name: $event })"
      />
    </header>
    <div class="mt-2">
      <ScenarioInfoDetails />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { type ScenarioInfo } from "@/types/scenarioModels";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import EditableLabel from "@/components/EditableLabel.vue";
import ScenarioInfoDetails from "@/modules/scenarioeditor/ScenarioInfoDetails.vue";

const { store } = injectStrict(activeScenarioKey);
const { state } = store;

const scenarioName = ref("");

watch(
  () => state.info.name,
  (v) => (scenarioName.value = v),
  { immediate: true },
);

function updateScenarioInfo(data: Partial<ScenarioInfo>) {
  store.update((s) => {
    Object.assign(s.info, { ...data });
  });
}
</script>
