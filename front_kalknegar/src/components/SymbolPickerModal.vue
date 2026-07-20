<template>
  <NewSimpleModal
    v-model="open"
    :dialog-title="dialogTitle"
    @cancel="emit('cancel')"
    class="sm:max-w-2xl lg:max-w-4xl"
  >
    <div dir="rtl" class="flex h-full flex-col" @keyup.ctrl.enter="onSubmit">
      <header
        class="border-border bg-muted/30 mt-3 flex min-h-24 w-full flex-col items-center justify-between gap-3 rounded-xl border p-3 sm:flex-row"
      >
        <div class="flex items-center gap-3">
          <div
            class="bg-background flex size-16 shrink-0 items-center justify-center rounded-xl border shadow-sm"
          >
            <MilitarySymbol :sidc="csidc" :size="40" :options="finalSymbolOptions" />
          </div>
          <div>
            <p class="text-sm font-semibold">پیش‌نمایش نماد</p>
            <p class="text-muted-foreground mt-1 text-xs">
              تغییرات شما هم‌زمان در این بخش نمایش داده می‌شود.
            </p>
          </div>
        </div>
        <div dir="ltr" class="max-w-full overflow-x-auto">
          <SymbolCodeViewer :sidc="csidc" @update="updateFromSidcInput" />
        </div>
      </header>

      <TabView class="mt-2 flex-auto" v-model:current-tab="currentTab">
        <TabItem
          label="انتخاب"
          v-slot="{ isActive }"
          class="max-h-[50vh] overflow-auto sm:max-h-[60vh]"
        >
          <Combobox @update:modelValue="onSelect">
            <div class="relative">
              <div class="relative">
                <MagnifyingGlassIcon
                  class="text-muted-foreground pointer-events-none absolute top-3.5 right-4 h-5 w-5"
                  aria-hidden="true"
                />
                <ComboboxInput
                  class="border-input bg-background placeholder:text-muted-foreground focus:ring-ring/30 h-12 w-full rounded-lg border pr-11 pl-4 focus:ring-2 sm:text-sm"
                  placeholder="نام نماد یا تغییردهنده را جستجو کنید..."
                  @change="searchQuery = $event.target.value"
                  ref="searchInputRef"
                  @vue:mounted="doFocus"
                />
              </div>
              <ComboboxOptions
                v-if="groupedHits && hitCount > 0"
                class="border-border bg-popover absolute z-50 mt-1 max-h-80 w-full scroll-py-10 space-y-3 overflow-y-auto rounded-xl border p-2 shadow-xl"
              >
                <li v-for="[source, hits] in groupedHits" :key="source">
                  <h2 class="text-muted-foreground px-2 text-xs font-semibold">
                    {{ searchCategoryLabels[source] }}
                  </h2>
                  <ul class="mt-1 space-y-1 text-sm font-medium">
                    <ComboboxOption
                      v-for="item in hits"
                      :key="item.sidc"
                      :value="item"
                      as="template"
                      v-slot="{ active }"
                    >
                      <li
                        :class="[
                          'flex cursor-default items-center rounded-lg px-3 py-2 select-none',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted',
                        ]"
                      >
                        <div class="relative flex w-12 justify-center">
                          <MilitarySymbol
                            :sidc="item.sidc"
                            :size="30"
                            aria-hidden="true"
                            :options="{
                              ...combinedSymbolOptions,
                              outlineColor: 'white',
                              outlineWidth: 4,
                            }"
                          />
                        </div>
                        <p
                          class="mr-3 flex-auto truncate"
                          v-html="visibleSearchHitText(item)"
                        />
                      </li>
                    </ComboboxOption>
                  </ul>
                </li>
              </ComboboxOptions></div
          ></Combobox>

          <form
            class="mt-4 space-y-4 p-0.5"
            @submit.prevent="onSubmit"
            v-if="isLoaded"
            @keydown.ctrl.enter.exact="onSubmit"
            @keydown.meta.enter.exact="onSubmit"
          >
            <div class="flex w-full items-end gap-1">
              <SymbolCodeSelect
                class="flex-auto"
                v-model="symbolSetValue"
                label="مجموعه نماد"
                :items="symbolSets"
                :symbol-options="combinedSymbolOptions"
              />
              <div class="mr-1 hidden flex-none sm:block">
                <BaseButton class="py-4" @click="currentTab = 1">مرور</BaseButton>
              </div>
            </div>

            <template v-if="!hideModifiers">
              <div class="grid gap-4 sm:grid-cols-2" v-if="showReinforcedStatus">
                <SymbolCodeSelect
                  v-model="statusValue"
                  label="وضعیت"
                  :items="statusItems"
                  :symbol-options="combinedSymbolOptions"
                />
                <SymbolCodeSelect
                  v-model="reinforcedReducedValue"
                  label="تقویت شده / کاهش یافته"
                  :items="reinforcedReducedItems"
                  :symbol-options="combinedSymbolOptions"
                />
              </div>
              <SymbolCodeSelect
                v-else
                v-model="statusValue"
                label="وضعیت"
                :items="statusItems"
                :symbol-options="combinedSymbolOptions"
              />

              <SymbolCodeSelect
                v-model="hqtfdValue"
                label="مقر / گروه وظیفه / ساختگی"
                :items="hqtfdItems"
                :symbol-options="combinedSymbolOptions"
              />
              <SymbolCodeSelect
                v-model="emtValue"
                label="رده / تحرک / آرایه کشیده شده"
                :items="emtItems"
                :symbol-options="combinedSymbolOptions"
              />
            </template>

            <SymbolCodeMultilineSelect
              v-model="iconValue"
              label="نماد اصلی"
              :items="icons"
              :symbol-options="combinedSymbolOptions"
            />
            <SymbolCodeSelect
              v-model="mod1Value"
              label="تغییردهنده ۱"
              :items="mod1Items"
              :symbol-options="combinedSymbolOptions"
            />
            <SymbolCodeSelect
              v-model="mod2Value"
              label="تغییردهنده ۲"
              :items="mod2Items"
              :symbol-options="combinedSymbolOptions"
            />
            <SymbolFillColorSelect
              v-if="!hideSymbolColor"
              v-model="internalSymbolOptions.fillColor"
              :default-fill-color="inheritedSymbolOptions?.fillColor"
            />
          </form>
        </TabItem>
        <TabItem label="مرور" v-slot="{ isActive }">
          <keep-alive>
            <SymbolBrowseTab
              v-if="isActive"
              :initial-sidc="csidc"
              @update-sidc="updateFromBrowseTab"
              :symbol-options="combinedSymbolOptions"
            />
          </keep-alive>
        </TabItem>
        <TabItem label="قدیمی" v-slot="{ isActive }">
          <keep-alive>
            <LegacyConverter v-if="isActive" />
          </keep-alive>
        </TabItem>
      </TabView>
      <div
        class="border-border mt-3 flex shrink-0 flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end"
      >
        <SecondaryButton
          v-if="!hideModifiers"
          type="button"
          @click="clearModifiers()"
          class="sm:ml-2"
          >پاک‌کردن تغییردهنده‌ها
        </SecondaryButton>
        <PrimaryButton @click="onSubmit()">تأیید و انتخاب نماد</PrimaryButton>
      </div>
    </div>
  </NewSimpleModal>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch, watchEffect } from "vue";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/vue";

