<template>
  <Sheet
    :open="open"
    :modal="false"
    @update:open="(value) => $emit('update:open', value)"
  >
    <SheetContent
      side="right"
      :overlay="false"
      class="symbol-library-sheet w-full p-0 sm:max-w-[500px]"
      @pointer-down-outside="handleOutsideInteraction"
      @interact-outside="handleOutsideInteraction"
    >
      <SheetHeader class="symbol-library-header">
        <div class="symbol-library-heading">
          <div class="symbol-library-mark" aria-hidden="true">
            <PhShieldChevron class="size-5" />
          </div>
          <div>
            <SheetTitle class="text-base font-bold">کتابخانه نمادهای تاکتیکی</SheetTitle>
            <SheetDescription class="mt-1 text-xs">
              استاندارد MIL-STD-2525C
            </SheetDescription>
          </div>
        </div>
        <span class="library-status">
          <span class="library-status-dot"></span>
          آماده ترسیم
        </span>
      </SheetHeader>
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="symbol-attributes">
          <div class="attribute-section">
            <div class="attribute-heading">
              <label class="attribute-label">وابستگی</label>
              <span>هویت عملیاتی نماد</span>
            </div>
            <div class="attribute-options">
              <button
                v-for="aff in affiliations"
                :key="aff.code"
                class="attribute-option"
                :class="{ active: selectedHostility === aff.code }"
                @click="selectHostility(aff.code)"
              >
                <div class="attribute-icon" v-html="aff.icon"></div>
                <span class="attribute-text">{{ aff.labelPersian }}</span>
              </button>
            </div>
          </div>
          <div class="attribute-section">
            <div class="attribute-heading">
              <label class="attribute-label">وضعیت</label>
              <span>حالت نمایش روی نقشه</span>
            </div>
            <div class="attribute-options">
              <button
                v-for="stat in statuses"
                :key="stat.code"
                class="attribute-option"
                :class="{ active: selectedStatus === stat.code }"
                @click="selectStatus(stat.code)"
              >
                <div class="attribute-icon" v-html="stat.icon"></div>
                <span class="attribute-text">{{ stat.labelPersian }}</span>
              </button>
            </div>
          </div>
        </div>
        <div v-if="isDrawingActive" class="drawing-notice">
          <span class="drawing-pulse"></span>
          <span>روی نقشه رسم کنید تا نماد اضافه شود.</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            class="mr-auto h-7 px-1"
            @click="cancelPlacement()"
          >
            لغو
          </Button>
        </div>
        <div
          v-if="placementError"
          class="mx-4 mt-3 rounded-lg border border-red-400/50 bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300"
        >
          {{ placementError }}
        </div>
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-3">
          <div class="min-h-0 flex-1 overflow-y-auto">
            <SimpleSymbolMapSidebar
              v-if="servicesReady"
              @selection-change="onSelectionChange"
              @symbol-dblclick="onSymbolDblClick"
            />
            <div
              v-else-if="initializationError"
              class="flex h-full items-center justify-center px-6 text-center"
            >
              <div class="space-y-3">
                <p class="text-sm font-medium text-red-700">
                  کتابخانه نمادهای تاکتیکی بارگذاری نشد.
                </p>
                <p class="text-muted-foreground text-xs">
                  {{ initializationError }}
                </p>
                <Button type="button" size="sm" @click="initializeServices()">
                  تلاش مجدد
                </Button>
              </div>
            </div>
            <div v-else class="flex h-full items-center justify-center">
              <div class="text-center">
                <div
                  class="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"
                ></div>
                <p class="text-muted-foreground text-sm">در حال بارگذاری...</p>
              </div>
            </div>
          </div>
        </div>
        <div class="symbol-library-footer">
          <div class="min-w-0">
            <span class="selection-caption">نماد انتخاب‌شده</span>
            <p class="selection-label">{{ selectedLabel }}</p>
          </div>
          <Button
            type="button"
            size="sm"
            class="insert-symbol-button"
            :disabled="!canInsert"
            @click="startSymbolPlacement()"
          >
            <PhMapPinPlus class="size-4" />
            درج روی نقشه
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, provide, watch, onMounted, computed, onUnmounted } from "vue";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PhMapPinPlus, PhShieldChevron } from "@phosphor-icons/vue";
import SimpleSymbolMapSidebar from "@/modules/tactical-symbol-map/SimpleSymbolMapSidebar.vue";
import { ensureScenarioTacticalServices } from "@/modules/tactical-symbol-map/services/scenarioProjectServices";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import * as MILSTD from "@/modules/tactical-symbol-map/symbology/2525c.js";
import { svg } from "@/modules/tactical-symbol-map/symbology/symbol.js";
import { requestTacticalDraw } from "./tacticalDrawRequest";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const servicesReady = ref(false);
const services = ref<any>(null);
const servicesStore = useServicesStore();
let initializationPromise: Promise<any> | null = null;
let initializingScenarioId: string | null = null;
let initializedScenarioId: string | null = null;
let preloadHandle: number | null = null;
let preloadUsesIdleCallback = false;
let placementRequestVersion = 0;
const configuredPreferenceStores = new WeakSet<object>();
const symbolSidebarDefaultSearch = {
  history: [{ key: "root", scope: "@symbol", label: "symbol" }],
  filter: "",
};

