<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import {
  IconEye,
  IconEyeOff,
  IconLayersOutline,
  IconPlus,
  IconStar,
  IconStarOutline,
} from "@iconify-prerendered/vue-mdi";
import { storeToRefs } from "pinia";

import ChevronPanel from "@/components/ChevronPanel.vue";
import DotsMenu from "@/components/DotsMenu.vue";
import type { MenuItemData } from "@/components/types";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import {
  buildTacticalLayerItems,
  createTacticalLayer,
  readTacticalLayerTuples,
  reorderTacticalPanelItems,
  type TacticalFeatureItem,
  type TacticalFeatureLayerItem,
  writeTacticalPanelOrder,
} from "./tacticalLayerItems";
import TacticalSymbolLayerListItem from "./TacticalSymbolLayerListItem.vue";

const servicesStore = useServicesStore();
const serviceRefs = storeToRefs(servicesStore as any) as any;
const tacticalStoreRef = serviceRefs.store;
const tacticalSelectionRef = serviceRefs.selection;
const tacticalLayers = ref<TacticalFeatureLayerItem[]>([]);
const hasTacticalPanel = computed(
  () => Boolean(tacticalStoreRef.value) || tacticalLayers.value.length > 0,
);
const activeTacticalLayerId = ref<string | null>(null);
const isAddingTacticalLayer = ref(false);
const isOpen = ref(true);
const editingFeatureId = ref<string | null>(null);
const editableFeatureName = ref("");
const selectedTacticalFeatureIds = ref<Set<string>>(new Set());

type TacticalLayerAction = "moveUp" | "moveDown";
type TacticalFeatureAction = "rename" | "moveUp" | "moveDown";

const layerMenuItems: MenuItemData<TacticalLayerAction>[] = [
  { label: "بردن بالا", action: "moveUp" },
  { label: "بردن پایین", action: "moveDown" },
];

let activeStore: any = null;
let activeSelection: any = null;
let refreshSerial = 0;

function readMaybeRef<T>(value: T | { value: T }): T {
  if (value && typeof value === "object" && "value" in value) {
    return (value as { value: T }).value;
  }
  return value as T;
}

function getTacticalStore() {
  return readMaybeRef(tacticalStoreRef);
}

function getTacticalSelection() {
  return readMaybeRef(tacticalSelectionRef);
}

async function refreshTacticalLayers() {
  const serial = ++refreshSerial;
  const store = getTacticalStore();
  const [tuples, defaultLayerId] = await Promise.all([
    readTacticalLayerTuples(store),
    typeof store?.defaultLayerId === "function" ? store.defaultLayerId() : null,
  ]);
  if (serial !== refreshSerial) return;
  tacticalLayers.value = buildTacticalLayerItems(tuples);
  activeTacticalLayerId.value =
    typeof defaultLayerId === "string" ? defaultLayerId : null;
}

function onStoreBatch() {
  void refreshTacticalLayers();
}

function detachStoreListener() {
  if (activeStore && typeof activeStore.off === "function") {
    activeStore.off("batch", onStoreBatch);
  }
  activeStore = null;
}

function onSelectionChange({
  selected = [],
  deselected = [],
}: {
  selected?: string[];
  deselected?: string[];
}) {
  const next = new Set(selectedTacticalFeatureIds.value);
  selected.forEach((id) => next.add(id));
  deselected.forEach((id) => next.delete(id));
  selectedTacticalFeatureIds.value = next;
}

function detachSelectionListener() {
  if (activeSelection && typeof activeSelection.off === "function") {
    activeSelection.off("selection", onSelectionChange);
  }
  activeSelection = null;
}

function attachSelectionListener(selection: any) {
  detachSelectionListener();
  activeSelection = selection;
  selectedTacticalFeatureIds.value = new Set(
    typeof activeSelection?.selected === "function" ? activeSelection.selected() : [],
  );
  if (activeSelection && typeof activeSelection.on === "function") {
    activeSelection.on("selection", onSelectionChange);
  }
}

function attachStoreListener(store: any) {
  detachStoreListener();
  activeStore = store;
  if (activeStore && typeof activeStore.on === "function") {
    activeStore.on("batch", onStoreBatch);
  }
  void refreshTacticalLayers();
}

