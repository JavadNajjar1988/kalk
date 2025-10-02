<script setup lang="ts">
import { PhMinus as Minus, PhPlus as Plus } from "@phosphor-icons/vue";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const props = defineProps<{ label: string }>();
const isOpen = defineModel<boolean>({ default: true });
</script>

<template>
  <Collapsible
    v-model="isOpen"
    class="relative mb-4 overflow-hidden rounded-2xl border border-blue-200/30 dark:border-blue-400/30 bg-blue-100/60 dark:bg-blue-400/15 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 supports-[backdrop-filter]:bg-blue-300/30 dark:supports-[backdrop-filter]:bg-blue-400/20 backdrop-blur backdrop-saturate-150"
    v-slot="{ open }"
  >
    <CollapsibleTrigger
      class="group flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-gradient-to-l from-white/50 to-transparent dark:from-blue-900/20 hover:bg-white/70 dark:hover:bg-blue-900/30 transition-colors duration-200"
    >
      <h3 class="flex items-center gap-2">
        {{ label }}
      </h3>
      <Plus
        class="text-muted-foreground hidden h-4 w-4 group-data-[state=closed]:block"
      />
      <Minus
        class="text-muted-foreground hidden h-4 w-4 group-data-[state=open]:block"
      />
    </CollapsibleTrigger>
    <div
      v-if="$slots.header && open"
      class="pointer-events-none absolute top-0 right-6 left-0 flex justify-end"
    >
      <div class="pointer-events-auto ml-4 sm:ml-6"><slot name="header" /></div>
    </div>
    <CollapsibleContent class="pt-2 pb-4 pr-4 sm:pr-4 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
      <slot />
    </CollapsibleContent>
  </Collapsible>
</template>
