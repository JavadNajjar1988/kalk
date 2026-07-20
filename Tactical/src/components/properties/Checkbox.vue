<template>
  <div class="form-checkbox">
    <input
      :id="id"
      type="checkbox"
      :disabled="disabled"
      :checked="checked"
      class="form-checkbox__input"
      @change="$emit('change', $event)"
    />
    <label :for="id" class="form-checkbox__label">
      {{ label }}
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import uuid from '../../shared/uuid.js'
import './Checkbox.css'

const props = defineProps({
  label: String,
  id: {
    type: String,
    default: () => uuid()
  },
  disabled: Boolean,
  checked: Boolean
})

defineEmits(['change'])
</script>