watch(
  () => tacticalStoreRef.value,
  (store) => attachStoreListener(store),
  { immediate: true },
);

watch(
  () => tacticalSelectionRef.value,
  (selection) => attachSelectionListener(selection),
  { immediate: true },
);

onUnmounted(() => {
  detachStoreListener();
  detachSelectionListener();
});

function startRename(feature: TacticalFeatureItem) {
  editingFeatureId.value = feature.id;
  editableFeatureName.value = feature.name;
  nextTick(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      `[data-tactical-feature-id="${feature.id}"] textarea`,
    );
    textarea?.focus();
    textarea?.select();
  });
}

async function updateFeatureName(feature: TacticalFeatureItem, value: string) {
  const store = getTacticalStore();
  const trimmedName = value.trim() || feature.name;
  editingFeatureId.value = null;
  if (!store || typeof store.rename !== "function") return;
  await store.rename(feature.id, trimmedName);
  await refreshTacticalLayers();
}

async function setTacticalVisibility(id: string, isHidden: boolean) {
  const store = getTacticalStore();
  if (!store) return;
  if (isHidden && typeof store.show === "function") {
    await store.show([id]);
  } else if (!isHidden && typeof store.hide === "function") {
    await store.hide([id]);
  }
  await refreshTacticalLayers();
}

async function setActiveTacticalLayer(layerId: string) {
  const store = getTacticalStore();
  if (!store || typeof store.setDefaultLayer !== "function") return;
  await store.setDefaultLayer(layerId);
  activeTacticalLayerId.value = layerId;
  await refreshTacticalLayers();
}

async function addTacticalLayer() {
  const store = getTacticalStore();
  if (!store || isAddingTacticalLayer.value) return;

  isAddingTacticalLayer.value = true;
  try {
    const order = tacticalLayers.value.length + 1;
    const layerId = await createTacticalLayer(store, {
      order,
      name: `لایه تاکتیکال ${order.toLocaleString("fa-IR")}`,
    });
    if (layerId) {
      activeTacticalLayerId.value = layerId;
    }
    await refreshTacticalLayers();
  } finally {
    isAddingTacticalLayer.value = false;
  }
}

function onFeatureClick(feature: TacticalFeatureItem, event: MouseEvent) {
  const selection = getTacticalSelection();
  if (!selection) return;
  if (event.ctrlKey || event.metaKey) {
    if (selectedTacticalFeatureIds.value.has(feature.id)) {
      selection.deselect?.([feature.id]);
    } else {
      selection.select?.([feature.id]);
    }
    return;
  }
  selection.set?.([feature.id]);
}

async function writeLayerOrder(nextLayers: TacticalFeatureLayerItem[]) {
  const store = getTacticalStore();
  await writeTacticalPanelOrder(
    store,
    nextLayers.map((layer) => layer.id),
  );
  await refreshTacticalLayers();
}

async function writeFeatureOrder(nextFeatures: TacticalFeatureItem[]) {
  const store = getTacticalStore();
  await writeTacticalPanelOrder(
    store,
    nextFeatures.map((feature) => feature.id),
  );
  await refreshTacticalLayers();
}

async function moveTacticalLayer(layer: TacticalFeatureLayerItem, action: TacticalLayerAction) {
  const currentIndex = tacticalLayers.value.findIndex((item) => item.id === layer.id);
  const destination = tacticalLayers.value[action === "moveUp" ? currentIndex - 1 : currentIndex + 1];
  if (!destination) return;
  const edge = action === "moveUp" ? "top" : "bottom";
  const nextLayers = reorderTacticalPanelItems(
    tacticalLayers.value,
    layer.id,
    destination.id,
    edge,
  );
  await writeLayerOrder(nextLayers);
}

async function moveTacticalFeature(
  feature: TacticalFeatureItem,
  action: Extract<TacticalFeatureAction, "moveUp" | "moveDown">,
) {
  const layer = tacticalLayers.value.find((item) => item.id === feature.layerId);
  if (!layer) return;
  const currentIndex = layer.features.findIndex((item) => item.id === feature.id);
  const destination = layer.features[action === "moveUp" ? currentIndex - 1 : currentIndex + 1];
  if (!destination) return;
  const edge = action === "moveUp" ? "top" : "bottom";
  const nextFeatures = reorderTacticalPanelItems(
    layer.features,
    feature.id,
    destination.id,
    edge,
  );
  await writeFeatureOrder(nextFeatures);
}

