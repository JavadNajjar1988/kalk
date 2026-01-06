<template>
  <div v-if="sharedLayer" class="sharing-properties">
    <div class="a0d5-panel">
      <div class="a0d5-card">
        Assigned role: {{ sharedLayer.role.self }}
      </div>
      <div class="a0d5-card">
        <label for="sharing-default-role">Default role</label>
        <Select
          id="sharing-default-role"
          :value="sharedLayer.role.default"
          :disabled="!(['ADMINISTRATOR', 'OWNER'].includes(sharedLayer.role.self)) || !online"
          @change="handleRoleChanged"
        >
          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
          <option value="CONTRIBUTOR">CONTRIBUTOR</option>
          <option value="READER">READER</option>
        </Select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, inject } from 'vue'
import * as ID from '../../ids.js'
import Select from './Select.vue'
import './Properties.css'

// Get project-specific services from parent
const servicesRef = inject('services')
const sharedLayer = ref(null)
const online = ref(true)

const handleSelection = async () => {
  if (!servicesRef?.value) return
  
  const { selection, store } = servicesRef.value
  
  const keys = selection.selected().filter(ID.isLayerId).map(ID.roleId)
  if (keys.length !== 1) {
    sharedLayer.value = null
    return
  }

  const key = keys[0]
  const role = await store.value(key, null)
  if (!role) {
    sharedLayer.value = null
    return
  }
  
  sharedLayer.value = {
    id: key,
    role
  }
}

const handleBatch = ({ operations }) => {
  if (!servicesRef?.value) return
  
  const { selection } = servicesRef.value
  const keys = selection.selected().map(ID.roleId)
  const relevant = operations
    .filter(({ type }) => type === 'put')
    .filter(({ key }) => keys.includes(key))

  if (relevant.length !== 1) {
    sharedLayer.value = null
  } else {
    const { key, value } = relevant[0]
    sharedLayer.value = {
      id: key,
      role: value
    }
  }
}

const handleRoleChanged = async (event) => {
  if (!servicesRef?.value || !sharedLayer.value) return
  
  const { emitter, store } = servicesRef.value
  const { value: defaultRole } = event.target
  const layerId = ID.containerId(sharedLayer.value.id)
  
  await store.import([{ 
    type: 'put', 
    key: sharedLayer.value.id, 
    value: { 
      self: sharedLayer.value.role.self, 
      default: defaultRole 
    } 
  }])
  
  emitter.emit(`replication/changeDefaultRole/${layerId}/${defaultRole}`)
}

watch(() => servicesRef?.value, (services) => {
  if (!services) return
  
  const { selection, store, signals } = services
  
  // Handle replication operational status
  const operational = signals['replication/operational']
  if (operational) {
    const handler = () => {
      online.value = operational()
    }
    operational.on(handler)
    online.value = operational()
  }
  
  selection.on('selection', handleSelection)
  store.on('batch', handleBatch)
  handleSelection()
  
  return () => {
    store.off('batch', handleBatch)
    selection.off('selection', handleSelection)
    if (operational) {
      operational.off(handler)
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (!servicesRef?.value) return
  
  const { selection, store } = servicesRef.value
  store.off('batch', handleBatch)
  selection.off('selection', handleSelection)
})
</script>

