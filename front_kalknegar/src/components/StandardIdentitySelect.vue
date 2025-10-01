<template>
  <div class="mt-4">
    <RadioGroup v-model="data">
      <RadioGroupLabel class="text-heading text-sm font-medium"
        >Standard identity
      </RadioGroupLabel>
      <div
        class="mt-1 grid gap-x-4 gap-y-4"
        :class="compact ? 'grid-cols-2' : 'sm:grid-cols-4'"
      >
        <RadioGroupOption
          as="template"
          v-for="sid in items"
          :key="sid.code"
          :value="sid.code"
          v-slot="{ checked, active }"
        >
          <div
            :class="[
              checked ? 'border-blue-400/60 dark:border-blue-400/40' : 'border-blue-300/40 dark:border-blue-400/20',
              active ? 'border-blue-400 ring-2 ring-blue-400/50' : '',
              'relative flex cursor-pointer rounded-lg border border-blue-300/40 dark:border-blue-400/20 bg-blue-100/10 dark:bg-blue-400/5 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/10 dark:supports-[backdrop-filter]:bg-blue-400/5 p-4 shadow-lg shadow-blue-500/3 focus:outline-hidden',
            ]"
          >
            <span class="flex flex-1">
              <span class="flex w-full flex-col items-center">
                <RadioGroupLabel
                  as="span"
                  class="text-heading block text-sm font-medium"
                  >{{ sid.text }}</RadioGroupLabel
                >
                <RadioGroupDescription as="span" class="mt-2 flex"
                  ><MilSymbol
                    :sidc="sid.sidc"
                    :size="32"
                    :modifiers="{ outlineColor: 'white', outlineWidth: 4 }"
                /></RadioGroupDescription>
              </span>
            </span>
            <CheckCircleIcon
              :class="[
                !checked ? 'invisible' : '',
                'absolute top-1 right-1 h-5 w-5 text-blue-600 dark:text-blue-400',
              ]"
              aria-hidden="true"
            />
            <span
              :class="[
                active ? 'border' : 'border-2',
                checked ? 'border-blue-400/60 dark:border-blue-400/40' : 'border-transparent',
                'pointer-events-none absolute -inset-px rounded-lg',
              ]"
              aria-hidden="true"
            />
          </div>
        </RadioGroupOption>
      </div>
    </RadioGroup>
    <div class="mt-2 flex justify-end">
      <Button type="button" variant="link" @click="toggleShowAll()" size="sm">
        <template v-if="showAll"><span aria-hidden="true"> ←</span> نمایش کمتر</template>
        <template v-else>نمایش بیشتر<span aria-hidden="true"> →</span></template>
      </Button>
    </div>
    <div class="mt-0 grid gap-4" :class="compact ? 'grid-cols-1' : 'sm:grid-cols-2'">
      <SymbolFillColorSelect v-model="fillColorValue" :sid="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupLabel,
  RadioGroupOption,
} from "@headlessui/vue";
import { PhCheckCircle as CheckCircleIcon } from "@phosphor-icons/vue";
import type { SymbolItem, SymbolValue } from "@/types/constants";
import MilSymbol from "@/components/MilSymbol.vue";
import { useToggle, useVModel } from "@vueuse/core";
import SymbolFillColorSelect from "@/components/SymbolFillColorSelect.vue";
import { Button } from "@/components/ui/button";

interface Props {
  modelValue: string;
  compact?: boolean;
  fillColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "3",
  compact: false,
  fillColor: "",
});
const emit = defineEmits(["update:modelValue", "update:fillColor"]);

const data = useVModel(props, "modelValue", emit);
const fillColorValue = defineModel<string | null>("fillColor");

const sidItems = [
  {
    code: "3",
    text: "Friend",
  },
  {
    code: "6",
    text: "Hostile",
  },
  {
    code: "4",
    text: "Neutral",
  },
  {
    code: "1",
    text: "Unknown",
  },
  {
    code: "0",
    text: "Pending",
  },
  {
    code: "2",
    text: "Assumed Friend",
  },
  {
    code: "5",
    text: "Suspect",
  },
].map(addSymbol);

function addSymbol({ code, text }: SymbolValue): SymbolItem {
  return {
    code,
    text,
    sidc: "100" + code + 10 + "00" + "00" + "0000000000",
  };
}

const [showAll, toggleShowAll] = useToggle(false);
const items = computed(() =>
  showAll.value
    ? sidItems
    : sidItems.filter((e) => ["1", "3", "6", "4", "7"].includes(e.code)),
);
</script>
