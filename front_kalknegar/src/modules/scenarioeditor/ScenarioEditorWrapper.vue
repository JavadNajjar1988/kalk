<script setup lang="ts">
import ScenarioEditor from "@/modules/scenarioeditor/ScenarioEditor.vue";
import { useScenario } from "@/scenariostore";
import { onBeforeRouteLeave } from "vue-router";
import { ref, watch } from "vue";
import { useSelectedItems } from "@/stores/selectedStore";
import { scenarioApiService } from "@/services/api/scenarioApiService";
import { useEventListener } from "@vueuse/core";
import ScenarioNotFoundPage from "@/modules/scenarioeditor/ScenarioNotFoundPage.vue";

const props = defineProps<{ scenarioId: string }>();

const { scenario, isReady } = useScenario();
const localReady = ref(false);
const scenarioNotFound = ref(false);

let currentDemo = "";
const selectedItems = useSelectedItems();

watch(
  () => props.scenarioId,
  async (newScenarioId) => {
    if (isDemoScenario(newScenarioId)) {
      const demoId = newScenarioId.replace("demo-", "");
      if (demoId !== currentDemo) {
        await scenario.value.io.loadDemoScenario(demoId);
        selectedItems.clear();
        selectedItems.showScenarioInfo.value = true;
      }
      localReady.value = true;
    } else {
      try {
        console.log('[ScenarioEditorWrapper] Loading scenario:', newScenarioId);
        const scn = await scenarioApiService.getById(newScenarioId);
        console.log('[ScenarioEditorWrapper] Scenario loaded:', scn);
        console.log('[ScenarioEditorWrapper] Scenario type:', scn?.type);
        console.log('[ScenarioEditorWrapper] Scenario keys:', scn ? Object.keys(scn) : 'null');
        
        // بررسی اینکه آیا سناریو ساختار درستی دارد
        if (scn && typeof scn === 'object') {
          // اگر type وجود ندارد، اضافه می‌کنیم
          if (!scn.type) {
            console.warn('[ScenarioEditorWrapper] Scenario missing type, adding ORBAT-mapper');
            scn.type = 'ORBAT-mapper';
          }
          
          // اگر version وجود ندارد، اضافه می‌کنیم
          if (!scn.version) {
            console.warn('[ScenarioEditorWrapper] Scenario missing version, adding 0.40.0');
            scn.version = '0.40.0';
          }
          
          // اگر layers وجود ندارد یا خالی است، یک لایه خالی اضافه می‌کنیم
          if (!scn.layers || !Array.isArray(scn.layers) || scn.layers.length === 0) {
            console.warn('[ScenarioEditorWrapper] Scenario missing layers, adding default layer');
            scn.layers = [{ id: `layer-${Date.now()}`, name: 'Features', features: [] }];
          }
          
          // اگر sides وجود ندارد، اضافه می‌کنیم
          if (!scn.sides) {
            scn.sides = [];
          }
          
          // اگر events وجود ندارد، اضافه می‌کنیم
          if (!scn.events) {
            scn.events = [];
          }
          
          // اگر mapLayers وجود ندارد، اضافه می‌کنیم
          if (!scn.mapLayers) {
            scn.mapLayers = [];
          }
          
          // اگر settings وجود ندارد، اضافه می‌کنیم
          if (!scn.settings) {
            scn.settings = {
              rangeRingGroups: [],
              statuses: [],
              supplyClasses: [
                { name: 'Class I' },
                { name: 'Class II' },
                { name: 'Class III' },
                { name: 'Class IV' },
                { name: 'Class V' },
              ],
              supplyUoMs: [
                { name: 'Kilogram', code: 'KG', type: 'weight' },
                { name: 'Liter', code: 'LI', type: 'volume' },
                { name: 'Each', code: 'EA', type: 'quantity' },
                { name: 'Meter', code: 'MR', type: 'distance' },
                { name: 'Gallon', code: 'GL', type: 'volume' },
              ],
              map: {
                baseMapId: 'osm',
              },
            };
          }
          
          console.log('[ScenarioEditorWrapper] Scenario after fixes:', scn);
          
          if (scn.type === 'ORBAT-mapper') {
            scenario.value.io.loadFromObject(scn as any);
            selectedItems.clear();
            selectedItems.showScenarioInfo.value = true;
          } else {
            console.error('[ScenarioEditorWrapper] Invalid scenario type:', scn.type);
            scenarioNotFound.value = true;
          }
        } else {
          console.error('[ScenarioEditorWrapper] Invalid scenario structure:', scn);
          scenarioNotFound.value = true;
        }
      } catch (e) {
        console.error('[ScenarioEditorWrapper] Failed to load scenario:', e);
        scenarioNotFound.value = true;
      }
      localReady.value = true;
    }
  },
  { immediate: true },
);

function isDemoScenario(scenarioId: string) {
  return scenarioId.startsWith("demo-");
}

onBeforeRouteLeave(async (to, from) => {
  await saveScenarioIfNecessary({ saveDemo: true });
});

useEventListener(document, "visibilitychange", async () => {
  await saveScenarioIfNecessary();
});

useEventListener(window, "beforeunload", async () => {
  await saveScenarioIfNecessary();
});

async function saveScenarioIfNecessary({ saveDemo = false } = {}) {
  // Check if main scenario has changes OR if tactical symbols may have been drawn
  const { useServicesStore } = await import("@/modules/tactical-symbol-map/stores/services.js");
  const servicesStore = useServicesStore();
  const hasScenarioChanges = scenario.value?.store?.canUndo?.value;
  const hasTacticalStore = !!servicesStore.store;

  if (hasScenarioChanges || hasTacticalStore) {
    if (isDemoScenario(props.scenarioId)) {
      if (!saveDemo) {
        return;
      }
      if (
        !window.confirm(
          "شما تغییراتی در سناریوی نمونه ایجاد کرده‌اید. آیا می‌خواهید یک کپی ذخیره کنید؟",
        )
      ) {
        return;
      }
    }

    await scenario.value.io.saveToIndexedDb();
  }
}
</script>
<template>
  <ScenarioEditor
    v-if="localReady && isReady"
    :key="scenario.store.state.id"
    :active-scenario="scenario"
  />
  <ScenarioNotFoundPage v-else-if="scenarioNotFound" />
</template>
