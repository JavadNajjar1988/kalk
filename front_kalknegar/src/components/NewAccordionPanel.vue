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
    class="new-accordion-panel relative mb-4 overflow-hidden rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur backdrop-saturate-150"
    v-slot="{ open }"
  >
    <CollapsibleTrigger
      class="new-accordion-panel-trigger group flex w-full items-center justify-between px-4 py-3 text-sm font-semibold bg-gradient-to-l from-white/50 to-transparent hover:bg-white/70 transition-colors duration-200"
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
<style scoped>
.new-accordion-panel {
  background-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  box-shadow: 0 20px 25px -5px color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.new-accordion-panel:hover {
  box-shadow: 0 25px 50px -12px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

:global(.dark) .new-accordion-panel {
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

@supports (backdrop-filter: blur(1px)) {
  .new-accordion-panel {
    background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
  }
  
  :global(.dark) .new-accordion-panel {
    background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
}

.new-accordion-panel-trigger {
  color: color-mix(in srgb, var(--color-primary) 90%, black);
}

:global(.dark) .new-accordion-panel-trigger {
  color: color-mix(in srgb, var(--color-primary) 100%, white);
  background: linear-gradient(to left, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent);
}

:global(.dark) .new-accordion-panel-trigger:hover {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}
</style>
