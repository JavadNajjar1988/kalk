<template>
  <div class="fe6e-filter-container">
    <svg class="fe6e-search-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
    </svg>
    <input
      class="fe6e-filter"
      type="text"
      ref="inputRef"
      placeholder="جست‌وجوی نمادها"
      aria-label="جست‌وجوی نمادهای تاکتیکی"
      :value="search.filter"
      @input="handleChange"
      @keydown="handleKeyDown"
      @click="stopPropagation"
      id="filter-input"
    />
    <kbd class="fe6e-filter-shortcut">ESC</kbd>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useMemento } from '../../composables/useMemento.js'
import { defaultSearch } from './state.js'
import { matcher, stopPropagation } from '../events.js'
import { cmdOrCtrl } from '../../platform.js'
import { preventDefault } from 'ol/events/Event.js'
import './FilterInput.css'

const props = defineProps({
  onFocus: {
    type: Function,
    default: () => {},
  },
  mementoKey: {
    type: String,
    default: 'ui.sidebar.search',
  },
  initialSearch: {
    type: Object,
    default: () => defaultSearch,
  },
})

const [search, setSearch] = useMemento(props.mementoKey, props.initialSearch)
const cursor = ref(null)
const inputRef = ref(null)

watch([cursor, () => search.value.filter], async () => {
  await nextTick()
  const input = inputRef.value
  if (!input) return

  const position = cursor.value === null ? search.value.filter.length : cursor.value

  input.setSelectionRange(position, position)
})

const handleChange = (event) => {
  const { target } = event
  cursor.value = target.selectionStart
  setSearch({ history: search.value.history, filter: target.value })
}

const handleKeyDown = (event) => {
  matcher(
    [
      ({ key }) => key === 'Enter',
      ({ key }) => key === 'Escape',
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp',
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End',
      ({ key }) => key === ' ',
      (event) => cmdOrCtrl(event) && event.key === 'a',
    ],
    stopPropagation,
  )(event)

  matcher([({ key }) => key === 'ArrowDown'], preventDefault)(event)

  if (event.key === 'Enter') {
    setSearch({ ...search.value, force: true })
  } else if (event.key === 'Escape') {
    if (search.value.filter) {
      setSearch({ ...search.value, filter: '' })
    }
  } else if (event.key === 'ArrowDown') {
    const listContainer = document.getElementsByClassName('e3de-list-container')[0]
    if (listContainer) {
      listContainer.focus()
      props.onFocus()
    }
  }
}
</script>

<style scoped>
@import './FilterInput.css';
</style>
