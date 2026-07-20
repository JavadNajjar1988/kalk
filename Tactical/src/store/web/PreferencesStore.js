import Emitter from '../../shared/emitter.js'

const STORAGE_KEY = 'odin:web:preferences'
const COORDINATES_FORMAT = 'coordinates-format'
const GRATICULE = 'graticule'
const TILE_LAYERS = 'tile-layers'

/**
 * PreferencesStore for Web - localStorage based
 */
export default function PreferencesStore() {
  Emitter.call(this)
  this.preferences = this.loadPreferences()
}

// Inherit from Emitter
PreferencesStore.prototype = Object.create(Emitter.prototype)
PreferencesStore.prototype.constructor = PreferencesStore

PreferencesStore.prototype.loadPreferences = function() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

PreferencesStore.prototype.savePreferences = function() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences))
}

PreferencesStore.prototype.put = async function(key, value) {
  this.preferences[key] = value
  this.savePreferences()
  this.emit(key, { value })
}

PreferencesStore.prototype.get = async function(key, defaultValue) {
  return this.preferences[key] !== undefined ? this.preferences[key] : defaultValue
}

PreferencesStore.prototype.del = async function(key) {
  delete this.preferences[key]
  this.savePreferences()
  this.emit(key, { value: undefined })
}

PreferencesStore.prototype.setCoordinatesFromat = async function(format) {
  await this.put(COORDINATES_FORMAT, format)
  this.emit('coordinatesFormatChanged', { format })
}

PreferencesStore.prototype.setGraticule = async function(type, checked) {
  if (!checked) await this.del(GRATICULE)
  else await this.put(GRATICULE, type)
  this.emit('graticuleChanged', { type, checked })
}

PreferencesStore.prototype.showSidebar = function(checked) {
  this.put('ui.sidebar.showing', checked)
}

PreferencesStore.prototype.showToolbar = function(checked) {
  this.put('ui.toolbar.showing', checked)
}

PreferencesStore.prototype.getCoordinatesFormat = async function() {
  return this.get(COORDINATES_FORMAT, 'DMS')
}

PreferencesStore.prototype.getGraticule = async function() {
  return this.get(GRATICULE)
}

PreferencesStore.prototype.getTileLayers = async function() {
  return this.get(TILE_LAYERS, [])
}

PreferencesStore.prototype.setTileLayers = async function(layers) {
  await this.put(TILE_LAYERS, layers)
}

PreferencesStore.prototype.getSidebarShowing = async function() {
  return this.get('ui.sidebar.showing', true)
}

PreferencesStore.prototype.getToolbarShowing = async function() {
  return this.get('ui.toolbar.showing', true)
}