// Provide services to child components
provide("services", services);

const activeScenario = injectStrict(activeScenarioKey);

const selectedSymbolId = ref<string | null>(null);
const selectedSymbolTitle = ref<string | null>(null);
const placementError = ref<string | null>(null);
const initializationError = ref<string | null>(null);
const isDrawingActive = ref(false);
const selectedHostility = ref("F");
const selectedStatus = ref("P");

const selectedSidc = computed(() => {
  return selectedSymbolId.value ? selectedSymbolId.value.split(":")[1] : null;
});

const selectedLabel = computed(() => {
  return selectedSymbolTitle.value
    ? `نماد انتخاب‌شده: ${selectedSymbolTitle.value}`
    : "نمادی انتخاب نشده است.";
});

const canInsert = computed(() => {
  return Boolean(selectedSymbolId.value) && servicesReady.value;
});

function handleOutsideInteraction(event: Event) {
  if (isDrawingActive.value) {
    event.preventDefault();
  }
}

const initializeServices = async () => {
  const scenarioId = activeScenario.store.state.id;
  if (!scenarioId) return;

  if (
    initializedScenarioId === scenarioId &&
    servicesReady.value &&
    services.value
  ) {
    return services.value;
  }

  if (initializationPromise && initializingScenarioId === scenarioId) {
    return initializationPromise;
  }

  servicesReady.value = false;
  initializationError.value = null;
  initializingScenarioId = scenarioId;

  const task = (async () => {
    const projectServices = await ensureScenarioTacticalServices({
      scenarioId,
      metadata: activeScenario.store.state.metadata,
      servicesStore,
      waitFor: "library",
    });

    const preferenceStore = projectServices.preferencesStore;
    if (
      preferenceStore &&
      typeof preferenceStore === "object" &&
      !configuredPreferenceStores.has(preferenceStore)
    ) {
      await preferenceStore.put(
        "ui.sidebar.symbol-search",
        symbolSidebarDefaultSearch,
      );
      configuredPreferenceStores.add(preferenceStore);
    }

    // Ignore a stale preload if the active scenario changed while it was running.
    if (activeScenario.store.state.id !== scenarioId) return projectServices;

    services.value = projectServices;
    initializedScenarioId = scenarioId;
    servicesReady.value = true;
    return projectServices;
  })();

  initializationPromise = task;

  try {
    return await task;
  } catch (error) {
    if (activeScenario.store.state.id === scenarioId) {
      console.error("Failed to initialize symbol sidebar services:", error);
      servicesReady.value = false;
      initializationError.value =
        error instanceof Error
          ? error.message
          : "خطای ناشناخته در آماده‌سازی کتابخانه نمادها.";
    }
  } finally {
    if (initializationPromise === task) {
      initializationPromise = null;
      initializingScenarioId = null;
    }
  }
};

function scheduleServicesPreload() {
  const browserWindow = window as Window & {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout: number },
    ) => number;
  };

  if (browserWindow.requestIdleCallback) {
    preloadUsesIdleCallback = true;
    preloadHandle = browserWindow.requestIdleCallback(
      () => {
        preloadHandle = null;
        void initializeServices();
      },
      { timeout: 800 },
    );
    return;
  }

  preloadUsesIdleCallback = false;
  preloadHandle = window.setTimeout(() => {
    preloadHandle = null;
    void initializeServices();
  }, 0);
}

function onSelectionChange(payload: { id: string | null; entry?: any }) {
  selectedSymbolId.value = payload.id;
  selectedSymbolTitle.value = payload.entry?.title || null;
  placementError.value = null;
}

