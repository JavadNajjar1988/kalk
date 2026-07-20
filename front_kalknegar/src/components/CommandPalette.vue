<template>
  <TransitionRoot :show="open" as="template" @after-leave="" appear>
    <Dialog as="div" class="relative z-10" @close="open = false">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-transparent transition-opacity"></div>
      </TransitionChild>

      <div class="fixed top-10 left-0 right-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0 scale-95 -translate-y-4"
          enter-to="opacity-100 scale-100 translate-y-0"
          leave="ease-in duration-200"
          leave-from="opacity-100 scale-100 translate-y-4"
          leave-to="opacity-0 scale-95 -translate-y-4"
        >
          <DialogPanel
            class="command-palette-panel ring-opacity-5 mx-auto max-w-xl transform divide-y overflow-hidden rounded-2xl shadow-2xl ring-1 transition-all backdrop-blur-xl backdrop-saturate-150"
            :class="isGeoSearch ? 'command-palette-geo' : ''"
          >
            <Combobox @update:modelValue="onSelect">
              <div class="relative">
                <MagnifyingGlass
                  class="command-palette-icon pointer-events-none absolute top-3.5 left-4 h-5 w-5"
                  aria-hidden="true"
                />
                <ComboboxInput
                  class="command-palette-input h-12 w-full border-0 bg-transparent pr-4 pl-11 focus:ring-0 sm:text-sm"
                  placeholder="جستجو..."
                  @change="rawQuery = $event.target.value"
                />
              </div>

              <ComboboxOptions
                v-if="groupedHits && hitCount > 0"
                static
                class="max-h-80 scroll-py-10 scroll-pb-2 space-y-4 overflow-y-auto p-4 pb-2 sm:max-h-[60vh]"
              >
                <li v-for="[source, hits] in groupedHits">
                  <h2 class="text-xs font-semibold text-gray-900">{{ source }}</h2>
                  <ul class="-mx-4 mt-2 text-sm font-medium text-gray-700">
                    <ComboboxOption
                      v-for="item in hits"
                      :key="item.id"
                      :value="item"
                      as="template"
                      v-slot="{ active }"
                    >
                      <CommandPaletteUnitItem
                        v-if="item.category === 'واحدها'"
                        :item="item"
                        :active="active"
                        class=""
                      />
                      <CommandPaletteLayerFeatureItem
                        v-else-if="item.category === 'ویژگی‌ها'"
                        :active="active"
                        :item="item"
                      />
                      <CommandPaletteImageLayerItem
                        v-else-if="item.category === 'لایه‌های نقشه'"
                        :active="active"
                        :item="item"
                      />
                      <CommandPaletteEventItem
                        v-else-if="item.category === 'رویدادها'"
                        :active="active"
                        :item="item"
                      />
                      <CommandPalettePlaceItem
                        :item="item"
                        v-else-if="item.category === 'مکان‌ها'"
                        :active="active"
                        :center="mapCenter"
                      />
                      <CommandPaletteActionItem
                        v-else-if="item.category === 'عملیات'"
                        :active="active"
                        :item="item"
                      />
                      <p v-else>{{ item }}</p>
                    </ComboboxOption>
                  </ul>
                </li>
              </ComboboxOptions>

              <CommandPaletteHelp v-if="showHelp" />

              <div
                v-if="geoDebouncedQuery !== '' && rawQuery !== '?' && hitCount === 0"
                class="px-6 py-14 text-center text-sm sm:px-14"
              >
                <Warning
                  class="mx-auto h-6 w-6 text-gray-400"
                  aria-hidden="true"
                />
                <p class="mt-4 font-semibold text-gray-900">نتیجه‌ای یافت نشد</p>
              </div>
              <CommandPaletteFooter
                :raw-query="rawQuery"
                @click-actions="rawQuery = '>'"
              />
            </Combobox>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";
import { PhMagnifyingGlass as MagnifyingGlass } from "@phosphor-icons/vue";
import { PhWarning as Warning } from "@phosphor-icons/vue";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import CommandPaletteFooter from "@/components/CommandPaletteFooter.vue";
import CommandPaletteHelp from "@/components/CommandPaletteHelp.vue";
import { useDebounce, useVModel } from "@vueuse/core";
import { useActionSearch, useScenarioSearch } from "@/composables/searching";
import CommandPaletteUnitItem from "@/components/CommandPaletteUnitItem.vue";
import CommandPaletteLayerFeatureItem from "@/components/CommandPaletteLayerFeatureItem.vue";
import type {
  ActionSearchResult,
  EventSearchResult,
  LayerFeatureSearchResult,
  MapLayerSearchResult,
  UnitSearchResult,
} from "@/components/types";
import CommandPaletteEventItem from "@/components/CommandPaletteEventItem.vue";
import { useGeoStore } from "@/stores/geoStore";
import { toLonLat } from "ol/proj";
import { type PhotonSearchResult, useGeoSearch } from "@/composables/geosearching";
import CommandPalettePlaceItem from "@/components/CommandPalettePlaceItem.vue";
import { useUiStore } from "@/stores/uiStore";
import CommandPaletteActionItem from "@/components/CommandPaletteActionItem.vue";
import CommandPaletteImageLayerItem from "@/components/CommandPaletteImageLayerItem.vue";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits([
  "update:modelValue",
  "select-unit",
  "select-layer",
  "select-feature",
  "select-place",
  "select-event",
  "select-action",
  "select-image-layer",
]);

