<template>
  <div class="">
    <aside
      class="bg-white dark:bg-slate-800 border-rose-200 dark:border-slate-600 pointer-events-auto relative mt-4 flex max-h-[70vh] flex-col overflow-clip rounded-2xl border-2 shadow-xl"
      :style="{ width: widthStore.detailsWidth + 'px' }"
    >
      <CloseButton class="absolute top-1 right-1 z-99" @click="emit('close')" />
      <div class="flex-auto overflow-auto p-6 bg-gradient-to-b from-white to-rose-50 dark:from-slate-800 dark:to-slate-900">
        <slot />
      </div>
      <PanelResizeHandle
        :width="widthStore.detailsWidth"
        @update="widthStore.detailsWidth = $event"
        @reset="widthStore.resetDetailsWidth()"
        left
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
