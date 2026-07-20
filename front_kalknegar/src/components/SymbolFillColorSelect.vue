<template>
  <SymbolCodeSelect label="انتخاب رنگ" :items="colorIconItems" v-model="colorValue" />
</template>

<script setup lang="ts">
import { type NullableSymbolItem } from "@/types/constants";
import { computed } from "vue";
import SymbolCodeSelect from "@/components/SymbolCodeSelect.vue";

interface Props {
  modelValue?: string | null;
  sid?: string;
  defaultFillColor?: string;
}

const props = withDefaults(defineProps<Props>(), { sid: "3", modelValue: "" });
const emit = defineEmits(["update:modelValue"]);

const colorValue = defineModel<string | null>({ default: null });

const colors: Omit<NullableSymbolItem, "sidc">[] = [
  { code: null, text: "پیش‌فرض" },
  { code: "#80e0ff", text: "آبی (استاندارد)" },
  { code: "#ff8080", text: "قرمز (استاندارد)" },
  { code: "#aaffaa", text: "سبز (استاندارد)" },
  { code: "#ffff80", text: "زرد (استاندارد)" },
  { code: "#ffa1ff", text: "صورتی (غیردولتی)" },
  { code: "#aab074", text: "زیتونی" },
  { code: "#5baa5b", text: "پیاده‌نظام (آرایش نبرد)" },
  { code: "#ffd00b", text: "زرهی (آرایش نبرد)" },
  { code: "#ff3333", text: "توپخانه (آرایش نبرد)" },
  { code: "#f7f7f7", text: "پشتیبانی رزمی (آرایش نبرد)" },
  { code: "#d87600", text: "پشتیبانی خدماتی (آرایش نبرد)" },
  { code: "#a2e3e8", text: "هوانیروز/هوایی (آرایش نبرد)" },
];

const colorIconItems = computed((): NullableSymbolItem[] =>
  colors.map((item) => ({
    ...item,
    sidc: "100" + props.sid + 10 + "00" + "00" + "0000000000",
    symbolOptions: item.code
      ? { fillColor: item.code }
      : props.defaultFillColor
        ? { fillColor: props.defaultFillColor }
        : undefined,
  })),
);
</script>
