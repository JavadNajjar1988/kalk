<template>
  <span class="e3de-tag e3de-tag--system e3de-icon-tag" v-bind="$attrs">
    <Icon :path="path" />
  </span>
</template>

<script setup>
import Icon from '../Icon.vue'

defineProps({
  path: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
@import './tags.css';
</style>

