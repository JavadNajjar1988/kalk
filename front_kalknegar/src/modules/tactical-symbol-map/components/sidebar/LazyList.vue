<template>
  <div
    class="e3de-list-container"
    ref="outerRef"
    tabindex="0"
    @keydown="handleKeyDown"
  >
    <div ref="innerRef">
      <slot
        v-for="(item, index) in items"
        :key="index"
        :index="index"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    required: true
  },
  scroll: {
    type: String,
    default: 'none'
  },
  focusIndex: {
    type: Number,
    default: -1
  },
  renderEntry: {
    type: Function,
    required: false
  }
})

const emit = defineEmits(['keydown'])

const outerRef = ref(null)
const innerRef = ref(null)
const items = ref([])

// Simple implementation: just create array of indices
watch(() => props.count, (count) => {
  items.value = Array.from({ length: count }, (_, i) => ({ index: i }))
}, { immediate: true })

// Scroll to focused item
watch([() => props.scroll, () => props.focusIndex], async ([scroll, focusIndex]) => {
  if (scroll === 'none') return
  if (focusIndex === undefined || focusIndex === -1) return
  
  await nextTick()
  
  if (!outerRef.value) return
  
  const children = outerRef.value.children
  if (children && children[0] && children[0].children) {
    const target = children[0].children[focusIndex]
    if (target) {
      target.scrollIntoView({ behavior: scroll === 'smooth' ? 'smooth' : 'auto', block: 'nearest' })
    }
  }
}, { immediate: true })

// Forward keyboard events to parent (Sidebar)
const handleKeyDown = (event) => {
  emit('keydown', event)
}
</script>

<style scoped>
@import './Sidebar.css';
</style>

