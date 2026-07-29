import { describe, expect, it, vi } from 'vitest'
import Draw from 'ol/interaction/Draw'
import EventEmitter from '../../shared/emitter'
import drawInteraction from './draw-interaction'

const nextTask = () => new Promise(resolve => setTimeout(resolve, 0))

describe('drawInteraction', () => {
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
    expect(map.removeInteraction).toHaveBeenCalledOnce()
    expect(cancelled).toHaveBeenCalledOnce()
    expect(target.style.cursor).toBe('default')
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
