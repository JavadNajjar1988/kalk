<template>
  <div class="border-l-4 border-yellow-400 bg-yellow-50 p-4">
    <div class="flex">
      <div class="shrink-0">
        <Warning class="h-5 w-5 text-yellow-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <p class="text-sm text-yellow-700">
          <slot />
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhWarning as Warning } from "@phosphor-icons/vue";
</script>
