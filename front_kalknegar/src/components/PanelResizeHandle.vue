<template>
  <button
    ref="el"
    role="separator"
    class="panel-resize-handle absolute top-0 bottom-0 z-30 w-1.5 cursor-col-resize touch-none pointer-none:w-3"
    :class="left ? 'left-0' : 'right-0'"
    @dblclick="resetWidth"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointermove="throttledOnPointerMove"
    type="button"
  ></button>
</template>

<script setup lang="ts">
import { ref, unref } from "vue";
import { useThrottleFn } from "@vueuse/core";
interface Props {
  width: number;
  left?: boolean;
}
const props = withDefaults(defineProps<Props>(), { left: true });
const emit = defineEmits(["update", "dragging", "reset"]);

const isDragging = ref(false);
let initialWidth = 0;
let startX = 0;
const el = ref<HTMLDivElement>();

function onPointerDown(evt: PointerEvent) {
  const e = unref(el)!;
  initialWidth = props.width;
  startX = evt.clientX;
  e.setPointerCapture(evt.pointerId);
  isDragging.value = true;
  emit("dragging", isDragging.value);
}

function onPointerUp(evt: PointerEvent) {
  isDragging.value = false;
  emit("dragging", isDragging.value);
}

function onPointerMove(evt: PointerEvent) {
  if (isDragging.value) {
    emit(
      "update",
      props.left
        ? initialWidth - (evt.clientX - startX)
        : initialWidth + (evt.clientX - startX),
    );
  }
}

function resetWidth() {
  emit("reset");
}

const throttledOnPointerMove = useThrottleFn(onPointerMove, 10);
</script>
<style scoped>
.panel-resize-handle {
  background-color: transparent;
}

.panel-resize-handle:hover {
  background-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
}

@media (pointer: coarse) {
  .panel-resize-handle {
    background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  }
}

:global(.dark) .panel-resize-handle:hover {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

@media (pointer: coarse) {
  :global(.dark) .panel-resize-handle {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
}
</style>
