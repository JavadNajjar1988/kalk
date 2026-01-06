<template>
  <div class="e3de-card-container" ref="cardRef">
    <div
      class="e3de-card e3de-column"
      :style="cardStyle"
      :aria-selected="selected"
      @click="handleClick"
      @dblclick="handleDoubleClick"
      @dragover="onDragOver"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="header e3de-row">
        <Title
          :id="id"
          :value="title"
          :editing="editing"
          :highlight="highlight"
        />
        <button
          v-if="canRename"
          class="e3de-button"
          @click="handleRename"
        >
          <Icon class="e3de-icon tt-rename-button" :path="mdi.mdiPencil" />
        </button>
        <button
          class="e3de-button"
          @click="handlePin"
        >
          <Icon class="e3de-icon tt-pin-button" :path="pinPath" />
        </button>
      </div>
      <template v-if="hasBody">
        <hr />
        <div class="body e3de-row">
          <span v-if="description" class="e3de-description">{{ description }}</span>
          <div v-if="svg" class="avatar" v-html="svg"></div>
        </div>
      </template>
      <hr />
      <div class="e3de-taglist">
        <component
          v-for="(tagSpec, index) in tagSpecs"
          :key="`${id}-${index}`"
          :is="tagComponent(tagSpec)"
          v-bind="tagProps(tagSpec)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useEmitter } from '../../composables/useEmitter.js'
import * as ID from '../../ids.js'
import Title from './Title.vue'
import Icon from '../Icon.vue'
import * as mdi from '@mdi/js'
import { TAG } from './tags.js'
import './Card.css'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  capabilities: {
    type: String,
    default: ''
  },
  svg: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  highlight: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    default: ''
  },
  tags: {
    type: String,
    default: ''
  },
  selected: {
    type: Boolean,
    default: false
  },
  editing: {
    type: [String, Boolean],
    default: false
  },
  onClick: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['measureRef'])

const cardRef = ref(null)
const sidebarEmitter = useEmitter('sidebar')
// Get project-specific services from parent
const servicesRef = inject('services')
const dropAllowed = ref(null)

const acceptDrop = computed(() => {
  return props.capabilities && props.capabilities.includes('DROP')
})

const cardStyle = computed(() => {
  return dropAllowed.value === true
    ? { border: '0.2rem dashed #40a9ff', padding: '0.38rem' }
    : {}
})

const pinned = computed(() => {
  return props.tags.split(' ').findIndex(s => s.match(/USER:pin:NONE/gi)) !== -1
})

const pinPath = computed(() => {
  return pinned.value ? mdi.mdiPin : mdi.mdiPinOutline
})

const canRename = computed(() => {
  return (props.capabilities || '').includes('RENAME')
})

const hasBody = computed(() => {
  return !!(props.svg || props.description)
})

const tagSpecs = computed(() => {
  return props.tags.split(' ').filter(s => s)
})

const tagComponent = (spec) => {
  const [variant] = spec.split(':')
  const tagFactory = TAG[variant]
  if (!tagFactory) return null
  const { component } = tagFactory({})
  return component
}

const tagProps = (spec) => {
  const [variant, label, action, path, removable] = spec.split(':')
  return {
    id: props.id,
    spec,
    label,
    action,
    path,
    removable
  }
}

const handleClick = (event) => {
  props.onClick(props.id)(event)
}

const handleDoubleClick = async () => {
  const svcs = servicesRef?.value
  if (!svcs) return
  
  const { emitter, store, featureStore, ipcRenderer } = svcs
  const scope = ID.scope(props.id)
  
  const scopes = {
    symbol: () => {
      // Use global emitter for draw command
      emitter.emit('command/entry/draw', { id: props.id })
    },
    'link+layer': async () => {
      const links = await store.values([props.id])
      links.forEach(link => {
        if (ipcRenderer && ipcRenderer.send) {
          ipcRenderer.send('OPEN_LINK', link)
        } else {
          // Web fallback: open link in new tab
          window.open(link.url, '_blank')
        }
      })
    },
    'link+feature': async () => {
      const links = await store.values([props.id])
      links.forEach(link => {
        if (ipcRenderer && ipcRenderer.send) {
          ipcRenderer.send('OPEN_LINK', link)
        } else {
          // Web fallback: open link in new tab
          window.open(link.url, '_blank')
        }
      })
    },
    marker: async () => {
      const markers = await store.values([props.id])
      if (markers.length !== 1) return
      const center = markers[0].geometry.coordinates
      emitter.emit('map/flyto', { center })
    },
    bookmark: async () => {
      const entity = await store.values([props.id])
      if (entity.length !== 1) return
      emitter.emit('map/goto', {
        center: entity[0].center,
        resolution: entity[0].resolution,
        rotation: entity[0].rotation
      })
    },
    feature: async () => {
      const center = await featureStore.center(props.id)
      if (center) emitter.emit('map/goto', { center })
    },
    place: async () => {
      const center = await featureStore.center(props.id)
      if (center) emitter.emit('map/goto', { center })
    }
  }
  
  const handler = scopes[scope] || (() => {})
  await handler()
}

const handleRename = () => {
  sidebarEmitter.value.emit('edit/begin', { id: props.id })
}

const handlePin = () => {
  sidebarEmitter.value.emit(pinned.value ? 'unpin' : 'pin', { id: props.id })
}

const dropEffect = (event) => {
  const types = [...event.dataTransfer.types]
  return acceptDrop.value
    ? types.some(t => t === 'text/uri-list') ? 'copy' : 'link'
    : 'none'
}

const onDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = dropEffect(event)
  dropAllowed.value = acceptDrop.value
}

const onDragEnter = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = dropEffect(event)
}

const onDragLeave = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = dropEffect(event)
  dropAllowed.value = null
}

const onDrop = async (event) => {
  event.preventDefault()
  dropAllowed.value = null
  if (!acceptDrop.value) return

  const svcs = servicesRef?.value
  if (!svcs || !svcs.store) return

  // Process files first (if any):
  const files = [...event.dataTransfer.files]
  const fileLinks = files.reduce((acc, file) => {
    // In web version, we can't access file.path, so we'll use file.name
    const url = URL.createObjectURL(file)
    const value = { name: file.name, url: url }
    acc.push([ID.linkId(props.id), value])
    return acc
  }, [])

  // Process URI items:
  const items = [...event.dataTransfer.items]
  const links = []
  
  for (const item of items) {
    if (item.type === 'text/uri-list') {
      const url = await new Promise(resolve => {
        item.getAsString(resolve)
      })
      try {
        const urlObj = new URL(url)
        if (urlObj.hostname && urlObj.href) {
          links.push([`link:${props.id}`, { name: urlObj.origin, url: urlObj.href }])
        }
      } catch (e) {
        // Invalid URL
      }
    }
  }

  const allLinks = [...fileLinks, ...links]
  if (allLinks.length > 0) {
    await svcs.store.insert(allLinks)
  }
}
</script>

<style scoped>
@import './Card.css';
</style>

