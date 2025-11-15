import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'

/**
 *
 */
const CreateLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'ایجاد لایه'
  this.path = 'mdiLayersTriple'
}

CreateLayer.prototype.execute = async function () {
  const key = ID.layerId()
  await this.store.insert([[key, { name: `لایه - ${militaryFormat.now()}` }]])
  this.selection.focus(key)
}

/**
 *
 */
const CreateTileService = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'ایجاد سرویس نقشه'
  this.path = 'mdiEarth'
}

CreateTileService.prototype.execute = function () {
  const key = ID.tileServiceId()
  this.store.insert([[key, { type: 'OSM', url: '', name: '' }]])
  this.selection.focus(key)
}


/**
 *
 */
const CreateMarker = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.sessionStore = services.sessionStore
  this.label = 'ایجاد نشانگر'
  this.path = 'mdiCrosshairs'
}

CreateMarker.prototype.execute = async function () {
  const viewport = await this.sessionStore.get('viewport')
  const key = ID.markerId()
  const value = {
    name: `نشانگر - ${militaryFormat.now()}`,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: viewport.center
    }
  }

  this.store.insert([[key, value]])
  this.selection.focus(key)
}


/**
 *
 */
const CreateBookmark = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.sessionStore = services.sessionStore
  this.label = 'ایجاد نشانک'
  this.path = 'mdiBookmarkOutline'
}

CreateBookmark.prototype.execute = async function () {
  const viewport = await this.sessionStore.get('viewport')
  const key = ID.bookmarkId()
  const name = `نشانک - ${militaryFormat.now()}`
  const value = { name, ...viewport }
  this.store.insert([[key, value]])
  this.selection.focus(key)
}

/**
 *
 */
export default services => ({
  LAYER_CREATE: new CreateLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services),
  MARKER_CREATE: new CreateMarker(services),
  BOOKMARK_CREATE: new CreateBookmark(services)
})
