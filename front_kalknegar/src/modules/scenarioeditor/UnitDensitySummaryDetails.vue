<template>
  <div v-if="currentSummary" class="@container p-4">
    <header class="-mx-4 px-2 pt-2">
      <div class="flex items-start gap-3">
        <button
          type="button"
          class="inline-flex h-20 w-16 shrink-0 justify-center"
          title="تغییر نوع نماد"
          @click="changeSymbolType"
        >
          <MilitarySymbol
            :sidc="form.sidc || currentSummary.sidc"
            :size="36"
            :options="form.symbolOptions || currentSummary.symbolOptions"
          />
        </button>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold">نماد تجمیعی</h2>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ units.length }} واحد در این نماد نمایش داده شده‌اند.
          </p>
          <p class="text-muted-foreground mt-1 text-sm">
            منبع فعلی: {{ unitDensitySummarySourceLabel(currentSummary.source) }}
          </p>
          <PlainButton type="button" class="mt-3" @click="changeSymbolType">
            تغییر نوع نماد
          </PlainButton>
        </div>
      </div>
    </header>

    <form class="mt-4 space-y-4 text-right" @submit.prevent="saveSettings">
      <label class="block text-sm font-medium">
        منبع نماد
        <select
          v-model="form.source"
          class="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="orbat" :disabled="!parentSummary">آرایش نبرد</option>
          <option value="automatic">خودکار</option>
          <option value="manual">دستی</option>
        </select>
      </label>

      <p v-if="!parentSummary" class="text-muted-foreground text-sm">
        برای این خوشه parent مشترک در آرایش نبرد پیدا نشد؛ حالت خودکار یا دستی را انتخاب کنید.
      </p>

      <InputGroup
        v-model="form.label"
        label="نام نمایشی"
        :disabled="form.source !== 'manual'"
      />

      <InputGroup
        v-model="form.echelon"
        label="سطح نماد یا SIDC کامل"
        description="نمونه: تیپ/18، لشکر/21، سپاه/22"
        :disabled="form.source !== 'manual'"
      />

      <p v-if="form.source === 'manual'" class="text-muted-foreground text-xs">
        برای تغییر نوع/شکل نماد، روی پیش‌نمایش نماد یا دکمه «تغییر نوع نماد» کلیک کنید.
      </p>

      <div class="flex justify-end gap-2">
        <PlainButton type="button" @click="resetForm">بازنشانی</PlainButton>
        <PrimaryButton type="submit">ذخیره</PrimaryButton>
      </div>
    </form>

    <section class="mt-6 border-t pt-4">
      <h3 class="text-sm font-medium">واحدهای زیرمجموعه</h3>
      <ul class="mt-3 space-y-2">
        <li v-for="unit in units" :key="unit.id">
          <button
            type="button"
            class="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1 text-right"
            @click="openUnitDetails(unit.id)"
          >
            <MilitarySymbol
              :sidc="unit._state?.sidc || unit.sidc"
              :size="24"
              :options="{ ...getCombinedSymbolOptions(unit), outlineWidth: 8 }"
            />
            <span class="min-w-0 flex-1 truncate text-sm">{{ unit.name }}</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { injectStrict } from "@/utils";
import { activeScenarioKey, sidcModalKey } from "@/components/injects";
import InputGroup from "@/components/InputGroup.vue";
import MilitarySymbol from "@/components/NewMilitarySymbol.vue";
import PlainButton from "@/components/PlainButton.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { useSelectedItems } from "@/stores/selectedStore";
import type { EntityId } from "@/types/base";
import type { NUnit } from "@/types/internalModels";
import type { UnitSymbolOptions } from "@/types/scenarioModels";
import {
  applyEchelonToSummarySidc,
  clearUnitDensityStyleCache,
  commonParentSummaryForUnits,
  getUnitDensitySummaryOverrides,
  resolveUnitDensitySummary,
  setUnitDensitySummaryOverride,
  type UnitDensitySummarySource,
  unitDensitySummarySourceLabel,
} from "@/geo/unitDensitySummary";

