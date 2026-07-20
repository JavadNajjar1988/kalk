<template>
  <span
    :class="className"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useController } from './useTagController.js'

const props = defineProps({
  id: String,
  spec: String,
  label: String,
  action: String
})

const controller = useController()
const active = computed(() => props.action !== 'NONE' ? '--active' : '')
const className = computed(() => `e3de-tag e3de-tag--scope e3de-tag${active.value}`)

const handleClick = (event) => {
  event.stopPropagation()
}

const handleMouseDown = (event) => {
  controller.handleMouseDown(props.id, event, props.spec)
}

const handleMouseUp = (event) => {
  controller.handleMouseUp(props.id, event, props.spec)
}
</script>

<style scoped>
@import './tags.css';
</style>