import PrimaryButton from "./PrimaryButton.vue";
import SymbolCodeSelect from "./SymbolCodeSelect.vue";
import {
  breakpointsTailwind,
  useBreakpoints,
  useDebounce,
  useVModel,
  whenever,
} from "@vueuse/core";
import SymbolCodeMultilineSelect from "./SymbolCodeMultilineSelect.vue";
import { useSymbolItems } from "@/composables/symbolData";
import NProgress from "nprogress";
import TabView from "./TabView.vue";
import TabItem from "./TabItem.vue";
import SymbolBrowseTab from "./SymbolBrowseTab.vue";
import SecondaryButton from "./SecondaryButton.vue";
import MilitarySymbol from "@/components/MilitarySymbol.vue";
import {
  mapReinforcedStatus2Field,
  type ReinforcedStatus,
  type UnitSymbolOptions,
} from "@/types/scenarioModels";
import SymbolFillColorSelect from "@/components/SymbolFillColorSelect.vue";
import SymbolCodeViewer from "@/components/SymbolCodeViewer.vue";
import { Sidc } from "@/symbology/sidc";
import {
  type MainIconSearchResult,
  type ModifierOneSearchResult,
  type ModifierTwoSearchResult,
  type SymbolSearchResult,
  useSymbologySearch,
} from "@/composables/symbolSearching";
import { PhMagnifyingGlass as MagnifyingGlassIcon } from "@phosphor-icons/vue";
import { doFocus } from "@/composables/utils";
import BaseButton from "@/components/BaseButton.vue";
import NewSimpleModal from "@/components/NewSimpleModal.vue";
import { applySymbolSearchSelection } from "@/symbology/symbolSelection";
import { toPersianDigits } from "@/utils/persianNumbers";

