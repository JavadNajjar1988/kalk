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
  <Collapsible v-model="isOpen" class="border-border relative border-b" v-slot="{ open }">
    <CollapsibleTrigger class="group flex w-full items-center justify-between py-3">
      <h3 class="flex items-center gap-2 text-sm font-semibold">
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
    <CollapsibleContent className="pt-1 pb-3 pr-2 sm:pr-0"><slot /></CollapsibleContent>
  </Collapsible>
</template>
