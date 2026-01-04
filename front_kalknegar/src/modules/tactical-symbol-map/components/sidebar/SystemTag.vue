<template>
  <IconTag
    v-if="path"
    :path="mdi[path]"
    @click="handleClick"
    :data-path="path"
  />
  <span
    v-else
    :class="className"
    @mousedown="stopPropagation"
    @click="handleClick"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useController } from './useTagController.js'
import { stopPropagation } from '../events.js'
import IconTag from './IconTag.vue'
import * as mdi from '@mdi/js'

const props = defineProps({
  id: String,
  spec: String,
  label: String,
  action: String,
  path: String
})

const controller = useController()
const active = computed(() => props.action !== 'NONE' ? '--active' : '')
const className = computed(() => `e3de-tag e3de-tag--system e3de-tag${active.value}`)

const handleClick = (event) => {
  event.stopPropagation()
  controller.handleClick(props.id, event, props.spec)
}
</script>

<style scoped>
@import './tags.css';
</style>

