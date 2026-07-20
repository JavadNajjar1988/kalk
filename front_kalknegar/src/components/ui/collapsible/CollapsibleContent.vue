<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from "reka-ui";

const props = defineProps<CollapsibleContentProps>();
</script>

<template>
  <CollapsibleContent
    data-slot="collapsible-content"
    v-bind="props"
    class="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up will-change-[height,opacity]"
  >
    <slot />
  </CollapsibleContent>
</template>
