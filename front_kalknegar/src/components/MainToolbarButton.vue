<template>
  <Button
    type="button"
    variant="ghost"
    size="icon"
    class="text-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
    :class="active ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : ''"
  >
    <slot />
  </Button>
</template>
<script setup lang="ts">
import { Button } from "@/components/ui/button";

const props = withDefaults(defineProps<{ active?: boolean }>(), { active: false });
</script>
