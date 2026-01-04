<template>
  <input
    v-if="editing === id"
    class="e3de-card__title"
    ref="inputRef"
    :value="value || ''"
    :placeholder="placeholder"
    @input="handleChange"
    @blur="commit"
    @keydown="handleKeyDown"
    autofocus
  />
  <span
    v-else
    :style="spanStyle"
    :class="className"
    :placeholder="placeholder"
  >
    {{ spanValue }}
  </span>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useEmitter } from '../../composables/useEmitter.js'
import { matcher, stopPropagation } from '../events.js'
import { cmdOrCtrl } from '../../platform.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: ''
  },
  editing: {
    type: [String, Boolean],
    default: false
  },
  highlight: {
    type: Boolean,
    default: false
  }
})

const emitter = useEmitter('sidebar')
const value = ref(props.value)
const inputRef = ref(null)

watch(() => props.value, (newValue) => {
  value.value = newValue
})

const placeholder = computed(() => {
  return value.value
    ? null
    : props.editing
      ? null
      : 'N/A (click to edit)'
})

const spanValue = computed(() => {
  return props.editing
    ? value.value || ''
    : value.value || placeholder.value
})

const spanStyle = computed(() => {
  return placeholder.value
    ? { color: '#c0c0c0' }
    : {}
})

const className = computed(() => {
  return props.highlight
    ? 'e3de-card__title e3de-card__title--highlight'
    : 'e3de-card__title'
})

const commit = () => {
  if (props.value === value.value) {
    emitter.emit('edit/rollback')
  } else {
    emitter.emit('edit/commit', { id: props.editing, value: value.value })
  }
}

const handleChange = ({ target }) => {
  value.value = target.value
}

const handleKeyDown = (event) => {
  matcher([
    ({ key }) => key === ' ',
    ({ key }) => key === 'ArrowDown',
    ({ key }) => key === 'ArrowUp',
    ({ key }) => key === 'Home',
    ({ key }) => key === 'End',
    ({ key }) => key === 'Escape',
    ({ key }) => key === 'Enter',
    event => event.key === 'a' && cmdOrCtrl(event)
  ], stopPropagation)(event)

  if (event.key === 'Escape') {
    emitter.emit('edit/rollback')
  } else if (event.key === 'Enter') {
    emitter.emit('edit/commit', { id: props.editing, value: value.value })
  }
}
</script>


<style scoped>
@import './Card.css';
</style>