async function onFeatureDrop(
  source: TacticalFeatureItem,
  destination: TacticalFeatureItem,
  edge: Edge,
) {
  if (edge !== "top" && edge !== "bottom") return;
  const layer = tacticalLayers.value.find((item) => item.id === destination.layerId);
  if (!layer) return;
  const nextFeatures = reorderTacticalPanelItems(
    layer.features,
    source.id,
    destination.id,
    edge,
  );
  await writeFeatureOrder(nextFeatures);
}

function onFeatureAction(feature: TacticalFeatureItem, action: TacticalFeatureAction) {
  if (action === "rename") {
    startRename(feature);
    return;
  }
  if (action === "moveUp" || action === "moveDown") {
    void moveTacticalFeature(feature, action);
  }
}
</script>

<template>
  <ChevronPanel
    v-if="hasTacticalPanel"
    label="نمادهای تاکتیکال"
    v-model:open="isOpen"
    class="mb-4"
    header-class="-ml-2"
  >
    <ul v-if="tacticalLayers.length > 0" class="-mt-6 -ml-5">
      <li v-for="layer in tacticalLayers" :key="layer.id" class="border-l border-transparent">
        <div class="group flex items-center justify-between py-2 text-sm text-foreground">
          <div class="flex min-w-0 items-center">
            <IconLayersOutline
              class="text-muted-foreground h-5 w-5"
              :class="{ 'opacity-50': layer.isHidden }"
            />
            <span
              class="mr-2 truncate font-bold"
              :class="[
                layer.isHidden ? 'opacity-50' : '',
                activeTacticalLayerId === layer.id ? 'text-red-900' : '',
              ]"
            >
              {{ layer.name }}
            </span>
          </div>
          <div class="flex items-center">
            <button
              type="button"
              class="text-muted-foreground hover:text-primary-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
              title="تنظیم به عنوان لایه فعال"
              @click.stop="setActiveTacticalLayer(layer.id)"
            >
              <IconStar v-if="activeTacticalLayerId === layer.id" class="h-5 w-5" />
              <IconStarOutline v-else class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="text-muted-foreground hover:text-primary-foreground mr-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
              title="تغییر قابلیت مشاهده لایه"
              @click.stop="setTacticalVisibility(layer.id, layer.isHidden)"
            >
              <IconEyeOff v-if="layer.isHidden" class="h-5 w-5" />
              <IconEye v-else class="h-5 w-5" />
            </button>
            <DotsMenu
              :items="layerMenuItems"
              @action="moveTacticalLayer(layer, $event)"
              class="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            />
          </div>
        </div>
        <ul>
          <TacticalSymbolLayerListItem
            v-for="feature in layer.features"
            :key="feature.id"
            :feature="feature"
            :layer-hidden="layer.isHidden"
            :selected="selectedTacticalFeatureIds.has(feature.id)"
            :editing="editingFeatureId === feature.id"
            :editable-name="editableFeatureName"
            @feature-click="onFeatureClick"
            @feature-action="onFeatureAction"
            @feature-visibility="setTacticalVisibility(feature.id, feature.isHidden)"
            @feature-drop="onFeatureDrop"
            @update-editable-name="editableFeatureName = $event"
            @update-feature-name="updateFeatureName"
          />
        </ul>
      </li>
    </ul>
    <p v-else class="-mt-3 -ml-5 text-right text-xs text-muted-foreground">
      هنوز لایه تاکتیکال وجود ندارد.
    </p>
    <div class="-ml-5 flex justify-end">
      <button
        type="button"
        class="border-border hover:bg-muted flex items-center rounded border px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!tacticalStoreRef || isAddingTacticalLayer"
        @click="addTacticalLayer"
      >
        <IconPlus class="ml-2 h-5 w-5" />
        افزودن لایه تاکتیکال
      </button>
    </div>
  </ChevronPanel>
</template>
