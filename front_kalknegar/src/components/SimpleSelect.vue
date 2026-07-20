<template>
  <InputGroupTemplate :label="label" :description="description">
    <template v-slot:default="{ id }">
      <select
        v-model="selectedValue"
        data-slot="select-trigger"
        :data-size="size"
        :id="id"
        class="simple-select data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&_svg:not([class*='size-'])]:size-4 block flex w-fit w-full items-center justify-between gap-2 rounded-md border backdrop-blur backdrop-saturate-150 px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=lg]:h-12 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0"
      >
        <option v-if="addNone" :value="null">هیچ</option>
        <option v-for="val in computedValues" :value="val.value" :key="val.value">
          {{ val.label }}
        </option>
      </select>
    </template>
    <template #hint><slot name="hint" /></template>
  </InputGroupTemplate>
</template>

<script setup lang="ts">
import InputGroupTemplate from "./InputGroupTemplate.vue";
import { computed } from "vue";
import { type SelectItem } from "./types";

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    items?: SelectItem[];
    values?: (string | number)[];
    addNone?: boolean;
    size?: "sm" | "lg" | "default";
  }>(),
  { size: "default" },
);

const selectedValue = defineModel<string | number | null>({ required: false });
const computedValues = computed(() => {
  if (props.items) return props.items;

  return (props.values || []).map((i) => ({
    label: i,
    value: i,
  }));
});
</script>
<style scoped>
.simple-select {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  box-shadow: 0 10px 15px -3px color-mix(in srgb, var(--color-primary) 3%, transparent);
}

.simple-select:hover {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.simple-select:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 50%, transparent);
}

:global(.dark) .simple-select {
  background-color: color-mix(in srgb, var(--color-primary) 3%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

:global(.dark) .simple-select:hover {
  background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .simple-select {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  
  :global(.dark) .simple-select {
    background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }
}
</style>
