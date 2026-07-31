<template>
  <Button
    size="icon"
    variant="ghost"
    :class="compact ? '!size-7 rounded-md' : 'rounded-full'"
  >
    <span class="sr-only">بستن</span>
    <XIcon :class="compact ? 'size-4' : ''" aria-hidden="true" />
  </Button>
</template>

<script setup lang="ts">
import { PhX as XIcon } from "@phosphor-icons/vue";
import { Button } from "@/components/ui/button/index";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
</script>
