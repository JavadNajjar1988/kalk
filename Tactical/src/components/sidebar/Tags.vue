<template>
  <ScopeTag
    v-if="variant === 'SCOPE'"
    :id="id"
    :spec="spec"
    :label="label"
    :action="action"
  />
  <SystemTag
    v-else-if="variant === 'SYSTEM'"
    :id="id"
    :spec="spec"
    :label="label"
    :action="action"
    :path="path"
  />
  <UserTag
    v-else-if="variant === 'USER'"
    :id="id"
    :label="label"
    :removable="removable"
  />
  <PlusTag
    v-else-if="variant === 'PLUS'"
    :id="id"
  />
</template>

<script setup>
import ScopeTag from './ScopeTag.vue'
import SystemTag from './SystemTag.vue'
import UserTag from './UserTag.vue'
import PlusTag from './PlusTag.vue'

const props = defineProps({
  id: String,
  spec: String,
  variant: String,
  label: String,
  action: String,
  path: String,
  removable: String
})
</script>

