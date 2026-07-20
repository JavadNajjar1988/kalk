<template>
  <div class="a74a-taglist">
    <ScopeSwitch
      v-for="[scope, label] in scopes"
      :key="scope"
      :scope="scope"
      :label="label"
      :toolTip="tooltips[scope]"
    />
    <ScopeSwitch
      v-for="({ key, label, scope }, index) in childSwitches"
      :key="key"
      :scope="scope"
      :name="nameFromKey(key)"
      :label="label"
      :handleGoBack="handleGoBack"
      :disabled="childSwitches.length > 1 && index < childSwitches.length - 1"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMemento } from '../../composables/useMemento.js'
import { defaultSearch } from './state.js'
import * as ID from '../../ids.js'
import * as R from 'ramda'
import ScopeSwitch from './ScopeSwitch.vue'
import './ScopeSwitcher.css'

const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)

const SCOPES = {
  [`@${ID.LAYER}`]: 'mdiLayersTriple',
  [`@${ID.FEATURE}`]: 'mdiFormatListBulletedType',
  [`@${ID.LINK}`]: 'mdiLinkVariant',
  '#pin': 'mdiPinOutline',
  [`@${ID.SYMBOL}`]: 'mdiShapePlusOutline',
  [`@${ID.MARKER}`]: 'mdiCrosshairs',
  [`@${ID.BOOKMARK}`]: 'mdiBookmarkOutline',
  [`@${ID.PLACE}`]: 'mdiSearchWeb',
  [`@${ID.TILE_SERVICE}`]: 'mdiEarth',
  [`@${ID.MEASURE}`]: 'mdiAndroidStudio',
  [`@${ID.INVITED}`]: 'mdiCloudPlusOutline'
}

const TOOLTIPS = {
  '#pin': 'Manage pinned items',
  [`@${ID.LAYER}`]: 'Manage existing layers',
  [`@${ID.FEATURE}`]: 'Manage existing features',
  [`@${ID.LINK}`]: 'Manage existing links',
  [`@${ID.SYMBOL}`]: 'Create new features based on the symbol palette',
  [`@${ID.MARKER}`]: 'Manage existing markers',
  [`@${ID.BOOKMARK}`]: 'Manage existing bookmarks',
  [`@${ID.PLACE}`]: 'Search for addresses based on OSM (online only)',
  [`@${ID.TILE_SERVICE}`]: 'Manage existing tile services for maps',
  [`@${ID.MEASURE}`]: 'Manage existing measurements',
  [`@${ID.INVITED}`]: 'Show invitations and join shared layers'
}

const scopes = computed(() => Object.entries(SCOPES))

const tooltips = TOOLTIPS

const childSwitches = computed(() => {
  return R.drop(1, search.value.history)
})

const nameFromKey = (key) => {
  return ID.scope(key)
}

const setHistory = (history) => {
  setSearch({ filter: '', history })
}

const handleGoBack = () => {
  setHistory(R.dropLast(1, search.value.history))
}
</script>

<style scoped>
@import './ScopeSwitcher.css';
</style>