const {
  helpers: { getUnitById },
  unitActions: { getCombinedSymbolOptions, getUnitHierarchy },
  store: { state },
} = injectStrict(activeScenarioKey);
const { getModalSidc } = injectStrict(sidcModalKey);

const { activeUnitDensitySummary, activeUnitId } = useSelectedItems();

const form = ref<{
  source: UnitDensitySummarySource;
  label: string;
  echelon: string;
  sidc: string;
  symbolOptions?: UnitSymbolOptions;
}>({
  source: "automatic",
  label: "",
  echelon: "21",
  sidc: "",
  symbolOptions: undefined,
});

const units = computed<NUnit[]>(() => {
  const unitIds = activeUnitDensitySummary.value?.unitIds ?? [];
  return unitIds
    .map((unitId) => getUnitById(unitId))
    .filter(Boolean) as NUnit[];
});

const parentSummary = computed(() =>
  commonParentSummaryForUnits(units.value, (unitId) =>
    getUnitHierarchy(unitId).parents.map((parent) => ({
      ...parent,
      symbolOptions: getCombinedSymbolOptions(parent),
    })),
  ),
);

const currentSummary = computed(() => {
  if (units.value.length < 2) return;
  return resolveUnitDensitySummary(
    units.value,
    getUnitDensitySummaryOverrides(state.metadata),
    parentSummary.value,
  );
});

function normalizeSummaryEchelonInput(input: string) {
  const value = input.trim().toLowerCase();
  const labels: Record<string, string> = {
    regiment: "17",
    "هنگ": "17",
    brigade: "18",
    "تیپ": "18",
    division: "21",
    "لشکر": "21",
    corps: "22",
    "سپاه": "22",
  };
  return labels[value] ?? value;
}

function summaryEchelonFromSidc(sidc: string) {
  return sidc.length >= 12 ? sidc.slice(10, 12) : "21";
}

function resetForm() {
  const summary = currentSummary.value;
  form.value = {
    source: summary?.source ?? "automatic",
    label: summary?.label ?? "",
    echelon: summary ? summaryEchelonFromSidc(summary.sidc) : "21",
    sidc: summary?.sidc ?? "",
    symbolOptions: summary?.symbolOptions,
  };
}

async function changeSymbolType() {
  const summary = currentSummary.value;
  if (!summary) return;

  const newSidcValue = await getModalSidc(form.value.sidc || summary.sidc, {
    title: "انتخاب نوع نماد تجمیعی",
    symbolOptions: form.value.symbolOptions ?? summary.symbolOptions,
  });
  if (!newSidcValue) return;

  form.value = {
    ...form.value,
    source: "manual",
    sidc: newSidcValue.sidc,
    symbolOptions: newSidcValue.symbolOptions,
    echelon: summaryEchelonFromSidc(newSidcValue.sidc),
  };
}

function saveSettings() {
  const summary = currentSummary.value;
  if (!summary || units.value.length < 2) return;

  const selectedSource =
    form.value.source === "orbat" && !parentSummary.value
      ? "automatic"
      : form.value.source;
  const normalizedEchelon = normalizeSummaryEchelonInput(form.value.echelon);
  const baseSidc = form.value.sidc || summary.sidc;
  const sidc =
    normalizedEchelon.length === 20
      ? normalizedEchelon
      : applyEchelonToSummarySidc(baseSidc, normalizedEchelon);

  state.metadata = setUnitDensitySummaryOverride(
    state.metadata,
    summary.overrideKey,
    selectedSource === "manual"
      ? {
          source: "manual",
          label: form.value.label.trim() || undefined,
          sidc,
          symbolOptions: form.value.symbolOptions,
        }
      : { source: selectedSource },
  );
  state.settingsStateCounter++;
  clearUnitDensityStyleCache();
  resetForm();
}

function openUnitDetails(unitId: EntityId) {
  activeUnitId.value = unitId;
}

watch(
  () => [
    activeUnitDensitySummary.value?.unitIds.join("|") ?? "",
    currentSummary.value?.overrideKey ?? "",
    currentSummary.value?.source ?? "",
  ],
  resetForm,
  { immediate: true },
);
</script>
