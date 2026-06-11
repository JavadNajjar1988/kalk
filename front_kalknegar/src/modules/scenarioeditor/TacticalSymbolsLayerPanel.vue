<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { IconLayersOutline, IconShieldOutline } from "@iconify-prerendered/vue-mdi";
import { storeToRefs } from "pinia";

import ChevronPanel from "@/components/ChevronPanel.vue";
import DotsMenu from "@/components/DotsMenu.vue";
import EditableLabel from "@/components/EditableLabel.vue";
import type { MenuItemData } from "@/components/types";
import { useServicesStore } from "@/modules/tactical-symbol-map/stores/services.js";
import {
  buildTacticalLayerItems,
  readTacticalLayerTuples,
  type TacticalFeatureItem,
  type TacticalFeatureLayerItem,
} from "./tacticalLayerItems";

const servicesStore = useServicesStore();
const { store: tacticalStoreRef } = storeToRefs(servicesStore);
const tacticalLayers = ref<TacticalFeatureLayerItem[]>([]);
const hasAnyTacticalSymbols = computed(() => tacticalLayers.value.length > 0);
const isOpen = ref(true);
const editingFeatureId = ref<string | null>(null);
const editableFeatureName = ref("");

const featureMenuItems: MenuItemData<"rename">[] = [
  { label: "تغییر نام", action: "rename" },
];

let activeStore: any = null;
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

async function refreshTacticalLayers() {
  const serial = ++refreshSerial;
  const store = getTacticalStore();
  const tuples = await readTacticalLayerTuples(store);
  if (serial !== refreshSerial) return;
  tacticalLayers.value = buildTacticalLayerItems(tuples);
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

onUnmounted(() => {
  detachStoreListener();
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

function onFeatureAction(feature: TacticalFeatureItem, action: "rename") {
  if (action === "rename") {
    startRename(feature);
  }
}
</script>

<template>
  <ChevronPanel
    v-if="hasAnyTacticalSymbols"
    label="نمادهای تاکتیکال"
    v-model:open="isOpen"
    class="mb-4"
    header-class="-ml-2"
  >
    <ul class="-mt-6 -ml-5">
      <li v-for="layer in tacticalLayers" :key="layer.id" class="border-l border-transparent">
        <div class="flex items-center py-2 text-sm text-foreground">
          <IconLayersOutline
            class="text-muted-foreground h-5 w-5"
            :class="{ 'opacity-50': layer.isHidden }"
          />
          <span class="mr-2 truncate font-bold" :class="{ 'opacity-50': layer.isHidden }">
            {{ layer.name }}
          </span>
        </div>
        <ul>
          <li
            v-for="feature in layer.features"
            :key="feature.id"
            class="group hover:bg-accent flex items-center justify-between py-2 pr-6 select-none"
            :data-tactical-feature-id="feature.id"
          >
            <div class="flex min-w-0 flex-auto items-center">
              <IconShieldOutline
                class="text-muted-foreground h-5 w-5 flex-none"
                :class="{ 'opacity-50': feature.isHidden || layer.isHidden }"
              />
              <EditableLabel
                v-if="editingFeatureId === feature.id"
                v-model="editableFeatureName"
                text-class="text-sm leading-5 text-foreground"
                class="mr-2 min-w-0 flex-auto"
                @click.stop
                @dblclick.stop
                @update-value="updateFeatureName(feature, $event)"
              />
              <span
                v-else
                class="group-hover:text-accent-foreground mr-2 truncate text-sm text-foreground"
                :class="{ 'opacity-50': feature.isHidden || layer.isHidden }"
              >
                {{ feature.name }}
              </span>
            </div>
            <DotsMenu
              :items="featureMenuItems"
              @action="onFeatureAction(feature, $event)"
              class="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            />
          </li>
        </ul>
      </li>
    </ul>
  </ChevronPanel>
</template>
