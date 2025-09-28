<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { type UnitProperty } from "@/types/scenarioModels";
import { type UnitPropertyUpdate } from "@/types/internalModels";
import { toPersianDigits, toEnglishDigits } from "@/utils";

const props = withDefaults(
  defineProps<{
    property?: UnitProperty;
    autoFocus?: boolean;
  }>(),
  { autoFocus: true },
);

const emit = defineEmits<{ (e: "update-value", data: UnitPropertyUpdate): void }>();
const aEle = ref<HTMLInputElement | null>(null);
const bEle = ref(null);

const value = ref(props.property?.value || "");
const uom = ref(props.property?.uom || "km/h");

// Computed property for Persian display
const displayValue = computed({
  get() {
    return toPersianDigits(String(value.value));
  },
  set(newValue: string) {
    // Convert Persian digits back to English for internal storage
    value.value = toEnglishDigits(newValue);
  }
});

function onKey(e: KeyboardEvent) {
  (e.target as HTMLInputElement).blur();
}

function onBlur(e: any) {
  if (e.relatedTarget === aEle.value || e.relatedTarget === bEle.value) return;
  emit("update-value", { value: value.value, uom: uom.value });
}

onMounted(() => {
  if (props.autoFocus) {
    aEle.value?.focus();
  }
});
</script>

<template>
  <div class="relative rounded-md shadow-xs">
    <input
      ref="aEle"
      type="text"
      class="block w-full rounded-md border-0 py-1.5 pr-16 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
      v-model="displayValue"
      @keyup.esc="onKey"
      @keydown.enter.prevent="onKey"
      @blur="onBlur"
    />
    <div class="absolute inset-y-0 right-0 flex items-center">
      <select
        ref="bEle"
        name="uom"
        v-model="uom"
        class="h-full rounded-md border-0 bg-transparent py-0 pr-7 pl-2 text-gray-500 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm"
        @blur="onBlur"
      >
        <option>m/s</option>
        <option>km/h</option>
        <option>mph</option>
        <option>گره دریایی</option>
        <option>ft/s</option>
      </select>
    </div>
  </div>
</template>
