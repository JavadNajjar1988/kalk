<template>
  <div
    class="e3de-sidebar"
    tabindex="0"
    @keydown="onKeyDown"
    @click="onClick(null)"
  >
    <ScopeSwitcher />
    <FilterInput @focus="onFocus" />
    <LazyList
      :count="state.entries.length"
      :scroll="state.scroll"
      :focusIndex="state.focusIndex"
      @keydown="onKeyDown"
    >
      <template #default="{ index }">
        <Card
          v-if="index < state.entries.length"
          :key="state.entries[index].id"
          v-bind="state.entries[index]"
          :selected="state.selected.includes(state.entries[index].id)"
          :editing="state.editing"
          :onClick="onClick"
        />
      </template>
    </LazyList>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, inject, computed } from 'vue'
import { useMemento } from '../../composables/useMemento.js'
import { useEmitter } from '../../composables/useEmitter.js'
import { Disposable } from '../../shared/disposable.js'
import { multiselect } from '../../model/selection/multiselect.js'
import { defaultSearch, defaultState } from './state.js'
import { matcher, preventDefault } from '../events.js'
import * as R from 'ramda'
import * as ID from '../../ids.js'
// Use Ramda's equals for deep equality check
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b)
import ScopeSwitcher from './ScopeSwitcher.vue'
import FilterInput from './FilterInput.vue'
import LazyList from './LazyList.vue'
import Card from './Card.vue'
import './Sidebar.css'

// Get project-specific services from parent
const servicesRef = inject('services')
const services = computed(() => servicesRef?.value || {})
const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)
const emitter = useEmitter('sidebar')
const state = reactive({ ...defaultState })
const lastSearch = ref(null)

// Handlers for state reducer
const handlers = {
  'edit/begin': (state, { id }) => {
    if (state.editing) return state
    else if (!id && state.selected.length === 0) return state
    else {
      const editing = id || R.last(state.selected)
      return { ...state, editing }
    }
  },
  'edit/rollback': (state) => {
    if (state.editing) return { ...state, editing: false }
    else return state
  },
  'edit/commit': (state) => {
    if (state.editing) return { ...state, editing: false }
    else return state
  },
  deselect: (state) => {
    if (state.selected.length) return { ...state, selected: [] }
    else return state
  }
}

const reducer = (state, event) => {
  if (Array.isArray(event)) {
    return event.reduce((state, event) => reducer(state, event), state)
  } else {
    const type = event.type
    const handler = handlers[type] || multiselect[type] || R.identity
    const next = handler(state, event)
    return next
  }
}

const dispatch = (event) => {
  const next = reducer(state, event)
  Object.assign(state, next)
}

const setHistory = (history) => {
  setSearch({ filter: '', history })
}

// Event handlers
const onKeyDown = (event) => {
  matcher([
    ({ key }) => key === 'ArrowDown',
    ({ key }) => key === 'ArrowUp'
  ], preventDefault)(event)

  const { key, shiftKey, metaKey, ctrlKey } = event
  if (key === 'Enter') dispatch({ type: 'edit/begin' })
  else if (key === 'F2') dispatch({ type: 'edit/begin' })
  else if (key === 'Escape') dispatch({ type: 'deselect' })
  else dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
}

const onClick = (id) => (event) => {
  if (id) {
    event.stopPropagation()
    const { metaKey, ctrlKey, shiftKey } = event
    dispatch({ type: 'click', id, metaKey, ctrlKey, shiftKey })
  } else {
    if (services.value.selection) {
      services.value.selection.set([])
    }
  }
}

const onFocus = () => {
  dispatch({ type: 'focus' })
}

// Effects
onMounted(() => {
  // Wait for services to be available
  watch(() => servicesRef?.value, (svcs) => {
    if (!svcs) return
    
    const disposable = Disposable.of()

    // Handle sidebar events
    const pin = (id) => svcs.store.addTag(id, 'pin')
    const unpin = (id) => svcs.store.removeTag(id, 'pin')

  const link = (id) => {
    const entry = R.find(R.propEq(id, 'id'), state.entries)
    setHistory([...search.value.history, {
      key: id,
      label: entry.title,
      scope: `@link !link+${id}`
    }])
  }

  const polygon = async (id) => {
    const entry = R.find(R.propEq(id, 'id'), state.entries)
    const geometry = await svcs.store.geometry(id)
    setHistory([...search.value.history, {
      scope: `@feature &geometry:${JSON.stringify(geometry)}`,
      key: id,
      label: entry.title || 'N/A'
    }])
  }

  const layerOpen = (id) => {
    const entry = R.find(R.propEq(id, 'id'), state.entries)
    setHistory([...search.value.history, {
      scope: `@feature !feature:${ID.layerUUID(id)}`,
      key: id,
      label: entry.title
    }])
  }

    const edit = async (event) => {
      if (event.action === 'commit') {
        await svcs.store.rename(event.id, event.value.trim())
      }
      if (event.action === 'commit' || event.action === 'rollback') {
        const sidebar = document.getElementsByClassName('e3de-sidebar')[0]
        if (sidebar) sidebar.focus()
      }
      dispatch({ type: event.path, id: event.id })
    }

    disposable.on(emitter, 'edit/:action', edit)
    disposable.on(emitter, 'pin', ({ id }) => pin(id))
    disposable.on(emitter, 'unpin', ({ id }) => unpin(id))
    disposable.on(emitter, 'link', ({ id }) => link(id))
    disposable.on(emitter, 'polygon', ({ id }) => polygon(id))
    disposable.on(emitter, 'layer/open', ({ id }) => layerOpen(id))

    // Fetch entries when history and/or filter changed
    watch([() => search.value.history, () => search.value.filter, () => search.value.force], async ([history, filter, force]) => {
      if (!svcs.searchIndex) return
      
      const terms = `${R.last(history).scope} ${filter}`
      const options = { force: force || false }

      // Updated search/filter must clear any selection
      if (!isEqual(lastSearch.value, search.value)) {
        dispatch({ type: 'clear' })
      }

      const queryDisposable = await svcs.searchIndex.query(terms, options, (entries) => {
        dispatch({ type: 'entries', entries })
      })

      lastSearch.value = { ...search.value }

      return () => {
        if (queryDisposable && queryDisposable.dispose) {
          queryDisposable.dispose()
        }
      }
    }, { immediate: true })

    // Sync global selection with list model
    const handleSelection = () => {
      if (svcs.selection) {
        dispatch({ type: 'selection', selected: svcs.selection.selected() })
      }
    }
    if (svcs.selection) {
      disposable.on(svcs.selection, 'selection', handleSelection)
    }

    // Sync list selection with global selection
    watch(() => state.selected, (selected) => {
      if (svcs.selection) {
        svcs.selection.set(selected)
      }
    })

    // Listen for focus event
    if (svcs.selection) {
      disposable.on(svcs.selection, 'focus', ({ id }) => {
        const scope = ID.scope(id)
        dispatch({ type: 'focus', id })
        setHistory([{ key: 'root', scope: `@${scope}`, label: scope }])
      })
    }

    onUnmounted(() => {
      disposable.dispose()
    })
  }, { immediate: true })
})
</script>

<style scoped>
@import './Sidebar.css';
</style>

