<script setup lang="ts">
import { useId } from "vue";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
const props = defineProps<{ disabled?: boolean }>();

const enabled = defineModel({ default: true });
const id = useId();
</script>
<template>
  <div class="flex items-center gap-2.5">
    <Switch v-model="enabled" :id="id" :disabled />
    <Label v-if="$slots.default" :for="id" :disabled>
      <slot />
    </Label>
  </div>
</template>
