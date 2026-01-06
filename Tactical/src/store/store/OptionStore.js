import feature from './options/feature.js'
import layer from './options/layer.js'
import link from './options/link.js'
import symbol from './options/symbol.js'
import marker from './options/marker.js'
import tileService from './options/tile-service.js'
import bookmark from './options/bookmark.js'
import place from './options/place.js'
import measure from './options/measure.js'
import invited from './options/invited.js'

export default function OptionStore (coordinatesFormat, store, sessionStore) {
  this.coordinatesFormat = coordinatesFormat
  this.store = store
  this.sessionStore = sessionStore
}

OptionStore.prototype.feature = feature
OptionStore.prototype.layer = layer
OptionStore.prototype.link = link
OptionStore.prototype['link+layer'] = OptionStore.prototype.link
OptionStore.prototype['link+feature'] = OptionStore.prototype.link
OptionStore.prototype.symbol = symbol
OptionStore.prototype.marker = marker
OptionStore.prototype['tile-service'] = tileService
OptionStore.prototype.bookmark = bookmark
OptionStore.prototype.place = place
OptionStore.prototype.measure = measure
OptionStore.prototype.invited = invited
