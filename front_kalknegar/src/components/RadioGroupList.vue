<template>
  <RadioGroup v-model="selected">
    <RadioGroupLabel class="sr-only">{{ label }}</RadioGroupLabel>
    <div class="-space-y-px rounded-2xl border border-blue-400/30 dark:border-blue-500/30 bg-blue-400/10 supports-[backdrop-filter]:bg-blue-400/15 backdrop-blur-md">
      <RadioGroupOption
        as="template"
        v-for="(item, settingIdx) in items"
        :key="item.value"
        :value="item.value"
        v-slot="{ checked, active }"
      >
        <div
          :class="[
            settingIdx === 0 ? 'rounded-tl-2xl rounded-tr-2xl' : '',
            settingIdx === items.length - 1 ? 'rounded-br-2xl rounded-bl-2xl' : '',
            checked ? 'z-10 border-blue-400/40 bg-blue-400/15' : 'border-blue-400/30',
            'relative flex cursor-pointer border p-4 focus:outline-hidden',
          ]"
        >
          <span
            class="shrink-0"
            :class="[
              checked ? 'border-transparent bg-blue-500' : 'border-blue-300 bg-white/80',
              active ? 'ring-2 ring-blue-400 ring-offset-2' : '',
              'mt-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border',
            ]"
            aria-hidden="true"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div class="ml-3 flex flex-col">
            <RadioGroupLabel
              as="span"
              :class="[
                'text-foreground',
                'block text-sm font-medium',
              ]"
            >
              {{ item.name }}
            </RadioGroupLabel>
            <RadioGroupDescription
              as="span"
              :class="[checked ? 'text-foreground/80' : 'text-muted-foreground', 'block text-sm']"
            >
              {{ item.description || "" }}
            </RadioGroupDescription>
          </div>
        </div>
      </RadioGroupOption>
    </div>
  </RadioGroup>
</template>

<script setup lang="ts">
import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupLabel,
  RadioGroupOption,
} from "@headlessui/vue";
import { type RadioGroupItem } from "@/components/types";

defineProps<{
  items: RadioGroupItem[];
  label?: string;
}>();

const selected = defineModel<string>();
</script>
