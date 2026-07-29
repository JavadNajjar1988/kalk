<template>
  <section class="boundary-properties">
    <h3>مشخصات خط حد</h3>

    <label>
      <span>ردهٔ سازمانی</span>
      <select
        v-model="selectedEchelon"
        data-boundary-echelon
        :disabled="disabled"
        @change="updateEchelon"
      >
        <option value="-">بدون رده</option>
        <option
          v-for="option in boundaryEchelonOptions"
          :key="option.code"
          :value="option.code"
        >
          {{ option.label }} — {{ option.marker }}
        </option>
      </select>
    </label>

    <label>
      <span>عنوان یگان سمت چپ</span>
      <input
        v-model="leftDesignation"
        type="text"
        data-boundary-designation="left"
        :disabled="disabled"
        @blur="updateDesignation('left')"
      />
    </label>

    <label>
      <span>عنوان یگان سمت راست</span>
      <input
        v-model="rightDesignation"
        type="text"
        data-boundary-designation="right"
        :disabled="disabled"
        @blur="updateDesignation('right')"
      />
    </label>
  </section>
</template>

<script setup lang="ts">
import { inject, ref, watch, type Ref } from "vue";
import {
  boundaryEchelonOptions,
  type BoundaryEchelonCode,
} from "@/symbology/boundaryEchelons";
import * as MILSTD from "../../symbology/2525c.js";
import {
  setBoundaryDesignation,
  setBoundaryEchelon,
  type TacticalFeatureRecord,
} from "./boundaryFeatureProperties";

const props = defineProps<{
  features: Record<string, TacticalFeatureRecord>;
  disabled?: boolean;
}>();

const servicesRef = inject<Ref<any>>("services");
const selectedEchelon = ref<BoundaryEchelonCode | "-">("-");
const leftDesignation = ref("");
const rightDesignation = ref("");

function firstFeature() {
  return Object.values(props.features || {})[0];
}

function syncFromFeature() {
  const properties = firstFeature()?.properties;
  const echelon = properties?.sidc ? MILSTD.echelonCode(properties.sidc) : "-";
  selectedEchelon.value = boundaryEchelonOptions.some(({ code }) => code === echelon)
    ? (echelon as BoundaryEchelonCode)
    : "-";
  leftDesignation.value = typeof properties?.t === "string" ? properties.t : "";
  rightDesignation.value = typeof properties?.t1 === "string" ? properties.t1 : "";
}

watch(() => props.features, syncFromFeature, { immediate: true, deep: true });

async function updateEchelon() {
  if (selectedEchelon.value === "-" || !servicesRef?.value) return;
  await servicesRef.value.store.update(
    props.features,
    setBoundaryEchelon(selectedEchelon.value),
  );
}

async function updateDesignation(side: "left" | "right") {
  if (!servicesRef?.value) return;
  const value = side === "left" ? leftDesignation.value : rightDesignation.value;
  await servicesRef.value.store.update(
    props.features,
    setBoundaryDesignation(side, value),
  );
}
</script>

<style scoped>
.boundary-properties {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  color: var(--color-foreground);
}

.boundary-properties h3 {
  margin: 0 0 0.15rem;
  font-size: 0.95rem;
  font-weight: 750;
}

.boundary-properties label {
  display: grid;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 650;
}

.boundary-properties select,
.boundary-properties input {
  width: 100%;
  height: 2.4rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.55rem;
  padding: 0 0.65rem;
  color: var(--color-foreground);
  background: var(--surface-panel);
  font-size: 0.75rem;
}

.boundary-properties select:disabled,
.boundary-properties input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
