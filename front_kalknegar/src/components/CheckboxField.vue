<script setup lang="ts">
import { useId } from "vue";
import { Label } from "@/components/ui/label";

const props = defineProps<{ disabled?: boolean }>();
const model = defineModel<boolean>({ default: false });
const id = useId();
</script>
<template>
  <div class="flex items-center gap-2 py-1">
    <input
      :id="id"
      type="checkbox"
      class="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-1"
      v-model="model"
      :disabled="props.disabled"
    />
    <Label v-if="$slots.default" :for="id" :disabled="props.disabled">
      <slot />
    </Label>
  </div>
</template>


