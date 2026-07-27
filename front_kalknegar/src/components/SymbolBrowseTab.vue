<template>
  <div dir="rtl" class="flex gap-4 px-0.5">
    <aside class="border-border hidden w-56 flex-none border-l pl-4 md:block">
      <p class="text-sm leading-7 font-bold">نوع موجودیت</p>
      <ul class="text-muted-foreground space-y-1 text-sm font-medium">
        <li
          v-for="[entity, entityIcons] in filteredIconsByEntity"
          :key="entity"
          class="hover:text-foreground"
        >
          <a href="#" type="button" @click.prevent="goTo(entityIcons[0].code)">{{
            entity
          }}</a>
        </li>
      </ul>
      <p class="mt-4 text-sm leading-7 font-bold">تغییردهنده‌ها</p>
      <ul class="text-muted-foreground space-y-1 text-sm font-medium">
        <li v-if="filteredMod1Items.length" class="hover:text-foreground">
          <a href="#" type="button" @click.prevent="goTo('mod1')">تغییردهندهٔ نوع اول</a>
        </li>
        <li v-if="filteredMod2Items.length" class="hover:text-foreground">
          <a href="#" type="button" @click.prevent="goTo('mod2')">تغییردهندهٔ نوع دوم</a>
        </li>
      </ul>
    </aside>
    <div class="flex-auto">
      <div class="relative">
        <MagnifyingGlassIcon
          class="text-muted-foreground pointer-events-none absolute top-3.5 right-3 h-5 w-5"
          aria-hidden="true"
        />
        <input
          type="text"
          class="border-input bg-background placeholder:text-muted-foreground focus:ring-ring/30 h-12 w-full rounded-lg border pr-10 pl-3 focus:ring-2 sm:text-sm"
          placeholder="جستجو در نمادهای این مجموعه..."
          @keydown.esc="onEsc"
          v-model="searchQuery"
          ref="inputRef"
        />
      </div>
      <SymbolCodeSelect
        v-model="symbolSetValue"
        :items="symbolSets"
        :symbol-options="symbolOptions"
        label="مجموعه نماد"
      />

      <div class="mt-4 max-h-[40vh] overflow-auto sm:max-h-[50vh]">
        <div
          v-for="[entity, entityIcons] in filteredIconsByEntity"
          :key="entity"
          class="relative"
        >
          <h3
            class="border-border bg-muted sticky top-0 z-10 border-y p-2 px-4 text-sm font-medium"
            :id="entity"
          >
            {{ entity }}
          </h3>
          <div class="mt-3 grid grid-cols-2 gap-2 p-1 sm:grid-cols-3">
            <button
              type="button"
              v-for="{
                sidc,
                entityLabel,
                detailLabel,
                displayLabel,
                code,
              } in entityIcons"
              :key="sidc"
              :id="`scode-${code}`"
              @click="iconValue = code"
              :aria-label="displayLabel"
              :aria-pressed="code === iconValue"
              class="border-border bg-background hover:bg-accent flex min-h-28 w-full scroll-m-12 flex-col items-center justify-start rounded-xl border p-3 transition-colors"
              :class="code === iconValue ? 'ring-primary bg-primary/5 ring-2' : ''"
            >
              <MilSymbol
                aria-hidden="true"
                :size="symbolSize"
                :sidc="sidc"
                :modifiers="symbolOptions"
              />
              <p
                v-if="detailLabel"
                class="text-muted-foreground mt-1 max-w-full truncate overflow-hidden text-center text-xs"
              >
                {{ detailLabel }}
              </p>
              <p
                class="mt-1 max-w-full overflow-hidden text-center text-sm font-medium break-words"
                :class="code === iconValue ? 'text-primary' : ''"
              >
                {{ displayLabel }}
              </p>
            </button>
          </div>
        </div>
        <h3
          v-if="filteredMod1Items.length"
          class="border-border bg-muted sticky top-0 z-10 border-y p-2 px-4 text-sm font-medium"
        >
          تغییردهندهٔ نوع اول
        </h3>
        <div
          v-if="filteredMod1Items.length"
          id="scode-mod1"
          class="mt-3 grid scroll-m-12 grid-cols-2 gap-2 p-1 sm:grid-cols-3"
        >
          <button
            type="button"
            v-for="{ sidc, text, code } in filteredMod1Items"
            :key="sidc"
            @click="mod1Value = code"
            :aria-label="text"
            :aria-pressed="code === mod1Value"
            class="border-border bg-background hover:bg-accent flex min-h-24 w-full flex-col items-center justify-start rounded-xl border p-3 transition-colors"
            :class="code === mod1Value ? 'ring-primary bg-primary/5 ring-2' : ''"
          >
            <MilSymbol
              aria-hidden="true"
              :size="symbolSize"
              :sidc="sidc"
              :modifiers="symbolOptions"
            />
            <p class="mt-1 max-w-full overflow-hidden text-center text-sm break-words">
              {{ text }}
            </p>
          </button>
        </div>
        <h3
          v-if="filteredMod2Items.length"
          class="border-border bg-muted sticky top-0 z-10 border-y p-2 px-4 text-sm font-medium"
        >
          تغییردهندهٔ نوع دوم
        </h3>
        <div
          v-if="filteredMod2Items.length"
          id="scode-mod2"
          class="mt-3 grid scroll-m-12 grid-cols-2 gap-2 p-1 sm:grid-cols-3"
        >
          <button
            type="button"
            v-for="{ sidc, text, code } in filteredMod2Items"
            :key="sidc"
            @click="mod2Value = code"
            :aria-label="text"
            :aria-pressed="code === mod2Value"
            class="border-border bg-background hover:bg-accent flex min-h-24 w-full flex-col items-center justify-start rounded-xl border p-3 transition-colors"
            :class="code === mod2Value ? 'ring-primary bg-primary/5 ring-2' : ''"
          >
            <MilSymbol
              aria-hidden="true"
              :size="symbolSize"
              :sidc="sidc"
              :modifiers="symbolOptions"
            />
            <p class="mt-1 max-w-full overflow-hidden text-center text-sm break-words">
              {{ text }}
            </p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import MilSymbol from "./MilSymbol.vue";
