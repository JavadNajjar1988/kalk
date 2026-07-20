<template>
  <div v-if="name && handleGoBack" :style="namedStyle">
    <div :style="namedHeaderStyle">
      <Icon
        :class="'a74a-icon-active'"
        :path="iconPath"
      />
      <div :style="namedNameStyle">{{ name }}</div>
      <Icon
        v-if="!disabled"
        :class="'a74a-icon-active'"
        :path="mdi.mdiCloseBoxOutline"
        @click="handleGoBack"
        :style="{ marginLeft: 'auto' }"
      />
      <div v-else :class="'a74a-icon-active'" :style="{ marginLeft: 'auto' }" />
    </div>
    <div :style="namedLabelStyle">{{ label }}</div>
  </div>
  <template v-else>
    <span :id="`ss-${label}`" :class="className" @click="handleClick">
      <Icon :class="enabled ? 'a74a-icon-active' : 'a74a-icon'" :path="iconPath" />
    </span>
  </template>
</template>

<script setup>
import { computed } from 'vue'
import { useMemento } from '../../composables/useMemento.js'
import { defaultSearch } from './state.js'
import Icon from '../Icon.vue'
import * as mdi from '@mdi/js'

const props = defineProps({
  scope: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  toolTip: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  handleGoBack: {
    type: Function,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)

const enabled = computed(() => {
  return search.value.history.length > 1
    ? false
    : search.value.history[0].scope.split(' ').includes(props.scope)
})

const className = computed(() => {
  if (props.name) return 'a74a-named'
  return enabled.value
    ? 'a74a-scope-selector a74a-scope-selector-active'
    : 'a74a-scope-selector'
})

const iconPath = computed(() => {
  if (props.name) {
    return props.scope.match(/LINK/i) === null ? mdi.mdiFormatListBulletedType : mdi.mdiLinkVariant
  }
  return mdi[props.label]
})

const namedStyle = {
  width: '100%',
  border: '1px solid #e9746c',
  borderRadius: '2px',
  marginTop: '3px'
}

const namedHeaderStyle = {
  display: 'flex',
  gap: '2px',
  backgroundColor: '#e9746c',
  flexGrow: 1,
  color: 'white',
  justifyContent: 'space-between'
}

const namedNameStyle = {
  textTransform: 'uppercase',
  padding: '3px',
  fontWeight: 400,
  fontSize: '0.86rem'
}

const namedLabelStyle = {
  padding: '3px',
  fontWeight: 300,
  fontSize: '0.86rem'
}

const handleClick = () => {
  const findIndex = () => search.value.history.findIndex(entry => entry.scope === props.scope)
  const pop = () => search.value.history.slice(0, findIndex() + 1)
  const reset = () => [{ key: 'root', scope: props.scope, label: props.label }]
  const history = props.name ? pop : reset
  setSearch({ history: history(), filter: '' })
}
</script>

<style scoped>
@import './ScopeSwitcher.css';
</style>

