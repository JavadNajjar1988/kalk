<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { useVModel } from "@vueuse/core";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  defaultValue?: string | number;
  modelValue?: string | number;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="
      cn(
        'border-blue-300/40 dark:border-blue-400/20 placeholder:text-muted-foreground focus-visible:border-blue-400 focus-visible:ring-blue-400/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-blue-400/5 flex field-sizing-content min-h-16 w-full rounded-md border bg-blue-100/10 dark:bg-blue-400/3 backdrop-blur backdrop-saturate-150 supports-[backdrop-filter]:bg-blue-300/10 dark:supports-[backdrop-filter]:bg-blue-400/5 px-3 py-2 text-base shadow-lg shadow-blue-500/3 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        props.class,
      )
    "
  />
</template>
