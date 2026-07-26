<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  IconDrag,
  IconEye,
  IconEyeOff,
  IconShieldOutline,
} from "@iconify-prerendered/vue-mdi";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

import DotsMenu from "@/components/DotsMenu.vue";
import DropIndicator from "@/components/DropIndicator.vue";
import EditableLabel from "@/components/EditableLabel.vue";
import type { MenuItemData } from "@/components/types";
import {
  getTacticalFeatureDragItem,
  isTacticalFeatureDragItem,
  type TacticalFeatureItem,
} from "./tacticalLayerItems";
import { idle, type ItemState } from "@/types/draggables";

type TacticalFeatureAction =
  | "zoom"
  | "pan"
  | "rename"
  | "moveUp"
  | "moveDown"
  | "delete"
  | "duplicate";

const props = defineProps<{
  feature: TacticalFeatureItem;
  layerHidden: boolean;
  selected: boolean;
  editing: boolean;
  editableName: string;
}>();

const emit = defineEmits<{
  (e: "feature-click", feature: TacticalFeatureItem, event: MouseEvent): void;
  (e: "feature-action", feature: TacticalFeatureItem, action: TacticalFeatureAction): void;
  (e: "feature-visibility", feature: TacticalFeatureItem): void;
  (e: "feature-drop", source: TacticalFeatureItem, destination: TacticalFeatureItem, edge: Edge): void;
  (e: "update-editable-name", value: string): void;
  (e: "update-feature-name", feature: TacticalFeatureItem, value: string): void;
}>();

const featureMenuItems: MenuItemData<TacticalFeatureAction>[] = [
  { label: "بزرگ‌نمایی به", action: "zoom" },
  { label: "حرکت به", action: "pan" },
  { label: "تغییر نام", action: "rename" },
  { label: "حرکت به بالا", action: "moveUp" },
  { label: "حرکت به پایین", action: "moveDown" },
  { label: "حذف", action: "delete" },
  { label: "تکرار", action: "duplicate" },
];

const elRef = ref<HTMLElement | null>(null);
const handleRef = ref<HTMLElement | null>(null);
const itemState = ref<ItemState>(idle);
let dndCleanup: CleanupFn = () => {};

onMounted(() => {
  if (!elRef.value || !handleRef.value) return;
  dndCleanup = combine(
    draggable({
      element: elRef.value,
      dragHandle: handleRef.value,
      getInitialData: () => getTacticalFeatureDragItem(props.feature),
      onDragStart: () => {
        itemState.value = { type: "dragging" };
      },
      onDrop: () => {
        itemState.value = idle;
      },
    }),
    dropTargetForElements({
      element: elRef.value,
      canDrop: ({ source }) => {
        const data = source.data;
        return (
          isTacticalFeatureDragItem(data) &&
          data.feature.id !== props.feature.id &&
          data.feature.layerId === props.feature.layerId
        );
      },
      getData: ({ input, element }) =>
        attachClosestEdge(getTacticalFeatureDragItem(props.feature), {
          input,
          element,
          allowedEdges: ["top", "bottom"],
        }),
      onDrag: ({ self }) => {
        itemState.value = {
          type: "drag-over",
          closestEdge: extractClosestEdge(self.data),
        };
      },
      onDragEnter: ({ self }) => {
        itemState.value = {
          type: "drag-over",
          closestEdge: extractClosestEdge(self.data),
        };
      },
      onDragLeave: () => {
        itemState.value = idle;
      },
      onDrop: ({ source, self }) => {
        const data = source.data;
        const closestEdge = extractClosestEdge(self.data) ?? "bottom";
        itemState.value = idle;
        if (!isTacticalFeatureDragItem(data)) return;
        emit("feature-drop", data.feature, props.feature, closestEdge);
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
    :data-tactical-feature-id="feature.id"
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
      class="flex min-w-0 flex-auto items-center py-2 pr-1"
      @click="emit('feature-click', feature, $event)"
    >
      <IconShieldOutline
        class="text-muted-foreground h-5 w-5 flex-none"
        :class="{ 'opacity-50': feature.isHidden || layerHidden }"
      />
      <EditableLabel
        v-if="editing"
        :model-value="editableName"
        text-class="text-sm leading-5 text-foreground"
        class="mr-2 min-w-0 flex-auto"
        @click.stop
        @dblclick.stop
        @update:model-value="emit('update-editable-name', $event)"
        @update-value="emit('update-feature-name', feature, $event)"
      />
      <span
        v-else
        class="group-hover:text-accent-foreground mr-2 truncate text-sm text-foreground"
        :class="{ 'font-bold': selected, 'opacity-50': feature.isHidden || layerHidden }"
        @dblclick.stop="emit('feature-action', feature, 'rename')"
      >
        {{ feature.name }}
      </span>
    </div>
    <div class="flex items-center">
      <button
        type="button"
        class="text-muted-foreground hover:text-primary-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
        title="تغییر قابلیت مشاهده نماد"
        @click.stop="emit('feature-visibility', feature)"
      >
        <IconEyeOff v-if="feature.isHidden" class="h-5 w-5" />
        <IconEye v-else class="h-5 w-5" />
      </button>
      <DotsMenu
        :items="featureMenuItems"
        @action="emit('feature-action', feature, $event)"
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
