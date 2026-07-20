<template>
  <span
    v-if="mode === 'display'"
    class="e3de-tag e3de-tag--plus"
    @click="handleClick"
  >
    <TagIcon :path="mdi.mdiPlus" />
    add tag
  </span>
  <input
    v-else
    class="e3de-tag__input"
    :value="inputValue"
    @blur="handleEnter"
    @keydown="handleKeyDown"
    @input="handleChange"
    autofocus
  />
</template>

<script setup>
import { ref } from 'vue'
import { useController } from './useTagController.js'
import { matcher, stopPropagation } from '../events.js'
import { cmdOrCtrl } from '../../platform.js'
import TagIcon from './TagIcon.vue'
import * as mdi from '@mdi/js'

const props = defineProps({
  id: String
})

const controller = useController()
const mode = ref('display')
const inputValue = ref('')

const handleEnter = () => {
  const sidebar = document.getElementsByClassName('e3de-sidebar')[0]
  if (sidebar) {
    sidebar.focus()
  }
  
  mode.value = 'display'
  if (inputValue.value) {
    controller.addTag(props.id, inputValue.value)
  }
}

const handleKeyDown = (event) => {
  matcher([
    ({ key }) => key === 'Enter',
    ({ key }) => key === 'Escape',
    ({ key }) => key === 'ArrowDown',
    ({ key }) => key === 'ArrowUp',
    ({ key }) => key === 'Home',
    ({ key }) => key === 'End',
    ({ key }) => key === ' ',
    event => cmdOrCtrl(event) && event.key === 'a'
  ], stopPropagation)(event)

  if (event.key === 'Enter') {
    handleEnter()
  } else if (event.key === 'Escape') {
    mode.value = 'display'
  }
}

const handleChange = ({ target }) => {
  const value = target.value
    ? target.value.replace(/[^0-9a-z-/]+/ig, '')
    : ''
  inputValue.value = value.substring(0, 16).toUpperCase()
}

const handleClick = (event) => {
  event.stopPropagation()
  inputValue.value = ''
  mode.value = 'edit'
}
</script>

<style scoped>
@import './tags.css';
</style>