function onSymbolDblClick(payload: { id: string; entry?: any }) {
  onSelectionChange({ id: payload.id, entry: payload.entry });
  startSymbolPlacement();
}

const baseSIDC = "SFGPUCI----K---";
const affiliations = [
  {
    code: "U",
    labelPersian: "نامشخص",
    icon: svg(MILSTD.format(baseSIDC, { identity: "U", status: "P" }), {
      size: 22,
    }),
  },
  {
    code: "F",
    labelPersian: "دوست",
    icon: svg(MILSTD.format(baseSIDC, { identity: "F", status: "P" }), {
      size: 22,
    }),
  },
  {
    code: "H",
    labelPersian: "دشمن",
    icon: svg(MILSTD.format(baseSIDC, { identity: "H", status: "P" }), {
      size: 22,
    }),
  },
  {
    code: "N",
    labelPersian: "خنثی",
    icon: svg(MILSTD.format(baseSIDC, { identity: "N", status: "P" }), {
      size: 22,
    }),
  },
];

const statuses = [
  {
    code: "P",
    labelPersian: "حاضر",
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" stroke="#333" stroke-width="2" fill="white"/></svg>',
  },
  {
    code: "A",
    labelPersian: "برنامه‌ریزی شده",
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" stroke="#333" stroke-width="2" stroke-dasharray="4 2" fill="white"/></svg>',
  },
];

function selectHostility(code: string) {
  selectedHostility.value = code;
  services.value?.emitter?.emit("hostility/selected", { code });
}

function selectStatus(code: string) {
  selectedStatus.value = code;
  services.value?.emitter?.emit("status/selected", { code });
}

async function startSymbolPlacement() {
  placementError.value = null;
  if (!selectedSymbolId.value || !selectedSidc.value) {
    placementError.value = "ابتدا یک نماد را انتخاب کنید.";
    return;
  }
  if (!services.value?.emitter) {
    placementError.value = "سرویس‌های نقشه هنوز آماده نشده‌اند.";
    return;
  }
  isDrawingActive.value = true;
  const requestVersion = ++placementRequestVersion;
  const accepted = await requestTacticalDraw(
    services.value.emitter,
    selectedSymbolId.value,
  );

  if (requestVersion !== placementRequestVersion) return;
  if (!accepted) {
    isDrawingActive.value = false;
    placementError.value =
      "ابزار رسم نقشه آماده نشد. پنل را ببندید و دوباره باز کنید.";
  }
}

function cancelPlacement() {
  placementRequestVersion += 1;
  placementError.value = null;
  isDrawingActive.value = false;
  services.value?.emitter?.emit("command/draw/cancel", {
    originatorId: "symbol-sidebar",
  });
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initializeServices();
    }
    if (!isOpen) {
      cancelPlacement();
    }
  },
);

watch(
  () => activeScenario.store.state.id,
  () => {
    cancelPlacement();
    servicesReady.value = false;
    services.value = null;
    initializedScenarioId = null;
    void initializeServices();
  },
);

onMounted(() => {
  if (props.open) {
    void initializeServices();
    return;
  }
  scheduleServicesPreload();
});

watch(
  () => servicesReady.value,
  (ready) => {
    if (!ready) return;
    selectHostility(selectedHostility.value);
    selectStatus(selectedStatus.value);
  },
  { immediate: true },
);

const handleDrawComplete = () => {
  isDrawingActive.value = false;
};

const handleDrawCancelled = () => {
  placementRequestVersion += 1;
  isDrawingActive.value = false;
};

const handleDrawReady = () => {
  placementError.value = null;
  isDrawingActive.value = true;
};

const handleDrawError = ({ reason }: { reason?: string }) => {
  placementRequestVersion += 1;
  isDrawingActive.value = false;
  placementError.value =
    reason === "symbol-not-found"
      ? "کد این نماد در کتابخانهٔ رسم پیدا نشد."
      : "هندسهٔ این نماد برای رسم روی نقشه پشتیبانی نمی‌شود.";
};

watch(
  () => services.value?.emitter,
  (emitter, _, onCleanup) => {
    if (!emitter) return;
    emitter.on("ui/tactical/draw-complete", handleDrawComplete);
    emitter.on("ui/tactical/draw-cancelled", handleDrawCancelled);
    emitter.on("ui/tactical/draw-ready", handleDrawReady);
    emitter.on("ui/tactical/draw-error", handleDrawError);
    onCleanup(() => {
      emitter.off("ui/tactical/draw-complete", handleDrawComplete);
      emitter.off("ui/tactical/draw-cancelled", handleDrawCancelled);
      emitter.off("ui/tactical/draw-ready", handleDrawReady);
      emitter.off("ui/tactical/draw-error", handleDrawError);
    });
  },
  { immediate: true },
);

