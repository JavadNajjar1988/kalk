import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSymbolDesignerStore = defineStore('symbolDesigner', () => {
  const svgPath = ref<string>('');
  const anchors = ref<Array<{ id: string; name: string; x: number; y: number }>>([]);
  const segments = ref<Array<{ id: string; from: string; to: string; svgId?: string }>>([]);

  const anchorCount = computed(() => anchors.value.length);

  return {
    // state
    svgPath,
    anchors,
    segments,
    // getters
    anchorCount,
  };
});


