<template>
  <div v-if="panel" class="style-properties">
    <component :is="panelComponent" :style="style" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, inject } from 'vue'
import * as ID from '../../ids.js'
import './Properties.css'

// Placeholder component for React components that haven't been converted yet
const PlaceholderComponent = {
  props: ['style'],
  template: `
    <div style="padding: 1rem;">
      <p style="color: #666;">Styles panel is being converted to Vue...</p>
    </div>
  `
}

const stylesPanels = {
  'style+layer': PlaceholderComponent
}

// Get project-specific services from parent
const servicesRef = inject('services')
const style = ref([]) // [k, v]

const handleSelection = async () => {
  if (!servicesRef?.value) return
  
  const { selection, store } = servicesRef.value
  
  const keys = selection.selected().filter(ID.isStylableId).map(ID.styleId)
  if (keys.length !== 1) {
    style.value = []
    return
  }

  const key = keys[0]
  const value = await store.value(key, {})
  style.value = [key, value]
}

const handleBatch = ({ operations }) => {
  if (!servicesRef?.value) return
  
  const { selection } = servicesRef.value
  const keys = selection.selected().map(ID.styleId)
  const relevant = operations
    .filter(({ type }) => type === 'put')
    .filter(({ key }) => keys.includes(key))

  if (relevant.length !== 1) {
    style.value = []
  } else {
    const { key, value } = relevant[0]
    style.value = [key, value]
  }
}

const scope = computed(() => {
  const [key] = style.value
  return key ? ID.scope(key) : null
})

const panel = computed(() => {
  return stylesPanels[scope.value] || null
})

const panelComponent = computed(() => {
  return panel.value
})

watch(() => servicesRef?.value, (services) => {
  if (!services) return
  
  const { selection, store } = services
  
  selection.on('selection', handleSelection)
  store.on('batch', handleBatch)
  handleSelection()
  
  return () => {
    store.off('batch', handleBatch)
    selection.off('selection', handleSelection)
  }
}, { immediate: true })

onUnmounted(() => {
  if (!servicesRef?.value) return
  
  const { selection, store } = servicesRef.value
  store.off('batch', handleBatch)
  selection.off('selection', handleSelection)
})
</script>