import SymbolCodeSelect from "./SymbolCodeSelect.vue";
import { computed, nextTick, onActivated, ref, watch } from "vue";
import { groupBy } from "@/utils";
import { useSymbolItems } from "@/composables/symbolData";
import { type UnitSymbolOptions } from "@/types/scenarioModels";
import { PhMagnifyingGlass as MagnifyingGlassIcon } from "@phosphor-icons/vue";
import { breakpointsTailwind, useBreakpoints, useDebounce } from "@vueuse/core";
import {
  translateEntity,
  translateEntitySubtype,
  translateEntityType,
} from "@/symbology/translations";

interface Props {
  initialSidc: string;
  symbolSize?: number;
  symbolOptions?: UnitSymbolOptions;
}

const props = withDefaults(defineProps<Props>(), { symbolSize: 32 });
const searchQuery = ref("");
const debouncedQuery = useDebounce(searchQuery, 100);
const inputRef = ref();

const {
  mod1Items,
  mod2Items,
  mod1Value,
  mod2Value,
  symbolSets,
  symbolSetValue,
  icons,
  iconValue,
  csidc,
  isLoaded,
  loadData,
} = useSymbolItems(computed(() => props.initialSidc));

if (!isLoaded.value) loadData();

const emit = defineEmits(["update-sidc"]);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smallerOrEqual("md");

function visiblePersianLabel(
  value: string | undefined,
  translator: (text: string) => string,
) {
  if (!value) return "";
  return translator(value);
}

const localizedIcons = computed(() =>
  icons.value.map((icon) => {
    const translatedEntity = visiblePersianLabel(icon.entity, translateEntity);
    const entityLabel = translatedEntity || "سایر نمادها";
    const entityTypeLabel = visiblePersianLabel(icon.entityType, translateEntityType);
    const entitySubtypeLabel = visiblePersianLabel(
      icon.entitySubtype,
      translateEntitySubtype,
    );
    const displayLabel =
      entitySubtypeLabel || entityTypeLabel || translatedEntity || "نماد نامشخص";

    return {
      ...icon,
      entityLabel,
      entityTypeLabel,
      entitySubtypeLabel,
      displayLabel,
      detailLabel: entitySubtypeLabel && entityTypeLabel ? entityTypeLabel : "",
    };
  }),
);

const filteredIconsByEntity = computed(() => {
  if (!debouncedQuery.value.trim()) return groupBy(localizedIcons.value, "entityLabel");
  const query = debouncedQuery.value.toLocaleLowerCase("fa");
  const filtered = localizedIcons.value.filter((icon) => {
    return (
      icon.entityLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entityTypeLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entitySubtypeLabel.toLocaleLowerCase("fa").includes(query) ||
      icon.entity.toLowerCase().includes(query) ||
      icon.entityType?.toLowerCase().includes(query) ||
      icon.entitySubtype?.toLowerCase().includes(query) ||
      icon.code.includes(query)
    );
  });
  return groupBy(filtered, "entityLabel");
});

function localizeModifierItems(items: typeof mod1Items.value) {
  return items.map((item) => ({
    ...item,
    searchText: item.text,
    text: item.text,
  }));
}

const localizedMod1Items = computed(() => localizeModifierItems(mod1Items.value));
const localizedMod2Items = computed(() => localizeModifierItems(mod2Items.value));

const filteredMod1Items = computed(() => {
  if (!debouncedQuery.value.trim()) return localizedMod1Items.value;
  const query = debouncedQuery.value.toLowerCase();
  return localizedMod1Items.value.filter(
    (item) =>
      item.text.toLowerCase().includes(query) ||
      item.searchText.toLowerCase().includes(query),
  );
});

const filteredMod2Items = computed(() => {
  if (!debouncedQuery.value.trim()) return localizedMod2Items.value;
  const query = debouncedQuery.value.toLowerCase();
  return localizedMod2Items.value.filter(
    (item) =>
      item.text.toLowerCase().includes(query) ||
      item.searchText.toLowerCase().includes(query),
  );
});

watch([mod1Value, mod2Value, iconValue], (value, oldValue) => {
  emit("update-sidc", csidc.value);
});

function goTo(sidc: string) {
  const el = document.getElementById(`scode-${sidc}`);
  if (el) {
    el.scrollIntoView(true);
  }
}

onActivated(() => {
  searchQuery.value = "";
  nextTick(() => {
    if (!isMobile.value) {
      inputRef.value.focus();
    }
    const el = document.getElementById(`scode-${iconValue.value}`);
    if (el) {
      el.scrollIntoView({ block: "center" });
    }
  });
});

function onEsc(e: KeyboardEvent) {
  if (searchQuery.value.length) {
    e.stopPropagation();
    searchQuery.value = "";
  }
}
</script>