onUnmounted(() => {
  if (preloadHandle !== null) {
    const browserWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
    };
    if (preloadUsesIdleCallback) {
      browserWindow.cancelIdleCallback?.(preloadHandle);
    } else {
      window.clearTimeout(preloadHandle);
    }
    preloadHandle = null;
  }
  services.value?.emitter?.off("ui/tactical/draw-complete", handleDrawComplete);
  services.value?.emitter?.off("ui/tactical/draw-cancelled", handleDrawCancelled);
  services.value?.emitter?.off("ui/tactical/draw-ready", handleDrawReady);
  services.value?.emitter?.off("ui/tactical/draw-error", handleDrawError);
});
</script>

<style scoped>
:deep(.symbol-library-sheet) {
  border-right: 1px solid var(--surface-border);
  border-radius: 0 1.25rem 1.25rem 0;
  gap: 0;
  overflow: hidden;
}

.symbol-library-header {
  display: flex;
  min-height: 76px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--surface-border);
  padding: 0.9rem 1rem 0.9rem 3.25rem;
  background:
    radial-gradient(
      circle at 90% 0%,
      color-mix(in srgb, var(--color-primary) 12%, transparent),
      transparent 45%
    ),
    var(--surface-panel);
  text-align: right;
}

.symbol-library-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.symbol-library-mark {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
  border-radius: 0.75rem;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--surface-panel));
}

.library-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  border: 1px solid color-mix(in srgb, #16a34a 28%, transparent);
  border-radius: 999px;
  padding: 0.3rem 0.55rem;
  color: #15803d;
  background: color-mix(in srgb, #22c55e 8%, var(--surface-panel));
  font-size: 0.68rem;
  font-weight: 600;
}

.library-status-dot,
.drawing-pulse {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px color-mix(in srgb, #22c55e 16%, transparent);
}

:deep(.e3de-sidebar) {
  height: 100%;
  width: 100%;
}

.symbol-attributes {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 0.85rem;
  padding: 1rem 1rem 0.85rem;
  border-bottom: 1px solid var(--surface-border);
  background: color-mix(in srgb, var(--surface-panel-muted) 55%, var(--surface-panel));
}

.attribute-section {
  min-width: 0;
}

.attribute-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.65rem;
}

.attribute-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-foreground);
}

.attribute-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
  gap: 0.4rem;
}

.attribute-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  min-height: 62px;
  padding: 0.45rem 0.35rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.65rem;
  color: var(--color-foreground);
  background: var(--surface-panel);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.attribute-option:hover {
  border-color: color-mix(in srgb, var(--color-primary) 42%, var(--surface-border));
  background: color-mix(in srgb, var(--color-primary) 5%, var(--surface-panel));
  transform: translateY(-1px);
}

.attribute-option.active {
  border-color: color-mix(in srgb, var(--color-primary) 60%, transparent);
  background: color-mix(in srgb, var(--color-primary) 10%, var(--surface-panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.attribute-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attribute-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.attribute-text {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: 0.68rem;
  font-weight: 600;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawing-notice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.75rem 1rem 0;
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-radius: 0.65rem;
  padding: 0.45rem 0.7rem;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--surface-panel));
  font-size: 0.72rem;
}

.drawing-pulse {
  background: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  animation: drawing-pulse 1.6s ease-out infinite;
}

.symbol-library-footer {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid var(--surface-border);
  padding: 0.75rem 1rem;
  background: var(--surface-panel);
  box-shadow: 0 -8px 20px color-mix(in srgb, var(--surface-shadow) 45%, transparent);
}

.selection-caption {
  display: block;
  margin-bottom: 0.18rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.65rem;
}

.selection-label {
  max-width: 260px;
  overflow: hidden;
  color: var(--color-foreground);
  font-size: 0.75rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.insert-symbol-button {
  flex: 0 0 auto;
  gap: 0.4rem;
  border-radius: 0.65rem;
}

@keyframes drawing-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@media (max-width: 460px) {
  .symbol-attributes {
    grid-template-columns: 1fr;
  }

  .library-status,
  .attribute-heading span {
    display: none;
  }
}
</style>
