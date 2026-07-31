<template>
  <div
    class="pointer-events-auto absolute z-20 max-h-[82vh]"
    :class="side === 'left' ? 'top-24 left-2' : 'top-24 right-2'"
    dir="rtl"
  >
    <aside
      class="bg-sidebar border-sidebar-border relative flex max-h-[70vh] flex-col overflow-clip rounded-md border text-right"
      :style="{
        width: widthStore.detailsWidth + 'px',
        minWidth: '300px',
        maxWidth: '44vw',
      }"
    >
      <CloseButton compact class="absolute top-1 right-1 z-[99]" @click="emit('close')" />
      <div class="text-foreground flex-auto overflow-auto p-3 text-sm leading-5">
        <slot />
      </div>
      <PanelResizeHandle
        :width="widthStore.detailsWidth"
        :left="side === 'right'"
        @update="widthStore.detailsWidth = $event"
        @reset="widthStore.resetDetailsWidth()"
      />
    </aside>
  </div>
</template>
<script setup lang="ts">
import CloseButton from "@/components/CloseButton.vue";
import { onMounted, onUnmounted, watch } from "vue";
import { injectStrict } from "@/utils";
import { activeMapKey } from "@/components/injects";
import { useWidthStore } from "@/stores/uiStore";
import PanelResizeHandle from "@/components/PanelResizeHandle.vue";

const props = withDefaults(
  defineProps<{
    /** لبهٔ افقی پنل نسبت به نقشه */
    side?: "left" | "right";
  }>(),
  { side: "left" },
);

const emit = defineEmits(["close"]);
const mapRef = injectStrict(activeMapKey);
const widthStore = useWidthStore();

function applyPadding() {
  const padding = mapRef.value.getView().padding || [0, 0, 0, 0];
  const [top, right, bottom, left] = padding;
  const panelPadding = Math.max(300, Number(widthStore.detailsWidth) || 340) + 12;
  if (props.side === "left") {
    mapRef.value.getView().padding = [top, panelPadding, bottom, left];
  } else {
    mapRef.value.getView().padding = [top, right, bottom, panelPadding];
  }
}

onMounted(() => {
  applyPadding();
});

watch(
  () => widthStore.detailsWidth,
  () => {
    applyPadding();
    mapRef.value?.updateSize();
  },
);

onUnmounted(() => {
  const padding = mapRef.value.getView().padding;
  if (padding) {
    const [top, right, bottom, left] = padding;
    if (props.side === "left") {
      mapRef.value.getView().padding = [top, 0, bottom, left];
    } else {
      mapRef.value.getView().padding = [top, right, bottom, 0];
    }
  }
});
</script>
