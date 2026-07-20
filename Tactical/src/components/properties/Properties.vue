<template>
  <div v-if="hasContent" class="feature-properties">
    <div v-if="panel && (!singleton || !many)">
      <component :is="panelComponent" v-bind="state" />
    </div>
    <div v-else style="padding: 1.5rem;">
      <h3 style="margin: 0 0 1rem 0; color: #333; font-size: 1.1rem;">Properties</h3>
      <div style="margin-bottom: 1rem;">
        <p style="color: #666; margin: 0.5rem 0;">Type: <strong>{{ state.propertiesClass || 'None' }}</strong></p>
        <p style="color: #666; margin: 0.5rem 0;">Selected: <strong>{{ Object.keys(state.features || {}).length }}</strong> item(s)</p>
        <p v-if="state.disabled" style="color: #f44336; margin: 0.5rem 0;">⚠️ Locked</p>
      </div>
      <div v-if="Object.keys(state.features || {}).length > 0" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e0e0e0;">
        <div style="background: #e3f2fd; padding: 0.75rem; margin-bottom: 0.75rem; border-radius: 4px; border: 1px solid #90caf9;">
          <h4 style="margin: 0 0 0.5rem 0; color: #1976d2; font-size: 0.95rem;">Standard Identity</h4>
          <HostilityStatus 
            :key="`hostility-${Object.keys(state.features || {}).join('-')}`"
            :features="state.features" 
            :disabled="state.disabled" 
          />
        </div>
      </div>
      <div v-if="Object.keys(state.features || {}).length > 0" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 0.9rem; margin: 0.5rem 0;">IDs:</p>
        <ul style="color: #999; font-size: 0.85rem; margin: 0.5rem 0; padding-left: 1.5rem;">
          <li v-for="(value, key) in (state.features || {})" :key="key" style="margin: 0.25rem 0;">
            <div style="font-weight: 500;">{{ key }}</div>
            <div v-if="value && value.properties" style="font-size: 0.8rem; color: #aaa; margin-top: 0.25rem;">
              <div v-if="value.properties.sidc">SIDC: {{ value.properties.sidc }}</div>
              <div v-if="value.properties.name">Name: {{ value.properties.name }}</div>
            </div>
          </li>
        </ul>
      </div>
      <div v-else style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
        <p style="color: #999; font-size: 0.9rem; margin: 0; text-align: center;">هیچ آیتمی انتخاب نشده است</p>
        <p style="color: #bbb; font-size: 0.85rem; margin: 0.5rem 0 0 0; text-align: center; font-style: italic;">یک آیتم روی نقشه انتخاب کنید</p>
      </div>
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 0.85rem; font-style: italic;">Properties panel is being converted to Vue...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject, defineAsyncComponent, h } from 'vue'
import * as R from 'ramda'
import * as MILSTD from '../../symbology/2525c.js'
import { isFeatureId, lockedId, restrictedId, associatedId, scope, isAssociatedId } from '../../ids.js'
import HostilityStatus from './HostilityStatus.vue'

// Debug: Check if component is imported
console.log('Properties: HostilityStatus imported:', HostilityStatus)
import './Properties.css'

