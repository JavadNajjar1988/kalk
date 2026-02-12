<template>
  <Sheet :open="open" @update:open="(value) => $emit('update:open', value)">
    <SheetContent
      side="right"
      :overlay="false"
      class="w-full sm:max-w-[420px] p-0"
      @pointer-down-outside="handleOutsideInteraction"
      @interact-outside="handleOutsideInteraction"
    >
      <SheetHeader class="px-4 pt-5 pb-3 border-b">
        <SheetTitle>کتابخانه نمادهای تاکتیکی</SheetTitle>
        <SheetDescription>
          انتخاب و جستجوی نمادهای تاکتیکی MIL-STD-2525C
        </SheetDescription>
      </SheetHeader>
      <div class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        <div class="symbol-attributes">
          <div class="attribute-section">
            <label class="attribute-label">وابستگی</label>
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
            <label class="attribute-label">وضعیت</label>
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
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs text-muted-foreground">
            {{ selectedLabel }}
          </p>
          <Button
            type="button"
            size="sm"
            :disabled="!canInsert"
            @click="startSymbolPlacement()"
          >
            درج روی نقشه
          </Button>
        </div>
        <div
          v-if="isDrawingActive"
          class="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary"
        >
          روی نقشه رسم کنید تا نماد اضافه شود.
          <Button type="button" variant="link" size="sm" class="px-1" @click="cancelPlacement()">
            لغو
          </Button>
        </div>
        <div
          v-if="placementError"
          class="rounded-md border border-red-400/60 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {{ placementError }}
        </div>
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto">
            <SimpleSymbolMapSidebar
              v-if="servicesReady"
              @selection-change="onSelectionChange"
              @symbol-dblclick="onSymbolDblClick"
            />
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p class="text-sm text-muted-foreground">در حال بارگذاری...</p>
              </div>
            </div>
          </div>
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
import SimpleSymbolMapSidebar from "@/modules/tactical-symbol-map/SimpleSymbolMapSidebar.vue";
import { initializeProjectServices } from "@/modules/tactical-symbol-map/services/projectServices.js";
import { injectStrict } from "@/utils";
import { activeScenarioKey } from "@/components/injects";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import * as MILSTD from "@/modules/tactical-symbol-map/symbology/2525c.js";
import { svg } from "@/modules/tactical-symbol-map/symbology/symbol.js";

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const servicesReady = ref(false);
const services = ref<any>(null);
const servicesStore = useServicesStore();

// Provide services to child components
provide("services", services);

injectStrict(activeScenarioKey);

const selectedSymbolId = ref<string | null>(null);
const selectedSymbolTitle = ref<string | null>(null);
const placementError = ref<string | null>(null);
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
  if (services.value) {
    servicesReady.value = true;
    return;
  }

  try {
    const projectUUID = "kalknegar-default";
    const projectServices = await initializeProjectServices(projectUUID);
    services.value = projectServices;
    servicesStore.projectStore = projectServices.projectStore;
    servicesStore.preferencesStore = projectServices.preferencesStore;
    servicesStore.sessionStore = projectServices.sessionStore;
    servicesStore.emitter = projectServices.emitter;
    servicesStore.store = projectServices.store;
    servicesStore.featureStore = projectServices.featureStore;
    servicesStore.selection = projectServices.selection;
    servicesStore.osdDriver = projectServices.osdDriver;
    servicesStore.ipcRenderer = projectServices.ipcRenderer;
    servicesReady.value = true;
  } catch (error) {
    console.error("Failed to initialize symbol sidebar services:", error);
  }
};

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
    icon:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" stroke="#333" stroke-width="2" fill="white"/></svg>',
  },
  {
    code: "A",
    labelPersian: "برنامه‌ریزی شده",
    icon:
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" stroke="#333" stroke-width="2" stroke-dasharray="4 2" fill="white"/></svg>',
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

function startSymbolPlacement() {
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
  services.value.emitter.emit("command/entry/draw", { id: selectedSymbolId.value });
}

function cancelPlacement() {
  placementError.value = null;
  isDrawingActive.value = false;
  services.value?.emitter?.emit("command/draw/cancel", { originatorId: "symbol-sidebar" });
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && !servicesReady.value) {
      initializeServices();
    }
    if (!isOpen) {
      cancelPlacement();
    }
  },
);

onMounted(() => {
  if (props.open) {
    initializeServices();
  }
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

watch(
  () => services.value?.emitter,
  (emitter, _, onCleanup) => {
    if (!emitter) return;
    emitter.on("ui/tactical/draw-complete", handleDrawComplete);
    onCleanup(() => {
      emitter.off("ui/tactical/draw-complete", handleDrawComplete);
    });
  },
  { immediate: true },
);

onUnmounted(() => {
  services.value?.emitter?.off("ui/tactical/draw-complete", handleDrawComplete);
});
</script>

<style scoped>
:deep(.e3de-sidebar) {
  height: 100%;
  width: 100%;
}

.symbol-attributes {
  padding: 0.5rem 0.25rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.attribute-section {
  margin-bottom: 0.75rem;
}

.attribute-section:last-child {
  margin-bottom: 0;
}

.attribute-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  text-align: right;
}

.attribute-options {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.attribute-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.45rem 0.65rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.attribute-option:hover {
  border-color: #999;
  background: #f5f5f5;
}

.attribute-option.active {
  border-color: #1976d2;
  background: #e3f2fd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
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
  font-size: 0.7rem;
  color: #333;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

</style>

