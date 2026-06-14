<script setup lang="ts">
import { computed } from "vue";
import {
  IconClose as CloseIcon,
  IconSquareEditOutline as EditIcon,
  IconMapMarkerDistance as ShowPathIcon,
  IconTimelineClockOutline,
  IconVectorCurve,
  IconVectorLine,
} from "@iconify-prerendered/vue-mdi";
import FloatingPanel from "@/components/FloatingPanel.vue";

import { useMainToolbarStore } from "@/stores/mainToolbarStore";
import MainToolbarButton from "@/components/MainToolbarButton.vue";
import { useUnitSettingsStore } from "@/stores/geoStore";
import { useSelectedWaypoints } from "@/stores/selectedWaypoints";
import { useSelectedItems } from "@/stores/selectedStore";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import type { PathMode } from "@/geo/unitPath";
import { getPathModeStateTargets } from "@/modules/scenarioeditor/unitTrackPathMode";

const unitSettings = useUnitSettingsStore();
const store = useMainToolbarStore();
const { selectedWaypointIds } = useSelectedWaypoints();
const { selectedUnitIds } = useSelectedItems();
const { unitActions } = injectStrict(activeScenarioKey);

const selectedPathTargets = computed(() =>
  getPathModeStateTargets(unitActions.units.value, {
    selectedWaypointIds: selectedWaypointIds.value,
    selectedUnitIds: selectedUnitIds.value,
  }),
);

const canSetPathMode = computed(
  () => unitSettings.editHistory && selectedPathTargets.value.length > 0,
);

const selectedPathMode = computed<PathMode | "mixed">(() => {
  if (!selectedPathTargets.value.length) return "straight";
  let mode: PathMode | undefined;
  for (const target of selectedPathTargets.value) {
    const unit = unitActions.getUnitById(target.unitId);
    const targetMode = unit?.state?.[target.stateIndex]?.pathMode ?? "straight";
    if (!mode) mode = targetMode;
    if (mode !== targetMode) return "mixed";
  }
  return mode ?? "straight";
});

function setSelectedPathMode(pathMode: PathMode) {
  if (!canSetPathMode.value) return;
  selectedPathTargets.value.forEach(({ unitId, stateIndex }) => {
    unitActions.updateUnitStateEntry(unitId, stateIndex, { pathMode });
  });
}
</script>
<template>
  <FloatingPanel class="pointer-events-auto flex items-center space-x-1 rounded-md p-1">
    <p class="text-muted-foreground px-2 text-sm font-medium">مسیر</p>
    <div class="border-border h-5 border-l" />

    <MainToolbarButton
      title="نمایش مسیر واحد"
      @click="unitSettings.showHistory = !unitSettings.showHistory"
      :active="unitSettings.showHistory"
    >
      <ShowPathIcon class="size-5" />
    </MainToolbarButton>

    <MainToolbarButton
      title="ویرایش مسیر"
      @click="unitSettings.editHistory = !unitSettings.editHistory"
      :active="unitSettings.editHistory"
    >
      <EditIcon class="size-5" />
    </MainToolbarButton>

    <MainToolbarButton
      title="نمایش زمان‌ها"
      @click="unitSettings.showWaypointTimestamps = !unitSettings.showWaypointTimestamps"
      :active="unitSettings.showWaypointTimestamps"
    >
      <IconTimelineClockOutline class="size-5" />
    </MainToolbarButton>

    <div class="border-border h-5 border-l" />

    <MainToolbarButton
      :title="
        canSetPathMode
          ? 'تبدیل مسیر انتخاب‌شده به خطی'
          : 'برای تغییر حالت مسیر، ویرایش مسیر را روشن و یک واحد یا نقطه مسیر را انتخاب کنید'
      "
      :disabled="!canSetPathMode"
      :active="canSetPathMode && selectedPathMode === 'straight'"
      @click="setSelectedPathMode('straight')"
    >
      <IconVectorLine class="size-5" />
    </MainToolbarButton>

    <MainToolbarButton
      :title="
        canSetPathMode
          ? 'تبدیل مسیر انتخاب‌شده به منحنی'
          : 'برای تغییر حالت مسیر، ویرایش مسیر را روشن و یک واحد یا نقطه مسیر را انتخاب کنید'
      "
      :disabled="!canSetPathMode"
      :active="canSetPathMode && selectedPathMode === 'curved'"
      @click="setSelectedPathMode('curved')"
    >
      <IconVectorCurve class="size-5" />
    </MainToolbarButton>

    <MainToolbarButton title="تغییر نوار ابزار" @click="store.clearToolbar()">
      <CloseIcon class="size-5" />
    </MainToolbarButton>
  </FloatingPanel>
</template>
