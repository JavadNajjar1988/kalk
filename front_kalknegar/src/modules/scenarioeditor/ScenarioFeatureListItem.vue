<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { IconClockOutline, IconDrag } from "@iconify-prerendered/vue-mdi";
import DotsMenu from "@/components/DotsMenu.vue";
import {
  featureMenuItems,
  getGeometryIcon,
} from "@/modules/scenarioeditor/featureLayerUtils";
import type { ScenarioFeatureActions } from "@/types/constants";
import type { NScenarioFeature } from "@/types/internalModels";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import DropIndicator from "@/components/DropIndicator.vue";
import {
  getScenarioFeatureDragItem,
  idle,
  isScenarioFeatureDragItem,
  type ItemState,
} from "@/types/draggables";
import EditableLabel from "@/components/EditableLabel.vue";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import {
  getScenarioFeatureDisplayName,
  getScenarioFeatureTypeLabel,
} from "./scenarioFeatureNaming";

interface Props {
  feature: NScenarioFeature;
  layer: any;
  selected?: boolean;
  active?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "feature-click", data: MouseEvent): void;
  (e: "feature-double-click", data: MouseEvent): void;
  (e: "feature-action", data: Exclude<ScenarioFeatureActions, "rename">): void;
}>();

const { geo } = injectStrict(activeScenarioKey);
const elRef = ref<HTMLElement | null>(null);
const handleRef = ref<HTMLElement | null>(null);
const itemState = ref<ItemState>(idle);
const hidden = computed(() => props.layer.isHidden);
const isRenaming = ref(false);
const editableName = ref(getScenarioFeatureDisplayName(props.feature));

watch(
  () => props.feature.meta.name,
  () => {
    if (!isRenaming.value) {
      editableName.value = getScenarioFeatureDisplayName(props.feature);
    }
  },
);

function startRename() {
  editableName.value = getScenarioFeatureDisplayName(props.feature);
  isRenaming.value = true;
  nextTick(() => {
    const textarea = elRef.value?.querySelector("textarea");
    textarea?.focus();
    textarea?.select();
  });
}

function updateFeatureName(value: string) {
  const trimmedName = value.trim();
  geo.updateFeature(props.feature.id, {
    meta: {
      name:
        trimmedName ||
        getScenarioFeatureTypeLabel(props.feature.meta.type || props.feature.geometry.type),
    },
  });
  isRenaming.value = false;
}

function onFeatureAction(action: ScenarioFeatureActions) {
  if (action === "rename") {
    startRename();
    return;
  }
  emit("feature-action", action);
}

function onFeatureButtonDoubleClick(event: MouseEvent) {
  if (isRenaming.value) return;
  emit("feature-double-click", event);
}

let dndCleanup: CleanupFn = () => {};

onMounted(() => {
  if (!elRef.value) return;
  dndCleanup = combine(
    draggable({
      element: elRef.value,
      dragHandle: handleRef.value!,
      getInitialData: () => getScenarioFeatureDragItem({ feature: props.feature }),
      onDragStart: () => (itemState.value = { type: "dragging" }),
      onDrop: () => (itemState.value = idle),
    }),
    dropTargetForElements({
      element: elRef.value,
      onDragEnter: ({ self }) => {
        const closestEdge = extractClosestEdge(self.data);
        itemState.value = { type: "drag-over", closestEdge };
      },
      onDragLeave: () => (itemState.value = idle),
      canDrop: ({ source }) => {
        const data = source.data;
        if (!isScenarioFeatureDragItem(data)) return false;
        return data.feature !== props.feature;
      },
      getData: ({ input, element }) => {
        const data = getScenarioFeatureDragItem({ feature: props.feature });
        return attachClosestEdge(data, {
          input,
          element,
          allowedEdges: ["top", "bottom"],
        });
      },
      onDrag({ self }) {
        const closestEdge = extractClosestEdge(self.data);
        itemState.value = { type: "drag-over", closestEdge: closestEdge };
      },
      onDrop: () => {
        itemState.value = idle;
      },
    }),
  );
});

onUnmounted(() => {
  dndCleanup();
});
</script>

<template>
  <li
    ref="elRef"
    class="group hover:bg-accent relative flex items-center justify-between border-l select-none"
    :data-feature-id="feature.id"
    :class="[
      itemState.type === 'drag-over'
        ? 'bg-gray-100'
        : selected
          ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900'
          : 'border-transparent',
      itemState.type === 'dragging' ? 'opacity-20' : '',
    ]"
  >
    <span ref="handleRef">
      <IconDrag
        class="h-6 w-6 cursor-move text-gray-400 group-focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0"
      />
    </span>
    <div
      @click="emit('feature-click', $event)"
      @dblclick="onFeatureButtonDoubleClick($event)"
      class="flex flex-auto items-center py-2.5 sm:py-2"
    >
      <component :is="getGeometryIcon(feature)" class="text-muted-foreground h-5 w-5" />
      <EditableLabel
        v-if="isRenaming"
        v-model="editableName"
        text-class="text-sm leading-5 text-foreground"
        class="ml-2"
        @click.stop
        @dblclick.stop
        @update-value="updateFeatureName"
      />
      <span
        v-else
        class="group-hover:text-accent-foreground text-foreground ml-2 text-left text-sm"
        :class="{ 'font-bold': active, 'opacity-50': hidden }"
      >
        {{ getScenarioFeatureDisplayName(feature) }}
      </span>
    </div>
    <div class="relative flex items-center">
      <IconClockOutline
        v-if="feature.meta.visibleFromT || feature.meta.visibleUntilT"
        class="h-5 w-5 text-gray-400"
      />
      <DotsMenu
        :items="featureMenuItems"
        @action="onFeatureAction"
        class="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      />
    </div>
    <DropIndicator
      v-if="itemState.type === 'drag-over' && itemState.closestEdge"
      :edge="itemState.closestEdge"
      gap="0px"
    />
  </li>
</template>
