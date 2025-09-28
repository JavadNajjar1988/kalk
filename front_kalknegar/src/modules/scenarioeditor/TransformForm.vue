<script setup lang="ts">
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown, Trash2Icon } from "lucide-vue-next";
import InputGroupTemplate from "@/components/InputGroupTemplate.vue";
import PanelSubHeading from "@/components/PanelSubHeading.vue";
import NewSelect from "@/components/NewSelect.vue";
import NumberInputGroup from "@/components/NumberInputGroup.vue";
import { computed, ref, watchEffect } from "vue";
import type { NewSelectItem } from "@/components/types.ts";
import type {
  BufferOptions,
  SimplifyOptions,
  TransformationOperation,
  TransformationType,
} from "@/geo/transformations.ts";
import type { Units } from "@turf/helpers";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type TransformFormProperties = {
  unitMode?: boolean;
};

const props = withDefaults(defineProps<TransformFormProperties>(), {
  unitMode: false,
});

const emit = defineEmits(["delete"]);

const currentOp = defineModel<TransformationOperation>({ required: true });

const transformation = ref<TransformationType>(currentOp.value.transform);
const disabled = ref(false);
const isOpen = ref(currentOp.value.isOpen ?? true);
const enabled = computed({
  get() {
    return !disabled.value;
  },
  set(value) {
    disabled.value = !value;
  },
});
const bufferOptions = ref<BufferOptions>(
  currentOp.value.transform === "buffer"
    ? currentOp.value.options
    : { radius: 0, units: "kilometers", steps: 8 },
);

const simplifyOptions = ref<SimplifyOptions>(
  currentOp.value.transform === "simplify"
    ? currentOp.value.options
    : { tolerance: 0.001 },
);

const sliderValue = computed({
  get() {
    return [simplifyOptions.value.tolerance ?? 0];
  },
  set([value]) {
    simplifyOptions.value.tolerance = value;
  },
});

const transformationOptions = computed((): NewSelectItem<TransformationType>[] => {
  return [
    {
      label: "بافر",
      value: "buffer",
      description: "محاسبه بافر برای عناصر ورودی بر اساس شعاع مشخص",
    },
    { label: "جعبه محصورکننده", value: "boundingBox" },
    { label: "پوسته محدب", value: "convexHull" },
    { label: "پوسته مقعر", value: "concaveHull" },
    { label: "مرکز (مطلق)", value: "center" },
    { label: "مرکز جرم", value: "centerOfMass" },
    { label: "مرکز ثقل", value: "centroid" },
    { label: "منفجر کردن", value: "explode" },
    { label: "ساده‌سازی", value: "simplify" },
    { label: "صاف کردن", value: "smooth" },
    { label: "اتحاد", value: "union" },
  ];
});

const transformationLabel = computed(() => {
  const selectedOption = transformationOptions.value.find(
    (option) => option.value === transformation.value,
  );
  return selectedOption ? selectedOption.label : transformation.value;
});

const unitItems: NewSelectItem<Units>[] = [
  { label: "کیلومتر", value: "kilometers" },
  { label: "متر", value: "meters" },
  { label: "مایل", value: "miles" },
  { label: "فوت", value: "feet" },
  { label: "مایل دریایی", value: "nauticalmiles" },
];

const id = currentOp.value.id;
watchEffect(() => {
  if (transformation.value === "buffer") {
    const { radius, units, steps } = bufferOptions.value;
    currentOp.value = {
      id,
      transform: "buffer",
      options: { radius, units, steps },
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "boundingBox") {
    currentOp.value = {
      id,
      transform: "boundingBox",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "convexHull") {
    currentOp.value = {
      id,
      transform: "convexHull",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "concaveHull") {
    currentOp.value = {
      id,
      transform: "concaveHull",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "simplify") {
    const { tolerance } = simplifyOptions.value;
    currentOp.value = {
      id,
      transform: "simplify",
      options: { tolerance },
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "smooth") {
    currentOp.value = {
      id,
      transform: "smooth",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "center") {
    currentOp.value = {
      id,
      transform: "center",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "centerOfMass") {
    currentOp.value = {
      id,
      transform: "centerOfMass",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "centroid") {
    currentOp.value = {
      id,
      transform: "centroid",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "explode") {
    currentOp.value = {
      id,
      transform: "explode",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  } else if (transformation.value === "union") {
    currentOp.value = {
      id,
      transform: "union",
      options: {},
      disabled: disabled.value,
      isOpen: isOpen.value,
    };
  }
});

function onSubmit() {
  // Handle form submission logic here
  console.log("Form submitted with transformation:", transformation.value);
}
</script>
<template>
  <Collapsible v-model:open="isOpen" class="border-border -mx-2 rounded border">
    <header class="relative flex items-center justify-between rounded border-b p-2 px-4">
      <CollapsibleTrigger class="flex w-full items-center justify-between"
        ><span class="text-sm font-bold">{{ transformationLabel }}</span
        ><ChevronsUpDown class="h-4 w-4"
      /></CollapsibleTrigger>
      <div class="pointer-events-none absolute inset-0 flex justify-end">
        <div class="pointer-events-auto mr-8 flex items-center gap-1">
          <Switch v-model="enabled" />
          <Button variant="ghost" size="sm" @click="emit('delete')">
            <Trash2Icon />
          </Button>
        </div>
      </div>
    </header>
    <CollapsibleContent class="p-4">
      <form @submit.prevent="onSubmit" class="space-y-4">
        <NewSelect
          label="تبدیل"
          :items="transformationOptions"
          v-model="transformation"
        />

        <div v-if="transformation === 'buffer'">
          <div class="mt-2 grid grid-cols-2 gap-4">
            <div class="col-span-1">
              <NumberInputGroup label="شعاع" v-model.number="bufferOptions.radius" />
            </div>
            <NewSelect label="واحدها" :items="unitItems" v-model="bufferOptions.units" />
            <NumberInputGroup label="مراحل" v-model.number="bufferOptions.steps" />
          </div>
        </div>
        <div v-else-if="transformation === 'simplify'">
          <PanelSubHeading>ساده‌سازی</PanelSubHeading>
          <div class="mt-4 grid grid-cols-1 gap-4">
            <InputGroupTemplate label="تحمل">
              <Slider
                v-model="sliderValue"
                :min="0"
                :max="0.15"
                :step="0.00001"
                class="mt-4"
              />
            </InputGroupTemplate>
          </div>
        </div>
      </form>
    </CollapsibleContent>
  </Collapsible>
</template>
