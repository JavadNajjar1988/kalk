import feature from './documents/feature.js'
import layer from './documents/layer.js'
import link from './documents/link.js'
import symbol from './documents/symbol.js'
import marker from './documents/marker.js'
import tileService from './documents/tile-service.js'
import bookmark from './documents/bookmark.js'
import place from './documents/place.js'
import measure from './documents/measure.js'
import invited from './documents/invited.js'

export default function DocumentStore (store) {
  this.store = store
}

DocumentStore.prototype.feature = feature
DocumentStore.prototype.layer = layer
DocumentStore.prototype.link = link
DocumentStore.prototype['link+layer'] = DocumentStore.prototype.link
DocumentStore.prototype['link+feature'] = DocumentStore.prototype.link
DocumentStore.prototype.symbol = symbol
DocumentStore.prototype.marker = marker
DocumentStore.prototype.measure = measure
DocumentStore.prototype['tile-service'] = tileService
DocumentStore.prototype.bookmark = bookmark
DocumentStore.prototype.place = place
DocumentStore.prototype.invited = invited
