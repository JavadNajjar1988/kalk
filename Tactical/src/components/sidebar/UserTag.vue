<template>
  <span class="e3de-tag e3de-tag--user e3de-tag">
    {{ label }}
    <TagIcon
      v-if="isRemovable"
      :path="mdi.mdiClose"
      :removable="isRemovable"
      @click="handleRemove"
    />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useController } from './useTagController.js'
import TagIcon from './TagIcon.vue'
import * as mdi from '@mdi/js'

const props = defineProps({
  id: String,
  label: String,
  removable: String
})

const controller = useController()
const isRemovable = computed(() => props.removable !== 'false')

const handleRemove = () => {
  controller.removeTag(props.id, props.label)
}
</script>

<style scoped>
@import './tags.css';
</style>

