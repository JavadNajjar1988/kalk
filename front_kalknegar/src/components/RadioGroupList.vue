<template>
  <RadioGroup v-model="selected">
    <RadioGroupLabel class="sr-only">{{ label }}</RadioGroupLabel>
    <div class="radio-group-list-container -space-y-px rounded-2xl border backdrop-blur-xl shadow-lg">
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
            checked ? 'radio-group-item-checked z-10' : 'radio-group-item-unchecked',
            'relative flex cursor-pointer border p-4 focus:outline-hidden',
          ]"
        >
          <span
            class="shrink-0 radio-group-radio"
            :class="[
              checked ? 'radio-group-radio-checked' : 'radio-group-radio-unchecked',
              active ? 'radio-group-radio-active' : '',
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
<style scoped>
.radio-group-list-container {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--color-primary) 3%, transparent);
}

:global(.dark) .radio-group-list-container {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.radio-group-item-checked {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:global(.dark) .radio-group-item-checked {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.radio-group-item-unchecked {
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .radio-group-item-unchecked {
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.radio-group-radio-checked {
  background-color: var(--color-primary);
  border-color: transparent;
}

.radio-group-radio-unchecked {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
}

:global(.dark) .radio-group-radio-unchecked {
  background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.radio-group-radio-active {
  box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px var(--color-primary);
}
</style>
