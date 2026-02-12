<template>
  <div class="form-select">
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      class="form-select__options"
      v-bind="$attrs"
      @change="$emit('update:modelValue', $event.target.value); $emit('change', $event)"
    >
      <slot />
    </select>
  </div>
</template>

<script setup>
defineProps({
  id: String,
  disabled: Boolean,
  modelValue: String
})

defineEmits(['update:modelValue', 'change'])
</script>

<style scoped>
@import './Select.css';
</style>

