<template>
  <section class="boundary-configurator" aria-labelledby="boundary-configurator-title">
    <header class="boundary-configurator-header">
      <div>
        <h3 id="boundary-configurator-title">تنظیم خط حد</h3>
        <p>ردهٔ سازمانی و یگان‌های دو طرف خط را مشخص کنید.</p>
      </div>
      <button type="button" class="boundary-link-button" @click="selectAutomatically">
        انتخاب خودکار
      </button>
    </header>

    <div class="boundary-echelon-grid" aria-label="ردهٔ سازمانی خط حد">
      <button
        v-for="option in boundaryEchelonOptions"
        :key="option.code"
        type="button"
        class="boundary-echelon-option"
        :class="{ active: selectedEchelon === option.code }"
        :aria-pressed="selectedEchelon === option.code"
        :data-echelon-code="option.code"
        @click="selectEchelon(option.code)"
      >
        <span class="boundary-echelon-preview" aria-hidden="true">
          <span class="boundary-preview-line"></span>
          <span class="boundary-echelon-marker">{{ option.marker }}</span>
          <span class="boundary-preview-line"></span>
        </span>
        <span class="boundary-echelon-label">{{ option.label }}</span>
      </button>
    </div>

    <div class="boundary-unit-fields">
      <label>
        <span>یگان سمت چپ</span>
        <select v-model="leftUnitId">
          <option value="">بدون یگان</option>
          <option v-for="unit in units" :key="unit.id" :value="unit.id">
            {{ unit.shortName || unit.name }}
          </option>
        </select>
      </label>

      <button
        type="button"
        class="boundary-swap-button"
        title="جابه‌جایی یگان‌های چپ و راست"
        aria-label="جابه‌جایی یگان‌های چپ و راست"
        @click="swapUnits"
      >
        ⇄
      </button>

      <label>
        <span>یگان سمت راست</span>
        <select v-model="rightUnitId">
          <option value="">بدون یگان</option>
          <option v-for="unit in units" :key="unit.id" :value="unit.id">
            {{ unit.shortName || unit.name }}
          </option>
        </select>
      </label>
    </div>

    <footer class="boundary-configurator-actions">
      <button type="button" class="boundary-cancel-button" @click="$emit('cancel')">
        انصراف
      </button>
      <button
        type="button"
        class="boundary-confirm-button"
        data-action="confirm"
        @click="confirm"
      >
        رسم خط حد
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { EntityId } from "@/types/base";
import type { NUnit } from "@/types/internalModels";
import { Sidc } from "@/symbology/sidc";
import {
  boundaryEchelonOptions,
  recommendBoundaryEchelon,
  type BoundaryEchelonCode,
} from "@/symbology/boundaryEchelons";
import type { BoundaryDrawOptions } from "./tacticalDrawRequest";
import { selectedBoundaryUnits, unitDesignation } from "./boundaryDrawSelection";

const props = defineProps<{
  units: NUnit[];
  selectedUnitIds: EntityId[];
  initialEchelon: BoundaryEchelonCode;
}>();

const emit = defineEmits<{
  confirm: [options: BoundaryDrawOptions];
  cancel: [];
}>();

const initialUnits = selectedBoundaryUnits(props.units, props.selectedUnitIds);
const leftUnitId = ref<EntityId>(initialUnits.leftUnit?.id || "");
const rightUnitId = ref<EntityId>(initialUnits.rightUnit?.id || "");
const manualEchelon = ref(false);

const leftUnit = computed(
  () => props.units.find((unit) => unit.id === leftUnitId.value) || null,
);
const rightUnit = computed(
  () => props.units.find((unit) => unit.id === rightUnitId.value) || null,
);

function recommendedEchelon() {
  return recommendBoundaryEchelon(
    [leftUnit.value, rightUnit.value]
      .filter((unit): unit is NUnit => Boolean(unit))
      .map((unit) => new Sidc(unit.sidc).emt),
    props.initialEchelon,
  );
}

