<template>
  <Icon
    :path="path"
    :class="className"
    @click="handleClick"
  />
</template>

<script setup>
import Icon from '../Icon.vue'

const props = defineProps({
  path: {
    type: String,
    required: true
  },
  removable: {
    type: Boolean,
    default: false
  },
  onClick: {
    type: Function,
    default: null
  }
})

const className = computed(() => {
  return props.removable
    ? 'e3de-tag-icon e3de-tag-close-icon'
    : 'e3de-tag-icon'
})

const handleClick = (event) => {
  event.stopPropagation()
  if (props.onClick) {
    props.onClick()
  }
}
</script>

<script>
import { computed } from 'vue'
export default {
  computed: {
    className() {
      return this.removable
        ? 'e3de-tag-icon e3de-tag-close-icon'
        : 'e3de-tag-icon'
    }
  }
}
</script>

<style scoped>
@import './tags.css';
</style>

