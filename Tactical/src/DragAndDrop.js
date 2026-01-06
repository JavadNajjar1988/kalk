import * as R from 'ramda'
import util from 'util'
import { reproject } from 'reproject'
import Emitter from './shared/emitter.js'
import * as ID from './ids.js'
import { CONTENT_TYPE } from './renderer/Clipboard.js'
import { clone } from './model/Import.js'

const extname = filename => {
  const index = filename.lastIndexOf('.')
  return index >= 0 ? filename.substring(index) : ''
}

const basename = (filename, extension) =>
  filename.endsWith(extension) ? filename.slice(0, -extension.length) : filename

const readFileText = file => {
  // Modern browsers and Electron support File.text()
  if (file && typeof file.text === 'function') return file.text()

  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const readJSONFile = async file => {
  const content = await readFileText(file)
  return JSON.parse(content)
}

/**
 * @constructor
 * @fires ...
 */
export function DragAndDrop (store) {
  Emitter.call(this)
  this.store = store
}

util.inherits(DragAndDrop, Emitter)

DragAndDrop.prototype.dragenter = function (event) {}
DragAndDrop.prototype.dragleave = function (event) {}

DragAndDrop.prototype.dragover = function (event) {
  event.preventDefault()
  event.stopPropagation()
}

DragAndDrop.prototype.drop = async function (event) {
  event.preventDefault()
  event.stopPropagation()

  const files = [...event.dataTransfer.files]
  const extensions = R.groupBy(file => extname(file.name), files)
  Object.entries(extensions).forEach(([extension, files]) => {
    const key = extension.substring(1)
    if (this[key]) this[key](files)
  })
}

DragAndDrop.prototype.json = async function (files) {

  const geoJSON = await Promise.all(files.map(readJSONFile))

  /*  treat dropped files the same way as if they were copied/pasted */
  const natives = geoJSON.filter(json => json.contentType === CONTENT_TYPE)
  if (natives.length > 0) {
    const defaultLayerId = await this.store.defaultLayerId()
    const imports = await Promise.all(natives.map(native => clone(defaultLayerId, native.entries)))
    this.store.insert(imports.flat())
  }

  /* plain old geoJSON */
  const featureCollections = geoJSON.filter(json => json.type === 'FeatureCollection')

  const tuples = featureCollections.flatMap((collection, index) => {
    const tuples = []

    // Layer.
    const name = basename(files[index].name, '.json')
    const layerId = ID.layerId()
    const value = { name: collection.name || name }
    tuples.push([layerId, value])

    // Features.
    const features = collection.features.map(feature => {
      const featureId = ID.featureId(layerId)
      const { type, geometry } = feature
      // drop properties: layerId, locked, hidden
      const { layerId: _, title, name, locked, hidden, ...properties } = feature.properties
      const value = {
        type,
        properties,
        geometry: reproject(geometry, 'EPSG:4326', 'EPSG:3857')
      }

      if (name || title) value.name = name || title
      return [featureId, value]
    })

    return tuples.concat(features)
  })

  this.store.insert(tuples)
}
