<template>
  <button
    :id="`cb-${command.path}`"
    class="toolbar__button"
    @click="handleClick"
    :disabled="!enabled"
  >
    <Icon :path="mdiPath" size="20px" />
  </button>
  <!-- Tooltip will be added later if needed -->
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Icon from './Icon.vue'
import * as mdi from '@mdi/js'

const props = defineProps({
  command: {
    type: Object,
    required: true
  }
})

const enabled = ref(props.command.enabled ? props.command.enabled() : true)
const version = ref(Date.now())

const mdiPath = computed(() => mdi[props.command.path])

const handleClick = () => {
  if (props.command.execute) {
    props.command.execute()
  }
}

const handleChanged = () => {
  if (props.command.enabled) {
    enabled.value = props.command.enabled()
  }
  version.value = Date.now()
}

watch(() => props.command, (newCommand) => {
  if (newCommand.on) {
    newCommand.on('changed', handleChanged)
  }
  if (newCommand.enabled) {
    enabled.value = newCommand.enabled()
  }
}, { immediate: true })

onMounted(() => {
  if (props.command.on) {
    props.command.on('changed', handleChanged)
  }
})

onUnmounted(() => {
  if (props.command.off) {
    props.command.off('changed', handleChanged)
  }
})
</script>

<style scoped>
@import './Toolbar.css';
</style>