// Placeholder component for React components that haven't been converted yet
const PlaceholderComponent = {
  props: ['features', 'locks', 'disabled', 'propertiesClass'],
  setup(props) {
    const featureCount = computed(() => Object.keys(props.features || {}).length)
    const featureKeys = computed(() => Object.keys(props.features || {}))
    return { featureCount, featureKeys }
  },
  render() {
    return h('div', { style: { padding: '1.5rem' } }, [
      h('h3', { style: { margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem' } }, 'Properties'),
      h('div', { style: { marginBottom: '1rem' } }, [
        h('p', { style: { color: '#666', margin: '0.5rem 0' } }, [
          'Type: ',
          h('strong', {}, this.propertiesClass || 'Unknown')
        ]),
        h('p', { style: { color: '#666', margin: '0.5rem 0' } }, [
          'Selected: ',
          h('strong', {}, `${this.featureCount} item(s)`)
        ]),
        this.disabled ? h('p', { style: { color: '#f44336', margin: '0.5rem 0' } }, '⚠️ Locked') : null
      ]),
      this.featureCount > 0 ? h('div', { style: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' } }, [
        h('p', { style: { color: '#999', fontSize: '0.9rem', margin: '0.5rem 0' } }, 'IDs:'),
        h('ul', { style: { color: '#999', fontSize: '0.85rem', margin: '0.5rem 0', paddingLeft: '1.5rem' } },
          this.featureKeys.map(key => h('li', { key, style: { margin: '0.25rem 0' } }, key))
        )
      ]) : null,
      h('div', { style: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' } }, [
        h('p', { style: { color: '#999', fontSize: '0.85rem', fontStyle: 'italic' } }, 'Properties panel is being converted to Vue...')
      ])
    ])
  }
}

// Try to load components dynamically, fallback to placeholder
const loadComponent = (name) => {
  return defineAsyncComponent({
    loader: () => {
      try {
        // These are React components, so they won't work directly
        // For now, return placeholder
        return Promise.resolve(PlaceholderComponent)
      } catch (e) {
        return Promise.resolve(PlaceholderComponent)
      }
    },
    errorComponent: PlaceholderComponent,
    loadingComponent: PlaceholderComponent
  })
}

const propertiesPanels = {
  'feature:UNIT': PlaceholderComponent,
  'feature:EQUIPMENT': PlaceholderComponent,
  'feature:INSTALLATION': PlaceholderComponent,
  'feature:ACTIVITY': PlaceholderComponent,
  'feature:GRAPHICS': PlaceholderComponent,
  'feature:BOUNDARIES': PlaceholderComponent,
  'feature:POINT': PlaceholderComponent,
  marker: PlaceholderComponent,
  'tile-service': PlaceholderComponent,
  'tile-preset': PlaceholderComponent,
  'feature:SKKM/K': PlaceholderComponent,
  'feature:SKKM/KU': PlaceholderComponent,
  'feature:SKKM/KC': PlaceholderComponent
}

const singletons = ['tile-service', 'tile-layers']

const sidc = feature => feature?.properties?.sidc

const propertiesClasses = features => Object
  .entries(features)
  .reduce((acc, [key, value]) => {
    const push = name => name && R.tap(acc => acc.push(name), acc)
    const className = isFeatureId(key)
      ? `feature:${MILSTD.className(sidc(value)) || ''}`
      : scope(key)

    return push(className)
  }, [])

const propertiesClass = features => {
  const classes = R.uniq(propertiesClasses(features))
  return classes.length === 1 ? R.head(classes) : null
}

const locked = locks => Object
  .values(locks)
  .map(locked => locked || false)
  .reduce((acc, locked) => acc || locked, false)

const resetState = (_, { features, locks }) => ({
  features,
  locks,
  propertiesClass: propertiesClass(features),
  disabled: locked(locks)
})

const isGeometry = value => {
  if (!value) return false
  else if (typeof value !== 'object') return false
  else {
    if (!value.type) return false
    else if (!value.coordinates && !value.geometries) return false
    return true
  }
}

const updateFeatures = (operations, features) => {
  if (!features) features = {}
  return operations
    .filter(({ key }) => !isAssociatedId(key))
    .reduce((acc, { type, key, value }) => {
      if (type === 'del') {
        delete acc[key]
      } else {
        const hasGeometry = acc[key] && acc[key].geometry
        const retainGeometry = hasGeometry && !value.geometry && !isGeometry(value)
        const updateGeometry = acc[key] && isGeometry(value)

        if (retainGeometry) {
          acc[key] = { ...value, geometry: acc[key].geometry }
        } else if (updateGeometry) {
          acc[key] = { ...acc[key], geometry: value }
        } else if (acc[key]) {
          acc[key] = value
        }
      }

      return acc
    }, { ...features })
}

const updateLocks = (operations, features, locks) => operations
  .filter(({ key }) => isAssociatedId(key))
  .map(({ type, key, value }) => ({ type, key: associatedId(key), value }))
  .filter(({ key }) => features[key])
  .reduce((acc, { type, key, value }) => {
    if (type === 'del') delete acc[key]
    else acc[key] = value
    return acc
  }, locks)

const updateState = (state, { operations }) => {
  const currentFeatures = state.features || {}
  const features = updateFeatures(operations, currentFeatures)
  const locks = updateLocks(operations, features, state.locks || {})

  return {
    features,
    locks,
    propertiesClass: propertiesClass(features),
    disabled: locked(locks)
  }
}

const reducer = (state, event) => {
  const handlers = {
    reset: resetState,
    update: updateState
  }

  const handler = handlers[event.type] || R.identity
  return handler(state, event)
}

// Get project-specific services from parent
const servicesRef = inject('services')
const state = reactive({})

const handleSelection = async (event) => {
  if (!servicesRef?.value) return
  
  const { selection, store, preferencesStore } = servicesRef.value
  const keys = selection.selected()

  if (keys.length === 0) {
    // Clear state when nothing is selected
    Object.assign(state, {
      features: {},
      locks: {},
      propertiesClass: null,
      disabled: false
    })
    return
  }

  try {
    // Open properties panel when feature is selected
    const hasFeature = keys.some(key => isFeatureId(key))
    if (hasFeature) {
      await preferencesStore.put('ui.properties', 'properties')
    }
    
    const features = await store.dictionary(keys)
    const locks = await store.dictionary(keys.map(lockedId), key => associatedId(key))
    const restrictions = await store.dictionary(keys.map(restrictedId), key => associatedId(key))
    
    const newState = reducer(state, { type: 'reset', features, locks: { ...locks, ...restrictions } })
    
    // Use Object.assign to maintain reactivity
    Object.assign(state, newState)
  } catch (error) {
    console.error('Properties: Error loading selection:', error)
  }
}

const handleBatch = ({ operations }) => {
  if (!servicesRef?.value) return
  
  const { selection } = servicesRef.value
  const keys = operations.map(operation => operation.key)
  const relevant = R.intersection(selection.selected(), keys)
  if (relevant.length === 0) return
  
  Object.assign(state, reducer(state, { type: 'update', operations }))
}

const panel = computed(() => {
  return propertiesPanels[state.propertiesClass] || null
})

const panelComponent = computed(() => {
  return panel.value
})

const singleton = computed(() => {
  return singletons.includes(state.propertiesClass)
})

const many = computed(() => {
  return Object.keys(state.features || {}).length > 1
})

const hasContent = computed(() => {
  // Always show the panel
  return true
})

// Initialize state with default values - must be reactive
Object.assign(state, {
  features: {},
  locks: {},
  propertiesClass: null,
  disabled: false
})

let cleanup = null

watch(() => servicesRef?.value, (services) => {
  // Cleanup previous watchers
  if (cleanup) {
    cleanup()
    cleanup = null
  }
  
  if (!services) return
  
  const { selection, store } = services
  
  // Register event handlers
  selection.on('selection', handleSelection)
  store.on('batch', handleBatch)
  
  // Load initial selection
  handleSelection()
  
  // Return cleanup function
  cleanup = () => {
    if (store) store.off('batch', handleBatch)
    if (selection) selection.off('selection', handleSelection)
  }
}, { immediate: true })

onUnmounted(() => {
  if (!servicesRef?.value) return
  
  const { selection, store } = servicesRef.value
  store.off('batch', handleBatch)
  selection.off('selection', handleSelection)
})
</script>

