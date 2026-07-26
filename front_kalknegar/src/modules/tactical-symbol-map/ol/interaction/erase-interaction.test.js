import { EventEmitter } from 'events'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import MultiPoint from 'ol/geom/MultiPoint'
import GeometryCollection from 'ol/geom/GeometryCollection'
import Point from 'ol/geom/Point'
import { Style, Stroke } from 'ol/style'
import { describe, expect, it } from 'vitest'
import eraseInteraction, { renderedFadePreviewGeometry } from './erase-interaction'
import { writeGeometryObject } from '../../ol/format'

const selectableLayer = {
  get: key => key === 'selectable'
}

const makeMap = (featureOrFeatures, resolution = 0.01) => ({
  getView: () => ({ getResolution: () => resolution }),
  getPixelFromCoordinate: coordinate => coordinate,
  forEachFeatureAtPixel: (_pixel, callback) => {
    const features = Array.isArray(featureOrFeatures)
      ? featureOrFeatures
      : [featureOrFeatures]
    features.forEach(feature => callback(feature, selectableLayer))
  }
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
  it('builds brush preview from the rendered symbol geometry', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [30, 0]
      ])
    )
    feature.setStyle(
      new Style({
        geometry: new GeometryCollection([
          new LineString([
            [10, 0],
            [15, 5],
            [20, 0]
          ])
        ]),
        stroke: new Stroke({ color: 'black', width: 2 })
      })
    )

    const preview = renderedFadePreviewGeometry(feature, 1, 0.4, 0.6)
    const parts =
      preview.getGeometryType() === 'GeometryCollection'
        ? preview.getGeometries()
        : [preview]

    expect(
      parts.map(geometry =>
        geometry
          .getCoordinates()
          .map(coord => [Number(coord.x.toFixed(2)), Number(coord.y.toFixed(2))])
      )
    ).toEqual([
      [
        [12, 2],
        [15, 5],
        [18, 2]
      ]
    ])
  })

  it('persists fade zones while brushing a line feature', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0]
      ])
    )
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

    expect(state['feature:test'].properties.fadeZones).toHaveLength(1)
    expect(state['feature:test'].properties.fadeZones[0]).toMatchObject({
      opacity: 0.15
    })
    expect(state['feature:test'].properties.fadeZones[0].from).toBeCloseTo(0.189)
    expect(state['feature:test'].properties.fadeZones[0].to).toBeCloseTo(0.511)
  })

  it('uses the visible brush size for hit detection even when map hit tolerance is small', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0]
      ])
    )
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
    const map = makeMap(feature, 1)
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

  it('persists fade zones while brushing a MultiPoint tactical graphic', () => {
    const feature = new Feature(
      new MultiPoint([
        [0, 0],
        [10, 0],
        [20, 5]
      ])
    )
    feature.setId('feature:test')
    feature.set('sidc', 'G*T*Q-----')

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
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [5, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [10, 0]))

    expect(state['feature:test'].properties.fadeZones).toBeDefined()
  })

  it('cuts a visual gap without shortening the tactical feature geometry', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0]
      ])
    )
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
    expect(state['feature:test'].properties.fadeZones).toBeUndefined()
    expect(state['feature:test'].properties.spatialCuts).toHaveLength(1)
    expect(state['feature:test'].properties.spatialCuts[0].coordinates).toEqual([
      [2, 0],
      [2, 0],
      [5, 0]
    ])
    expect(state['feature:test'].properties.spatialCuts[0].radius).toBeCloseTo(0.11)
  })

  it('only cuts a small local section when the symbol is shorter than the pixel brush', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [0.05, 0]
      ])
    )
    feature.setId('feature:short')
    feature.set('sidc', 'G*G*GLB---')

    const state = {
      'feature:short': {
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
    const map = makeMap(feature, 0.01)
    const interaction = eraseInteraction({
      services: { store, emitter },
      map,
      hitTolerance: 12
    })

    emitter.emit('ERASE_CUT_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [0.025, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerup', [0.025, 0], 0))

    const cut = state['feature:short'].properties.spatialCuts?.[0]
    expect(cut.coordinates).toEqual([[0.025, 0]])
    expect(cut.radius).toBeCloseTo(0.000625)
  })

  it('does not erase the start of a collection when brushing over a helper point', () => {
    const feature = new Feature(
      new GeometryCollection([
        new LineString([
          [20, 0],
          [30, 0]
        ]),
        new Point([0, 0])
      ])
    )
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

  it('cuts every overlapping tactical feature under the brush', () => {
    const features = ['a', 'b'].map(id => {
      const feature = new Feature(
        new LineString([
          [0, 0],
          [10, 0]
        ])
      )
      feature.setId(`feature:${id}`)
      feature.set('sidc', 'G*G*GLB---')
      return feature
    })
    const state = Object.fromEntries(
      features.map(feature => [
        feature.getId(),
        {
          geometry: writeGeometryObject(feature.getGeometry()),
          properties: { sidc: feature.get('sidc') }
        }
      ])
    )
    const store = {
      update: (keys, updater) => {
        keys.forEach(key => {
          state[key] = updater(state[key])
        })
      }
    }
    const emitter = new EventEmitter()
    const map = makeMap(features)
    const interaction = eraseInteraction({
      services: { store, emitter },
      map,
      hitTolerance: 12
    })

    emitter.emit('ERASE_CUT_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [2, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerdrag', [5, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerup', [5, 0], 0))

    expect(state['feature:a'].properties.spatialCuts).toHaveLength(1)
    expect(state['feature:b'].properties.spatialCuts).toHaveLength(1)
  })

  it('cuts a rendered symbol stroke even when it is away from the control geometry', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [30, 0]
      ])
    )
    feature.setId('feature:rendered')
    feature.set('sidc', 'G*G*GLB---')
    feature.setStyle(
      new Style({
        geometry: new LineString([
          [10, 20],
          [20, 20]
        ]),
        stroke: new Stroke({ color: 'black', width: 2 })
      })
    )
    const state = {
      'feature:rendered': {
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

    emitter.emit('ERASE_CUT_START', { brushSize: 3 })
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [15, 20]))
    interaction.handleEvent(pointerEvent(map, 'pointerup', [15, 20], 0))

    expect(state['feature:rendered'].properties.spatialCuts?.[0]?.coordinates).toEqual([
      [15, 20]
    ])
  })

  it('replaces legacy whole-symbol cut zones when making a precise spatial cut', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0]
      ])
    )
    feature.setId('feature:legacy-cut')
    feature.set('sidc', 'G*G*GLB---')
    feature.set('fadeZones', [{ from: 0, to: 1, opacity: 0 }])
    const state = {
      'feature:legacy-cut': {
        geometry: writeGeometryObject(feature.getGeometry()),
        properties: {
          sidc: feature.get('sidc'),
          fadeZones: feature.get('fadeZones')
        }
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
    interaction.handleEvent(pointerEvent(map, 'pointerdown', [5, 0]))
    interaction.handleEvent(pointerEvent(map, 'pointerup', [5, 0], 0))

    expect(state['feature:legacy-cut'].properties.fadeZones).toBeUndefined()
    expect(state['feature:legacy-cut'].properties.spatialCuts).toHaveLength(1)
  })

  it('records fade zones as timed tactical state while tactical geometry recording is enabled', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0]
      ])
    )
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
          state[key] =
            typeof valuesOrUpdater === 'function'
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
          fadeZones: [{ from: 0.189, to: 0.511, opacity: 0.15 }]
        }
      }
    ])
  })

  it('records fade zones between playback range markers when both markers are available', () => {
    const feature = new Feature(
      new LineString([
        [0, 0],
        [10, 0]
      ])
    )
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
          state[key] =
            typeof valuesOrUpdater === 'function'
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
          fadeZones: [{ from: 0.189, to: 0.511, opacity: 0.15 }]
        }
      },
      {
        t: 200,
        properties: {}
      }
    ])
  })
})