const LegacyConverter = defineAsyncComponent(
  () => import("@/components/LegacyConverter.vue"),
);

interface Props {
  isVisible?: boolean;
  sidc?: string;
  dialogTitle?: string;
  hideModifiers?: boolean;
  hideSymbolColor?: boolean;
  inheritedSymbolOptions?: UnitSymbolOptions;
  symbolOptions?: UnitSymbolOptions;
  initialTab?: number;
  reinforcedStatus?: ReinforcedStatus;
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: true,
  dialogTitle: "انتخابگر نماد",
  hideModifiers: false,
  hideSymbolColor: false,
});
const emit = defineEmits(["update:isVisible", "update:sidc", "cancel"]);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual("md");

const searchInputRef = ref();
const open = useVModel(props, "isVisible");
const searchQuery = ref("");
const debouncedQuery = useDebounce(searchQuery, 100);
const currentTab = ref(props.initialTab ?? 0);

const groupedHits = ref<ReturnType<typeof search>["groups"]>();

const hitCount = ref(0);

const searchCategoryLabels: Record<string, string> = {
  "Main icon": "نمادهای اصلی",
  "Modifier 1": "تغییردهندهٔ نوع اول",
  "Modifier 2": "تغییردهندهٔ نوع دوم",
};

function visibleSearchHitText(item: SymbolSearchResult) {
  if (!/[A-Za-z]/.test(item.text)) return item.highlight || item.text;
  const prefix = item.category === "Main icon" ? "نماد" : "تغییردهنده";
  return `${prefix} ${toPersianDigits(item.code)}`;
}

const internalSymbolOptions = ref<UnitSymbolOptions>({
  ...(props.symbolOptions || {}),
});

const combinedSymbolOptions = computed(() => ({
  ...(props.inheritedSymbolOptions || {}),
  ...cleanObject(internalSymbolOptions.value || {}),
}));

const finalSymbolOptions = computed(() => ({
  ...combinedSymbolOptions.value,
  ...cleanObject({
    reinforcedReduced: mapReinforcedStatus2Field(reinforcedReducedValue.value),
  }),
}));

// remove empty values in object
const cleanObject = (obj: any) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] && typeof obj[key] === "object") cleanObject(obj[key]);
    else if (obj[key] === "" || obj[key] === null || obj[key] === undefined)
      delete obj[key];
  });
  return obj;
};

const {
  csidc,
  loadData,
  isLoaded,
  sidValue,
  symbolSetValue,
  iconValue,
  statusValue,
  statusItems,
  hqtfdItems,
  hqtfdValue,
  emtValue,
  emtItems,
  mod1Value,
  mod2Value,
  mod1Items,
  mod2Items,
  icons,
  symbolSets,
  reinforcedReducedItems,
  reinforcedReducedValue,
} = useSymbolItems(
  computed(() => props.sidc || ""),
  props.reinforcedStatus,
);
loadData();

whenever(isLoaded, () => NProgress.done(), { immediate: true });

const { search } = useSymbologySearch(sidValue);

const showReinforcedStatus = computed(() => {
  return symbolSetValue.value === "10" || symbolSetValue.value === "11";
});

watchEffect(() => {
  const { numberOfHits, groups } = search(debouncedQuery.value);
  hitCount.value = numberOfHits;
  groupedHits.value = groups;
});

const onSubmit = () => {
  emit("update:sidc", {
    sidc: csidc.value,
    reinforcedStatus: reinforcedReducedValue.value,
    symbolOptions: internalSymbolOptions.value.fillColor
      ? { fillColor: internalSymbolOptions.value.fillColor }
      : {},
  });
  open.value = false;
};

function onSelect(
  hit: MainIconSearchResult | ModifierOneSearchResult | ModifierTwoSearchResult,
) {
  csidc.value = applySymbolSearchSelection(csidc.value, hit);
}

function clearModifiers() {
  mod1Value.value = "00";
  mod2Value.value = "00";
  emtValue.value = "00";
  hqtfdValue.value = "0";
}

function updateFromBrowseTab(sidc: string) {
  csidc.value = sidc;
}

function updateFromSidcInput(sidc: string) {
  if (!/^\d+$/.test(sidc)) {
    return;
  }
  const oldSidc = new Sidc(csidc.value);
  const ns = new Sidc(sidc);
  ns.standardIdentity = oldSidc.standardIdentity;

  csidc.value = ns.toString();
}

watch(currentTab, async (v) => {
  if (v === 0 && !isMobile.value) {
    await nextTick();
    searchInputRef.value?.el.focus();
  }
});
</script>
