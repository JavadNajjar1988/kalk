<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { PhMagnifyingGlass as SearchIcon } from "@phosphor-icons/vue";
import {
  METOC_FAMILIES,
  METOC_SYMBOLS,
  findMetocSymbol,
  metocDisplayName,
  type MetocFamily,
} from "./metocCatalog";
import MetocSymbolIcon from "./MetocSymbolIcon.vue";

const selectedSidc = defineModel<string>({ required: true });
const query = ref("");
const activeFamily = ref<MetocFamily>(
  findMetocSymbol(selectedSidc.value)?.family ?? "weather",
);
const activeGroup = ref("");

const familySymbols = computed(() =>
  METOC_SYMBOLS.filter((symbol) => symbol.family === activeFamily.value),
);
const groups = computed(() => {
  const unique = new Map(
    familySymbols.value.map((symbol) => [
      symbol.group,
      { value: symbol.group, label: symbol.groupFa },
    ]),
  );
  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, "fa"));
});
const visibleSymbols = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase("fa");
  return familySymbols.value.filter((symbol) => {
    if (activeGroup.value && symbol.group !== activeGroup.value) return false;
    if (!needle) return true;
    return `${symbol.label} ${symbol.labelEn} ${symbol.sidc} ${symbol.hierarchy.join(" ")}`
      .toLocaleLowerCase("fa")
      .includes(needle);
  });
});

watch(activeFamily, () => {
  activeGroup.value = "";
});

watch(selectedSidc, (sidc) => {
  const symbol = findMetocSymbol(sidc);
  if (symbol) activeFamily.value = symbol.family;
});
</script>

<template>
  <div class="metoc-symbol-picker space-y-2">
    <div class="flex max-w-full gap-1 overflow-x-auto pb-1">
      <button
        v-for="family in METOC_FAMILIES"
        :key="family.id"
        type="button"
        class="shrink-0 rounded-md px-2 py-1 text-[11px]"
        :class="
          activeFamily === family.id
            ? 'bg-sky-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
        "
        @click="activeFamily = family.id"
      >
        {{ family.label }}
        <span class="opacity-70">
          ({{ METOC_SYMBOLS.filter((item) => item.family === family.id).length }})
        </span>
      </button>
    </div>

    <div class="metoc-filter-grid grid gap-2">
      <label class="relative">
        <SearchIcon
          class="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="query"
          type="search"
          class="w-full rounded-md border bg-white py-1.5 pr-8 pl-2 text-xs dark:bg-slate-900"
          placeholder="جست‌وجوی نام یا SIDC"
        />
      </label>
      <select
        v-model="activeGroup"
        class="min-w-0 rounded-md border bg-white px-2 py-1.5 text-xs dark:bg-slate-900"
        aria-label="گروه نماد"
      >
        <option value="">همه گروه‌ها</option>
        <option v-for="group in groups" :key="group.value" :value="group.value">
          {{ group.label }}
        </option>
      </select>
    </div>

    <div
      class="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-1 overflow-y-auto rounded-md border bg-slate-50 p-1 dark:bg-slate-950"
    >
      <button
        v-for="symbol in visibleSymbols"
        :key="symbol.id"
        type="button"
        class="flex min-h-20 min-w-0 flex-col items-center justify-center rounded border p-1 text-center transition"
        :class="
          selectedSidc === symbol.sidc
            ? 'border-sky-500 bg-sky-100 text-sky-950 ring-1 ring-sky-400 dark:bg-sky-950 dark:text-white'
            : 'border-slate-200 bg-white hover:border-sky-300 dark:border-slate-800 dark:bg-slate-900'
        "
        :title="`${symbol.labelEn}\n${symbol.sidc}`"
        @click="selectedSidc = symbol.sidc"
      >
        <span class="mb-1 block size-9">
          <MetocSymbolIcon
            :sidc="symbol.sidc"
            :size="32"
            :label="metocDisplayName(symbol)"
          />
        </span>
        <span class="line-clamp-2 w-full text-[10px] leading-4">
          {{ metocDisplayName(symbol) }}
        </span>
      </button>
      <div
        v-if="!visibleSymbols.length"
        class="col-span-full p-4 text-center text-xs text-slate-500"
      >
        نمادی با این جست‌وجو پیدا نشد.
      </div>
    </div>
  </div>
</template>

<style scoped>
.metoc-symbol-picker {
  container-type: inline-size;
}

.metoc-filter-grid {
  grid-template-columns: minmax(0, 1fr) minmax(8.75rem, 0.45fr);
}

@container (max-width: 22rem) {
  .metoc-filter-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
