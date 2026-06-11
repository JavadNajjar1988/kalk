import { EventEmitter } from 'events'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import GeometryCollection from 'ol/geom/GeometryCollection'
import Point from 'ol/geom/Point'
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
    const originalGeometry = writeGeometryObject(feature.getGeometry())

    const state = {
      'feature:test': {
        geometry: originalGeometry,
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

  it('uses the visible brush size for hit detection even when map hit tolerance is small', () => {
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
      hitTolerance: 1
    })

    emitter.emit('ERASE_FADE_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [2, 6]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [5, 6]))

    expect(state['feature:test'].properties.fadeZones).toBeDefined()
  })

  it('cuts a visual gap without shortening the tactical feature geometry', () => {
    const feature = new Feature(new LineString([[0, 0], [10, 0]]))
    feature.setId('feature:test')
    feature.set('sidc', 'G*G*GLB---')
    const originalGeometry = writeGeometryObject(feature.getGeometry())

    const state = {
      'feature:test': {
        geometry: originalGeometry,
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

    emitter.emit('ERASE_CUT_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [2, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [5, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerup', [5, 0], 0))

    expect(state['feature:test'].geometry).toEqual(originalGeometry)
    expect(state['feature:test'].properties.fadeZones).toContainEqual({
      from: 0.1875,
      to: 0.5125,
      opacity: 0
    })
  })

  it('does not erase the start of a collection when brushing over a helper point', () => {
    const feature = new Feature(new GeometryCollection([
      new LineString([[20, 0], [30, 0]]),
      new Point([0, 0])
    ]))
    feature.setId('feature:test')
    feature.set('sidc', 'G*G*GLB---')
    const originalGeometry = writeGeometryObject(feature.getGeometry())

    const state = {
      'feature:test': {
        geometry: originalGeometry,
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
      hitTolerance: 1
    })

    emitter.emit('ERASE_CUT_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [0, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerup', [0, 0], 0))

    expect(state['feature:test'].geometry).toEqual(originalGeometry)
    expect(state['feature:test'].properties.fadeZones).toBeUndefined()
  })

  it('records fade zones as timed tactical state while tactical geometry recording is enabled', () => {
    const feature = new Feature(new LineString([[0, 0], [10, 0]]))
    feature.setId('feature:test')
    feature.set('sidc', 'G*G*GLB---')

    const state = {
      'scenario:time': 100,
      'feature:test': {
        geometry: writeGeometryObject(feature.getGeometry()),
        properties: { sidc: feature.get('sidc') }
      },
      'timed+feature:feature:test': []
    }
    const store = {
      value: (key, fallback) => state[key] ?? fallback,
      update: (keys, valuesOrUpdater) => {
        keys.forEach((key, index) => {
          state[key] = typeof valuesOrUpdater === 'function'
            ? valuesOrUpdater(state[key])
            : valuesOrUpdater[index]
        })
      }
    }
    const emitter = new EventEmitter()
    const map = makeMap(feature)
    const interaction = eraseInteraction({
      services: { store, emitter },
      map,
      hitTolerance: 12,
      recordingStore: { isRecordingTacticalGeometry: true }
    })

    emitter.emit('ERASE_FADE_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [2, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [5, 0]))

    expect(state['feature:test'].properties.fadeZones).toBeUndefined()
    expect(state['timed+feature:feature:test']).toEqual([
      {
        t: 100,
        properties: {
          fadeZones: [
            { from: 0.1875, to: 0.21250000000000002, opacity: 0.15 },
            { from: 0.1875, to: 0.5125, opacity: 0.15 }
          ]
        }
      }
    ])
  })

  it('records fade zones between playback range markers when both markers are available', () => {
    const feature = new Feature(new LineString([[0, 0], [10, 0]]))
    feature.setId('feature:test')
    feature.set('sidc', 'G*G*GLB---')

    const state = {
      'feature:test': {
        geometry: writeGeometryObject(feature.getGeometry()),
        properties: { sidc: feature.get('sidc') }
      },
      'timed+feature:feature:test': []
    }
    const store = {
      value: (key, fallback) => state[key] ?? fallback,
      update: (keys, valuesOrUpdater) => {
        keys.forEach((key, index) => {
          state[key] = typeof valuesOrUpdater === 'function'
            ? valuesOrUpdater(state[key])
            : valuesOrUpdater[index]
        })
      }
    }
    const emitter = new EventEmitter()
    const map = makeMap(feature)
    const interaction = eraseInteraction({
      services: { store, emitter },
      map,
      hitTolerance: 12,
      recordingStore: { isRecordingTacticalGeometry: true },
      getScenarioTime: () => 150,
      getPlaybackRange: () => ({ start: 100, end: 200 })
    })

    emitter.emit('ERASE_FADE_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [2, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [5, 0]))

    expect(state['timed+feature:feature:test']).toEqual([
      {
        t: 100,
        properties: {
          fadeZones: [
            { from: 0.1875, to: 0.21250000000000002, opacity: 0.15 },
            { from: 0.1875, to: 0.5125, opacity: 0.15 }
          ]
        }
      },
      {
        t: 200,
        properties: {}
      }
    ])
  })
})
