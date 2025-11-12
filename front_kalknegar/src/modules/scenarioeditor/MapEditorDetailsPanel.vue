<template>
    <div class="" dir="rtl">
      <aside
        class="map-editor-details-panel pointer-events-auto relative mt-4 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl backdrop-blur-md shadow-xl text-right"
        :style="{ width: widthStore.detailsWidth + 'px' }"
      >
        <CloseButton class="absolute top-1 right-1 z-99" @click="emit('close')" />
        <div class="map-editor-details-content flex-auto overflow-auto p-3 text-xs text-foreground">
          <slot />
        </div>
        <PanelResizeHandle
          :width="widthStore.detailsWidth"
          @update="widthStore.detailsWidth = $event"
          @reset="widthStore.resetDetailsWidth()"
          :left="false"
        />
      </aside>
    </div>
  </template>
  <script setup lang="ts">
  import CloseButton from "@/components/CloseButton.vue";
  import { onMounted, onUnmounted } from "vue";
  import { injectStrict } from "@/utils";
  import { activeMapKey } from "@/components/injects";
  import { useWidthStore } from "@/stores/uiStore";
  import PanelResizeHandle from "@/components/PanelResizeHandle.vue";
  const emit = defineEmits(["close"]);
  const mapRef = injectStrict(activeMapKey);
  const widthStore = useWidthStore();
  onMounted(() => {
    const padding = mapRef.value.getView().padding || [0, 0, 0, 0];
    const [top, right, bottom, left] = padding;
    mapRef.value.getView().padding = [top, 400, bottom, left];
  });
  
  onUnmounted(() => {
    const padding = mapRef.value.getView().padding;
    if (padding) {
      const [top, right, bottom, left] = padding;
      mapRef.value.getView().padding = [top, 0, bottom, left];
    }
  });
  </script>
<style scoped>
.map-editor-details-panel {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:global(.dark) .map-editor-details-panel {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .map-editor-details-panel {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
  
  :global(.dark) .map-editor-details-panel {
    background-color: color-mix(in srgb, var(--color-primary) 6%, transparent);
  }
}

.map-editor-details-content {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

:global(.dark) .map-editor-details-content {
  background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .map-editor-details-content {
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }
}
</style>
