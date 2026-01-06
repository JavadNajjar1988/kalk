<template>
  <button
    :id="`sb-${path}`"
    :class="buttonClass"
    @click="onClick"
  >
    <Icon :path="mdiPath" size="20px" />
  </button>
  <!-- Tooltip will be added later if needed -->
</template>

<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import * as mdi from '@mdi/js'

const props = defineProps({
  onClick: {
    type: Function,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  checked: {
    type: Boolean,
    default: false
  },
  toolTip: {
    type: String,
    default: null
  }
})

const buttonClass = computed(() => {
  return props.checked
    ? 'toolbar__button toolbar__button--checked'
    : 'toolbar__button'
})

const mdiPath = computed(() => mdi[props.path])
</script>

<style scoped>
@import './Toolbar.css';
</style>

