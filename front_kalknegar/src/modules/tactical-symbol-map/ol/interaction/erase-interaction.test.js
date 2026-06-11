import { EventEmitter } from 'events'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { describe, expect, it } from 'vitest'
import eraseInteraction from './erase-interaction'
import { writeGeometryObject } from '../../ol/format'

const selectableLayer = {
  get: key => key === 'selectable'
}

const makeMap = feature => ({
  getView: () => ({ getResolution: () => 1 }),
  getPixelFromCoordinate: coordinate => coordinate,
  forEachFeatureAtPixel: (_pixel, callback) => callback(feature, selectableLayer)
})

const pointerEvent = (map, type, coordinate, buttons = 1) => ({
  type,
  map,
  pixel: coordinate,
  coordinate,
  originalEvent: { buttons },
  stopPropagation: () => {}
})

describe('eraseInteraction', () => {
  it('persists fade zones while brushing a line feature', () => {
    const feature = new Feature(new LineString([[0, 0], [10, 0]]))
    feature.setId('feature:test')
    feature.set('sidc', 'G*G*GLB---')

    const state = {
      'feature:test': {
        geometry: writeGeometryObject(feature.getGeometry()),
        properties: { sidc: feature.get('sidc') }
      }
    }
    const store = {
      update: (keys, updater) => {
        keys.forEach(key => {
          state[key] = updater(state[key])
        })
      }
    }
    const emitter = new EventEmitter()
    const map = makeMap(feature)
    const interaction = eraseInteraction({
      services: { store, emitter },
      map,
      hitTolerance: 12
    })

    emitter.emit('ERASE_FADE_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [2, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [5, 0]))

    expect(state['feature:test'].properties.fadeZones).toContainEqual({
      from: 0.1875,
      to: 0.5125,
      opacity: 0.15
    })
  })
})
