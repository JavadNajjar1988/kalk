<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="color"
    :style="style"
  >
    <path :d="path" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  path: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: '24px'
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})

const style = computed(() => ({
  display: 'inline-block',
  verticalAlign: 'middle'
}))
</script>

