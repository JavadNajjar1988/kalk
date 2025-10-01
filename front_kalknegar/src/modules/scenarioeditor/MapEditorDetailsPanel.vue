<template>
    <div class="" dir="rtl">
      <aside
        class="pointer-events-auto relative mt-4 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-blue-400/30 dark:border-blue-500/30 bg-blue-400/10 dark:bg-blue-500/10 backdrop-blur-md shadow-xl text-right"
        :style="{ width: widthStore.detailsWidth + 'px' }"
      >
        <CloseButton class="absolute top-1 right-1 z-99" @click="emit('close')" />
        <div class="flex-auto overflow-auto p-3 text-xs text-foreground bg-blue-400/5 dark:bg-blue-500/5 supports-[backdrop-filter]:bg-blue-400/10">
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
