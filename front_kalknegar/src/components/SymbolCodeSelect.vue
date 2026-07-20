<script setup lang="ts">
import { computed, useId } from "vue";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type NullableSymbolItem } from "@/types/constants";
import { type UnitSymbolOptions } from "@/types/scenarioModels";
import { Label } from "@/components/ui/label";
import NewMilitarySymbol from "@/components/NewMilitarySymbol.vue";
import { toPersianDigits } from "@/utils/persianNumbers";

interface Props {
  label?: string;
  items: NullableSymbolItem[];
  symbolOptions?: UnitSymbolOptions;
  placeholder?: string;
}

const props = defineProps<Props>();
const controlId = useId();

const selectedValue = defineModel<string | null>({ default: "00" });
const selected = computed(() =>
  (props.items || []).find((i) => i.code === selectedValue.value),
);

function displayText(item: NullableSymbolItem | undefined) {
  if (!item) return "";
  return /[A-Za-z]/.test(item.text)
    ? `گزینه ${toPersianDigits(item.code ?? "00")}`
    : item.text;
}
</script>
<template>
  <div>
    <Select v-model="selectedValue">
      <Label :for="controlId">{{ label }}</Label>
      <SelectTrigger class="mt-2 w-full" size="lg" :id="controlId">
        <SelectValue>
          <template v-if="selected"
            ><NewMilitarySymbol
              aria-hidden="true"
              class="size-8"
              :sidc="selected?.sidc || ''"
              alt=""
              :size="20"
              :options="{
                outlineWidth: 8,
                ...symbolOptions,
                ...selected?.symbolOptions,
              }"
            />
            <span class="truncate">{{ displayText(selected) }}</span>
          </template>
          <template v-else>
            <span>{{ placeholder }}</span>
          </template>
        </SelectValue>
      </SelectTrigger>
      <SelectContent class="border-border">
        <SelectGroup>
          <SelectItem
            v-for="item in items"
            :key="item.code ?? undefined"
            :value="item.code"
            class="data-[state=checked]:font-semibold"
          >
            <NewMilitarySymbol
              aria-hidden="true"
              :size="20"
              class="size-8"
              :sidc="item.sidc"
              :options="{
                outlineWidth: 8,
                ...symbolOptions,
                ...item.symbolOptions,
              }"
            />
            {{ displayText(item) }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
</template>