const selectedEchelon = ref<BoundaryEchelonCode>(recommendedEchelon());

watch([leftUnitId, rightUnitId], () => {
  if (!manualEchelon.value) selectedEchelon.value = recommendedEchelon();
});

function selectEchelon(code: BoundaryEchelonCode) {
  manualEchelon.value = true;
  selectedEchelon.value = code;
}

function selectAutomatically() {
  manualEchelon.value = false;
  selectedEchelon.value = recommendedEchelon();
}

function swapUnits() {
  [leftUnitId.value, rightUnitId.value] = [rightUnitId.value, leftUnitId.value];
}

function confirm() {
  const options: BoundaryDrawOptions = {
    echelonCode: selectedEchelon.value,
  };
  const leftDesignation = unitDesignation(leftUnit.value);
  const rightDesignation = unitDesignation(rightUnit.value);

  if (leftUnit.value) options.leftUnitId = leftUnit.value.id;
  if (rightUnit.value) options.rightUnitId = rightUnit.value.id;
  if (leftDesignation) options.leftDesignation = leftDesignation;
  if (rightDesignation) options.rightDesignation = rightDesignation;

  emit("confirm", options);
}
</script>

<style scoped>
.boundary-configurator {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
  color: var(--color-foreground);
}

.boundary-configurator-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.boundary-configurator-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 750;
}

.boundary-configurator-header p {
  margin: 0.3rem 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
}

.boundary-link-button {
  flex: 0 0 auto;
  border: 0;
  padding: 0.25rem;
  color: var(--color-primary);
  background: transparent;
  font-size: 0.7rem;
  cursor: pointer;
}

.boundary-echelon-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.boundary-echelon-option {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.65rem;
  padding: 0.55rem;
  color: inherit;
  background: var(--surface-panel);
  cursor: pointer;
}

.boundary-echelon-option:hover,
.boundary-echelon-option.active {
  border-color: color-mix(in srgb, var(--color-primary) 60%, var(--surface-border));
  background: color-mix(in srgb, var(--color-primary) 9%, var(--surface-panel));
}

.boundary-echelon-option.active {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.boundary-echelon-preview {
  display: flex;
  min-width: 0;
  align-items: center;
  direction: ltr;
  color: var(--color-primary);
}

.boundary-preview-line {
  height: 2px;
  min-width: 14px;
  flex: 1;
  background: currentColor;
}

.boundary-echelon-marker {
  flex: 0 0 auto;
  padding: 0 0.3rem;
  font-family: Arial, sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.boundary-echelon-label {
  overflow: hidden;
  font-size: 0.68rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.boundary-unit-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.boundary-unit-fields label {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 650;
}

.boundary-unit-fields select {
  width: 100%;
  height: 2.35rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.55rem;
  padding: 0 0.5rem;
  color: var(--color-foreground);
  background: var(--surface-panel);
  font-size: 0.72rem;
}

.boundary-swap-button,
.boundary-cancel-button,
.boundary-confirm-button {
  height: 2.35rem;
  border-radius: 0.55rem;
  padding: 0 0.75rem;
  cursor: pointer;
}

.boundary-swap-button,
.boundary-cancel-button {
  border: 1px solid var(--surface-border);
  color: var(--color-foreground);
  background: var(--surface-panel);
}

.boundary-swap-button {
  width: 2.35rem;
  padding: 0;
  font-size: 1rem;
}

.boundary-configurator-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: auto;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.85rem;
}

.boundary-confirm-button {
  border: 1px solid var(--color-primary);
  color: white;
  background: var(--color-primary);
  font-weight: 650;
}

@media (max-width: 460px) {
  .boundary-echelon-grid {
    grid-template-columns: 1fr;
  }

  .boundary-unit-fields {
    grid-template-columns: 1fr auto;
  }

  .boundary-unit-fields label:last-child {
    grid-column: 1 / -1;
  }
}
</style>
