<template>
  <header v-if="commandRegistry && typeof commandRegistry.separator === 'function'" class="toolbar">
    <div class="toolbar__items-container">
      <DropdownMenu path="mdiPlusBoxOutline" :options="addCommands" toolTip="ایجاد مورد جدید ..." />
      <template v-for="[key, command] in commands" :key="key">
        <span v-if="command === 'separator'" class="toolbar__divider"></span>
        <CommandButton v-else :command="command" />
      </template>
      <DropdownMenu path="mdiAndroidStudio" :options="measureCommands" toolTip="اندازه‌گیری ..." />
      <template v-for="[key, command] in replicationCommands" :key="key">
        <span v-if="command === 'separator'" class="toolbar__divider"></span>
        <CommandButton v-else :command="command" />
      </template>
    </div>
    <div class="toolbar__items-container toolbar__items--right">
      <SimpleButton
        :onClick="() => toggleProperties('properties')"
        path="mdiFileDocumentOutline"
        :checked="properties === 'properties'"
        toolTip="نمایش ویژگی‌های موارد انتخاب‌شده"
      />
      <SimpleButton
        :onClick="() => toggleProperties('styles')"
        path="mdiFormatPaint"
        :checked="properties === 'styles'"
        toolTip="نمایش گزینه‌های استایل برای لایه انتخاب‌شده"
      />
      <SimpleButton
        v-if="!isReplicationDisabled"
        :onClick="() => toggleProperties('sharing')"
        path="mdiCloudOutline"
        :checked="properties === 'sharing'"
        toolTip="نمایش گزینه‌های اشتراک‌گذاری برای لایه انتخاب‌شده"
      />
    </div>
  </header>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useServices } from '../composables/useServices.js'
import { useMemento } from '../composables/useMemento.js'
import DropdownMenu from './DropdownMenu.vue'
import CommandButton from './CommandButton.vue'
import SimpleButton from './ToolbarButtons.vue'
import './Toolbar.css'

const services = inject('services')
const globalServices = useServices()

// Get commandRegistry from project services (injected) or global services
const commandRegistry = computed(() => {
  if (services && services.value && services.value.commandRegistry) {
    return services.value.commandRegistry
  }
  return globalServices.commandRegistry
})

// Get replicationProvider
const replicationProvider = computed(() => {
  if (services && services.value && services.value.replicationProvider) {
    return services.value.replicationProvider
  }
  return globalServices.replicationProvider
})

const isReplicationDisabled = computed(() => {
  return replicationProvider.value?.disabled ?? true
})

// Use memento for properties state
const [properties, setProperties] = useMemento('ui.properties', '')

// Build commands arrays
const commands = computed(() => {
  if (!commandRegistry.value) return []
  
  return [
    commandRegistry.value.separator(),
    commandRegistry.value.command('CLIPBOARD_CUT'),
    commandRegistry.value.command('CLIPBOARD_COPY'),
    commandRegistry.value.command('CLIPBOARD_PASTE'),
    commandRegistry.value.command('CLIPBOARD_DELETE'),
    commandRegistry.value.separator(),
    commandRegistry.value.command('UNDO_UNDO'),
    commandRegistry.value.command('UNDO_REDO'),
    commandRegistry.value.separator(),
    commandRegistry.value.command('LAYER_SET_DEFAULT'),
    commandRegistry.value.command('PIN'),
    commandRegistry.value.command('LAYER_EXPORT'),
    commandRegistry.value.command('SELECT_TILE_LAYERS'),
    commandRegistry.value.separator(),
    commandRegistry.value.command('PRINT_SWITCH_SCOPE')
  ]
})

const addCommands = computed(() => {
  if (!commandRegistry.value) return []
  
  return [
    commandRegistry.value.command('LAYER_CREATE'),
    commandRegistry.value.command('MARKER_CREATE'),
    commandRegistry.value.command('BOOKMARK_CREATE'),
    commandRegistry.value.command('TILE_SERVICE_CREATE')
  ]
})

const measureCommands = computed(() => {
  if (!commandRegistry.value) return []
  
  return [
    commandRegistry.value.command('MEASURE_DISTANCE'),
    commandRegistry.value.command('MEASURE_AREA')
  ]
})

const replicationCommands = computed(() => {
  if (!commandRegistry.value) return []
  
  return [
    commandRegistry.value.separator(),
    commandRegistry.value.command('REPLICATION_LAYER_SHARE'),
    commandRegistry.value.command('REPLICATION_LAYER_JOIN'),
    commandRegistry.value.command('REPLICATION_LAYER_LEAVE'),
    commandRegistry.value.separator()
  ]
})

const toggleProperties = (type) => {
  if (properties.value === type) {
    setProperties('')
  } else {
    setProperties(type)
  }
}
</script>

<style scoped>
@import './Toolbar.css';
</style>

