<template>
  <div class="dropdown" :id="`dd-${dropdownId}`">
    <button
      @click="handleClick"
      @blur="handleBlur"
      class="dropdown__button"
    >
      <Icon :path="mdiPath" size="20px" color="#68696B" />
      <Icon :path="mdi.mdiChevronDown" size="16px" color="#68696B" />
    </button>
    <div :id="dropdownId" class="dropdown__content">
      <a
        v-for="[key, command] in options"
        :key="key"
        @click="handleOptionClick(command)"
      >
        <div style="display: flex; align-items: center; gap: 5px">
          <Icon v-if="command.path" :path="mdi[command.path]" size="20px" color="currentColor" />
          <span>{{ command.label }}</span>
        </div>
      </a>
    </div>
  </div>
  <!-- Tooltip will be added later if needed -->
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from './Icon.vue'
import * as mdi from '@mdi/js'
import uuid from '../shared/uuid.js'
import './DropdownMenu.css'

const props = defineProps({
  path: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  toolTip: {
    type: String,
    default: null
  }
})

const dropdownId = uuid()
const collapsed = ref(true)

const mdiPath = computed(() => mdi[props.path])

const handleClick = () => {
  const element = document.getElementById(dropdownId)
  if (element) {
    element.classList.toggle('show')
    collapsed.value = !collapsed.value
  }
}

const handleBlur = () => {
  const hide = () => {
    const element = document.getElementById(dropdownId)
    if (element) {
      element.classList.remove('show')
      collapsed.value = true
    }
  }
  setTimeout(hide, 200)
}

const handleOptionClick = (command) => {
  if (command.execute) {
    command.execute()
  }
}
</script>


