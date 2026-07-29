import { describe, expect, it, vi } from 'vitest'
import Draw from 'ol/interaction/Draw'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import EventEmitter from '../../shared/emitter'
import symbols2525c from '../../symbology/2525c.json'
import symbolsSkkm from '../../symbology/skkm.json'
import drawInteraction, { findDrawingStrategy } from './draw-interaction'

const nextTask = () => new Promise(resolve => {
  const defer = typeof setImmediate === 'function' ? setImmediate : setTimeout
  defer(resolve, 0)
})

describe('drawInteraction', () => {
  it('has a drawing strategy for every supported catalog descriptor', () => {
    const descriptors2525c = symbols2525c
      .filter(item => !item.unsupported)
      .map(item => ({
        ...item,
        geometry: { type: item.geometry, ...(item.parameters || {}) },
      }))
    const descriptorsSkkm = symbolsSkkm.map(item => ({
      ...item,
      geometry: { type: 'Point' },
    }))
    const unsupported = [...descriptors2525c, ...descriptorsSkkm]
      .filter(item => !findDrawingStrategy(item))
      .map(item => item.sidc)

    expect(unsupported).toEqual(['G*F*AXS---*****'])
  })

  it('activates a linear symbol draw and exposes visible cursor feedback', async () => {
    const emitter = new EventEmitter()
    const target = { style: { cursor: 'default' }, focus: vi.fn() }
    const map = {
      addInteraction: vi.fn(),
      removeInteraction: vi.fn(),
      getTargetElement: () => target,
    }
    const ready = vi.fn()
    const cancelled = vi.fn()
    emitter.on('ui/tactical/draw-ready', ready)
    emitter.on('ui/tactical/draw-cancelled', cancelled)

    drawInteraction({
      services: { emitter, store: { insertGeoJSON: vi.fn() } },
      map,
    })

    expect(
      emitter.emit('command/entry/draw', { id: 'symbol:G*F*LCC---' }),
    ).toBe(true)
    await nextTask()

    expect(map.addInteraction).toHaveBeenCalledOnce()
    expect(map.addInteraction.mock.calls[0][0]).toBeInstanceOf(Draw)
    expect(target.style.cursor).toBe('crosshair')
    expect(target.focus).toHaveBeenCalledOnce()
    await nextTask()
    expect(ready).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'symbol:G*F*LCC---',
        geometryType: 'LineString',
      }),
    )

    emitter.emit('command/draw/cancel', { originatorId: 'another-tool' })
    await nextTask()
    await nextTask()
    expect(map.removeInteraction).toHaveBeenCalledOnce()
    expect(cancelled).toHaveBeenCalledOnce()
    expect(target.style.cursor).toBe('default')
  })

  it('stores a completed point with its formatted SIDC', async () => {
    const emitter = new EventEmitter()
    const store = { insertGeoJSON: vi.fn() }
    const map = {
      addInteraction: vi.fn(),
      removeInteraction: vi.fn(),
      getTargetElement: () => ({ style: {}, focus: vi.fn() }),
    }
    const complete = vi.fn()
    emitter.on('ui/tactical/draw-complete', complete)

    drawInteraction({ services: { emitter, store }, map })
    emitter.emit('command/entry/draw', { id: 'symbol:S*G*UCI---' })
    await nextTask()

    const interaction = map.addInteraction.mock.calls[0][0]
    const feature = new Feature(new Point([10, 20]))
    interaction.dispatchEvent({ type: 'drawstart', feature })
    interaction.dispatchEvent({ type: 'drawend', feature })
    await nextTask()

    expect(store.insertGeoJSON).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [10, 20],
        },
        properties: expect.objectContaining({
          sidc: 'SFGPUCI---*****',
        }),
      }),
    ])
    expect(complete).toHaveBeenCalledOnce()
  })

  it('reports an invalid symbol instead of silently failing', async () => {
    const emitter = new EventEmitter()
    const drawError = vi.fn()
    emitter.on('ui/tactical/draw-error', drawError)
    drawInteraction({
      services: { emitter, store: {} },
      map: {
        addInteraction: vi.fn(),
        removeInteraction: vi.fn(),
        getTargetElement: () => ({ style: {}, focus: vi.fn() }),
      },
    })

    emitter.emit('command/entry/draw', { id: 'symbol:INVALID' })
    await nextTask()
    await nextTask()

    expect(drawError).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'symbol:INVALID',
        reason: 'symbol-not-found',
      }),
    )
  })
})