const geoStore = useGeoStore();
const uiStore = useUiStore();
const { photonSearch } = useGeoSearch();
const { searchActions, actionItems } = useActionSearch();
const open = useVModel(props, "modelValue", emit);

const rawQuery = ref("");
const query = computed(() => rawQuery.value.replace(/^[#@>]/, ""));
const showHelp = computed(() => rawQuery.value === "?");
const isGeoSearch = computed(
  () => uiStore.searchGeoMode || rawQuery.value.startsWith("@"),
);

const isActionSearch = computed(
  () => rawQuery.value.startsWith("#") || rawQuery.value.startsWith(">"),
);

const debouncedQuery = useDebounce(query, 200);
const geoDebouncedQuery = useDebounce(query, 500);
const { search } = useScenarioSearch(searchActions);

interface ExtendedPhotonSearchResult extends PhotonSearchResult {
  category: "مکان‌ها";
}

const groupedHits = ref<
  | ReturnType<typeof search>["groups"]
  | Map<"مکان‌ها", ExtendedPhotonSearchResult[]>
  | Map<"عملیات", ActionSearchResult[]>
>();
const mapCenter = ref<number[] | null | undefined>();

const hitCount = ref(0);

watch(open, (isOpen) => {
  if (isOpen) {
    if (geoStore.olMap) {
      const center = geoStore.olMap.getView().getCenter();
      mapCenter.value = center && toLonLat(center);
    } else {
      mapCenter.value = null;
    }
  }
});

watchEffect(() => {
  if (isGeoSearch.value || isActionSearch.value || !debouncedQuery.value.trim()) return;
  const { numberOfHits, groups } = search(debouncedQuery.value);
  hitCount.value = numberOfHits;
  groupedHits.value = groups;
});

watch(
  () => isGeoSearch.value && geoDebouncedQuery.value.trim(),
  async (q) => {
    if (!q) return;
    const data = await photonSearch(q, { mapCenter: mapCenter.value });
    groupedHits.value = new Map([
      ["مکان‌ها", data.map((d) => ({ ...d, category: "مکان‌ها" }))],
    ]);
    hitCount.value = data.length;
  },
);

watch([() => isActionSearch.value, () => query.value.trim()], async ([isa, q]) => {
  if (!isa) return;
  const filteredActions = q ? searchActions(q) : actionItems;
  groupedHits.value = new Map([["عملیات", filteredActions]]);
  hitCount.value = filteredActions.length;
});

function onSelect(
  item:
    | UnitSearchResult
    | LayerFeatureSearchResult
    | EventSearchResult
    | ExtendedPhotonSearchResult
    | ActionSearchResult
    | MapLayerSearchResult,
) {
  if (item.category === "واحدها") emit("select-unit", item.id);
  else if (item.category === "ویژگی‌ها") {
    if (item.type === "layer") {
      emit("select-layer", item.id);
    } else {
      emit("select-feature", item.id);
    }
  } else if (item.category === "لایه‌های نقشه") {
    emit("select-image-layer", item.id);
  } else if (item.category === "رویدادها") {
    emit("select-event", item);
  } else if (item.category === "مکان‌ها") {
    emit("select-place", item);
  } else if (item.category === "عملیات") {
    emit("select-action", item.action);
  }
  open.value = false;
}
</script>
<style scoped>
.command-palette-panel {
  background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.command-palette-panel > * {
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:global(.dark) .command-palette-panel {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

:global(.dark) .command-palette-panel > * {
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .command-palette-panel {
    background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  }
  
  :global(.dark) .command-palette-panel {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
}

.command-palette-geo {
  background-color: color-mix(in srgb, var(--color-destructive) 20%, transparent) !important;
}

:global(.dark) .command-palette-geo {
  background-color: color-mix(in srgb, var(--color-destructive) 8%, transparent) !important;
}

.command-palette-icon {
  color: color-mix(in srgb, var(--color-primary) 80%, black);
}

:global(.dark) .command-palette-icon {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
}

.command-palette-input {
  color: color-mix(in srgb, var(--color-primary) 90%, black);
}

.command-palette-input::placeholder {
  color: color-mix(in srgb, var(--color-primary) 60%, transparent);
}

:global(.dark) .command-palette-input {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
}

:global(.dark) .command-palette-input::placeholder {
  color: color-mix(in srgb, var(--color-primary) 70%, transparent);
}
</style>
