<template>
  <div class="hostility-status" style="margin-bottom: 1rem; display: block; width: 100%;">
    <div class="form-section" style="position: relative;">
      <div style="display: flex; flex-direction: row; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
        <select
          :value="currentValue"
          :disabled="disabled"
          @change="handleSelectionChanged"
          style="flex: 1; min-width: 150px; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
        >
          <option value="P">Pending</option>
          <option value="U">Unknown</option>
          <option value="A">Assumed Friend</option>
          <option value="F">Friend</option>
          <option value="N">Neutral</option>
          <option value="S">Suspect</option>
          <option value="H">Hostile</option>
          <option value="J">Joker</option>
          <option value="K">Faker</option>
        </select>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="checkbox"
            :id="`exercise-${Math.random()}`"
            :disabled="exerciseDisabled || disabled"
            :checked="!exerciseDisabled && isExercise"
            @change="handleExerciseChanged"
            style="margin-right: 0.25rem;"
          />
          <label :for="`exercise-${Math.random()}`" style="user-select: none; font-size: 0.9rem;">Exercise</label>
        </div>
      </div>
      <label class="form-section__label">Standard Identity</label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted } from 'vue'
import * as R from 'ramda'
import * as MILSTD from '../../symbology/2525c.js'
import Select from './Select.vue'
import Checkbox from './Checkbox.vue'
import './Section.css'

onMounted(() => {
  console.log('HostilityStatus: component mounted', props.features)
})

const props = defineProps({
  features: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Get project-specific services from parent
const servicesRef = inject('services')

// P-PENDING         G-EXCERCISE
// U-UNKNOWN         W-EXCERCISE
// A-ASSUMED FRIEND  M-EXCERCISE
// F-FRIEND          D-EXCERCISE
// N-NEUTRAL         L-EXCERCISE
// S-SUSPECT         N/A
// H-HOSTILE         N/A
// J-JOKER           N/A
// K-FAKER           N/A

const decode = (value) => {
  switch (value) {
    case 'G': return ['P', true]
    case 'W': return ['U', true]
    case 'M': return ['A', true]
    case 'D': return ['F', true]
    case 'L': return ['N', true]
    default: return [value || '-', false]
  }
}

const encode = (value, checked) => {
  if (!checked) return value
  else if (value === 'P') return 'G'
  else if (value === 'U') return 'W'
  else if (value === 'A') return 'M'
  else if (value === 'F') return 'D'
  else if (value === 'N') return 'L'
  return value
}

const get = feature => {
  if (!feature || !feature.properties) return null
  const sidc = feature.properties.sidc
  if (!sidc) return null
  return MILSTD.identityCode(sidc)
}
const set = value => feature => ({
  ...feature,
  properties: {
    ...feature.properties,
    sidc: MILSTD.format(feature.properties?.sidc, { identity: value })
  }
})

const initialValue = () => {
  if (!props.features || Object.keys(props.features).length === 0) return '-'
  const features = Object.values(props.features)
  const values = R.uniq(features.map(get).filter(v => v !== null && v !== undefined))
  if (values.length === 0) return '-' // No SIDC found, default to '-'
  return values.length === 1
    ? values[0] || '-'
    : '*'
}

// Initialize with safe defaults
let initVal = '-'
let initDecoded = ['F', false]

try {
  initVal = initialValue()
  initDecoded = decode(initVal)
} catch (error) {
  console.error('HostilityStatus: Error in initialization:', error)
}

const currentValue = ref(initDecoded[0] || 'F')
const isExercise = ref(initDecoded[1] || false)

// Debug
if (Object.keys(props.features || {}).length > 0) {
  console.log('HostilityStatus: initialized with', initVal, 'decoded to', initDecoded, 'features:', Object.keys(props.features).length)
  console.log('HostilityStatus: currentValue =', currentValue.value, 'isExercise =', isExercise.value)
}

// Watch for changes in features
watch(() => {
  const val = initialValue()
  return val
}, (newVal) => {
  if (newVal && newVal !== '*') {
    const [val, ex] = decode(newVal)
    currentValue.value = val
    isExercise.value = ex
  } else if (newVal === '-') {
    // Default to 'F' (Friend) if no SIDC
    currentValue.value = 'F'
    isExercise.value = false
  }
}, { immediate: true })

const exerciseDisabled = computed(() => {
  return ['S', 'H', 'J', 'K'].includes(currentValue.value)
})

const update = async (value, exercise) => {
  const encodedValue = encode(value, exercise)
  
  if (!servicesRef?.value) return
  
  const { store } = servicesRef.value
  
  if (!props.features || Object.keys(props.features).length === 0) {
    console.warn('HostilityStatus: No features to update')
    return
  }
  
  try {
    // Update features using store.update with function
    // This will trigger batch event which will update the feature's properties signal
    await store.update(props.features, set(encodedValue))
    
    // Force feature change event to trigger style recalculation
    // The featureSource will handle this via batch event, but we can also
    // manually trigger change event if needed
    console.log('HostilityStatus: Updated features with identity', encodedValue)
  } catch (error) {
    console.error('HostilityStatus: Error updating hostility status:', error)
    console.error('HostilityStatus: Error details', error.stack)
  }
}

const handleSelectionChanged = (event) => {
  const value = event.target.value
  currentValue.value = value
  update(value, isExercise.value)
}

const handleExerciseChanged = (event) => {
  const checked = event.target.checked
  isExercise.value = checked
  update(currentValue.value, checked)
}
</script>

<style scoped>
.hostility-status {
  margin-bottom: 1rem;
  display: block;
  width: 100%;
  visibility: visible;
  opacity: 1;
}
</style>

