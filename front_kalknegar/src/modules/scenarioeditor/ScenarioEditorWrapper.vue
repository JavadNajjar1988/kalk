<script setup lang="ts">
import ScenarioEditor from "@/modules/scenarioeditor/ScenarioEditor.vue";
import ScenarioIntroModal from "@/modules/scenarioeditor/ScenarioIntroModal.vue";
import { useScenario } from "@/scenariostore";
import { onBeforeRouteLeave } from "vue-router";
import { nextTick, onUnmounted, ref, watch } from "vue";
import { useSelectedItems } from "@/stores/selectedStore";
import {
  scenarioApiService,
  type ScenarioIntroStatus,
} from "@/services/api/scenarioApiService";
import { useDebounceFn, useEventListener } from "@vueuse/core";
import ScenarioNotFoundPage from "@/modules/scenarioeditor/ScenarioNotFoundPage.vue";
import { mergePublishedCatalogMapLayers } from "@/services/catalogMapLayersSync";

const props = defineProps<{ scenarioId: string }>();

const { scenario, isReady } = useScenario();

async function applyPublishedCatalogMapLayers() {
  await nextTick();
  try {
    await mergePublishedCatalogMapLayers(scenario.value.geo);
  } catch (e) {
    console.warn("[ScenarioEditorWrapper] catalog map layers merge skipped:", e);
  }
}
const localReady = ref(false);
const scenarioNotFound = ref(false);

const introModalOpen = ref(false);
const introStatus = ref<ScenarioIntroStatus | null>(null);

function resolveIntroVideoUrl(url: string | null | undefined): string {
  if (!url?.trim()) return "";
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const rawBase = String((scenarioApiService as any).baseUrl || "/api").replace(/\/+$/, "");
  try {
    if (rawBase.startsWith("http")) {
      return new URL(u.startsWith("/") ? u : `/${u}`, `${rawBase}/`).href;
    }
    if (typeof window !== "undefined") {
      return new URL(u.startsWith("/") ? u : `/${u}`, `${window.location.origin}${rawBase.startsWith("/") ? "" : "/"}${rawBase}/`).href;
    }
  } catch {
    /* ignore */
  }
  return u;
}

async function refreshIntroStatus(scenarioId: string) {
  try {
    const st = await scenarioApiService.getIntroStatus(scenarioId);
    introStatus.value = st;
    return st;
  } catch (e) {
    console.warn("[ScenarioEditorWrapper] intro-status failed:", e);
    introStatus.value = null;
    return null;
  }
}

async function onIntroComplete(neverShowAgain: boolean) {
  if (isDemoScenario(props.scenarioId)) return;
  try {
    await scenarioApiService.recordIntroView(props.scenarioId, neverShowAgain);
    await refreshIntroStatus(props.scenarioId);
  } catch (e) {
    console.warn("[ScenarioEditorWrapper] intro-view record failed:", e);
  }
}

let currentDemo = "";
const selectedItems = useSelectedItems();

async function broadcastBasemapChange(baseMapId: string) {
  try {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Use the same base that ScenarioApiService resolved.
    const base = (scenarioApiService as any)?.baseUrl || '/api';
    const url = `${String(base).replace(/\/+$/, '')}/scenarios/${encodeURIComponent(props.scenarioId)}/basemap`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ baseMapId }) });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn(
        '[ScenarioEditorWrapper] basemap broadcast rejected:',
        res.status,
        res.statusText,
        detail || url,
      );
    }
  } catch (e) {
    console.warn('[ScenarioEditorWrapper] Failed to broadcast basemap change', e);
  }
}

/** جلوگیری از اسپم به API هنگام کلیک سریع بین چند نقشه پایه (۳D زنده). */
const debouncedBroadcastBasemap = useDebounceFn((baseMapId: string) => {
  void broadcastBasemapChange(baseMapId);
}, 250);

/** بعد از لود سناریو، مقدار نقشه پایه را ثبت می‌کنیم تا همان لحظهٔ لود دوباره به شبیه‌ساز broadcast نشود. */
const basemapBaseline = ref<{ scenarioId: string; baseMapId: string } | null>(null);

function syncBasemapBaselineAfterLoad(expectedScenarioId: string) {
  void nextTick(() => {
    if (props.scenarioId !== expectedScenarioId) {
      return;
    }
    const id = scenario.value?.store?.state?.mapSettings?.baseMapId;
    if (typeof id === "string" && id.trim().length > 0) {
      basemapBaseline.value = { scenarioId: expectedScenarioId, baseMapId: id.trim() };
    } else {
      basemapBaseline.value = null;
    }
  });
}

watch(
  () => props.scenarioId,
  async (newScenarioId) => {
    basemapBaseline.value = null;
    debouncedBroadcastBasemap.cancel?.();
    introModalOpen.value = false;
    introStatus.value = null;
    if (isDemoScenario(newScenarioId)) {
      introModalOpen.value = false;
      introStatus.value = null;
      const demoId = newScenarioId.replace("demo-", "");
      if (demoId !== currentDemo) {
        await scenario.value.io.loadDemoScenario(demoId);
        selectedItems.clear();
        selectedItems.showScenarioInfo.value = true;
      }
      await applyPublishedCatalogMapLayers();
      localReady.value = true;
      syncBasemapBaselineAfterLoad(newScenarioId);
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
            await applyPublishedCatalogMapLayers();
            selectedItems.clear();
            selectedItems.showScenarioInfo.value = true;
            syncBasemapBaselineAfterLoad(newScenarioId);
            const st = await refreshIntroStatus(newScenarioId);
            if (st?.should_show_intro && st.intro_video_url) {
              introModalOpen.value = true;
            }
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

// Live basemap sync to simulator (realtime): when user changes basemap in KalkNegar, broadcast it.
watch(
  () => scenario.value?.store?.state?.mapSettings?.baseMapId,
  (baseMapId) => {
    if (typeof baseMapId !== "string" || !baseMapId.trim()) {
      return;
    }
    const id = baseMapId.trim();
    const b = basemapBaseline.value;
    if (!b || b.scenarioId !== props.scenarioId) {
      return;
    }
    if (id === b.baseMapId) {
      return;
    }
    debouncedBroadcastBasemap(id);
    basemapBaseline.value = { scenarioId: props.scenarioId, baseMapId: id };
  },
);

onUnmounted(() => {
  debouncedBroadcastBasemap.cancel?.();
});

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
  if (scenario.value?.store?.canUndo?.value) {
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

  <ScenarioIntroModal
    v-if="introStatus?.intro_video_url"
    v-model:open="introModalOpen"
    :title="introStatus?.intro_title"
    :summary="introStatus?.intro_summary"
    :video-url="resolveIntroVideoUrl(introStatus?.intro_video_url)"
    @complete="onIntroComplete"
  />

  <button
    v-if="localReady && isReady && !isDemoScenario(scenarioId) && introStatus?.intro_replay_available"
    type="button"
    class="fixed bottom-6 left-6 z-[100] rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:bg-muted"
    @click="introModalOpen = true"
  >
    اینترو سناریو
  </button>
</template>
