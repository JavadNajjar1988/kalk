import { throttle } from 'throttle-debounce'
import * as ID from '../../ids'

/**
 *
 */
const sourceHandlers = (sources, layers) => {
  const { selectedSource } = sources
  const { featureLayer } = layers

  const updateOpacity = () => {
    const count = selectedSource.getFeatures().length
    featureLayer.setOpacity(count ? 0.35 : 1)
  }

  selectedSource.on('addfeature', updateOpacity)
  selectedSource.on('removefeature', updateOpacity)
}


/**
 *
 */
const capturePreview = map => {
  const draw = context => canvas => {
    if (canvas.width > 0) {
      const opacity = canvas.parentNode?.style?.opacity || canvas.style.opacity
      context.globalAlpha = opacity === '' ? 1 : Number(opacity)
      const transform = canvas.style.transform

      const match = transform?.match(/^matrix\(([^(]*)\)$/)
      const matrix = match
        ? match[1].split(',').map(Number)
        : [
            parseFloat(canvas.style.width) / canvas.width || 1,
            0,
            0,
            parseFloat(canvas.style.height) / canvas.height || 1,
            0,
            0,
          ]

      CanvasRenderingContext2D.prototype.setTransform.apply(context, matrix)
      context.drawImage(canvas, 0, 0)
    }
  }

  const canvas = document.createElement('canvas')
  const size = map.getSize()
  if (!size?.[0] || !size?.[1]) return null
  canvas.width = size[0]
  canvas.height = size[1]
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = '#eef2ef'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const list = map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer')
  Array.prototype.forEach.call(list, draw(context))

  try {
    const scale = Math.min(1, 960 / canvas.width, 540 / canvas.height)
    const previewCanvas = document.createElement('canvas')
    previewCanvas.width = Math.max(1, Math.round(canvas.width * scale))
    previewCanvas.height = Math.max(1, Math.round(canvas.height * scale))
    const previewContext = previewCanvas.getContext('2d')
    if (!previewContext) return null
    previewContext.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height)
    return previewCanvas.toDataURL('image/webp', 0.82)
  } catch (error) {
    console.warn('[map-preview] Snapshot capture skipped:', error)
    return null
  } finally {
    canvas.remove()
  }
}

const sendPreview = (services, map) => {
  const url = capturePreview(map)
  if (url) services.ipcRenderer.send('PREVIEW', url)
}

/**
 *
 */
const mapHandlers = (services, map) => {
  const { selection, osdDriver, dragAndDrop, emitter } = services
  services.ipcRenderer.setPreviewProvider?.(async () => {
    const view = map.getView()
    const resolution = view.getResolution()
    if (!resolution) {
      map.renderSync()
      return capturePreview(map)
    }

    const previewResolution = Math.min(
      resolution * 2,
      view.getMaxResolution() || resolution * 2
    )
    try {
      view.setResolution(previewResolution)
      map.renderSync()
      return capturePreview(map)
    } finally {
      view.setResolution(resolution)
      map.renderSync()
    }
  })

  map.addEventListener('keydown', event => {
    const { key } = event.originalEvent
    if (key === 'Escape') selection.set([])
  }, false)

  map.once('rendercomplete', ({ target }) => sendPreview(services, target))
  map.on('pointermove', throttle(75, event => osdDriver.pointermove(event)))

  // Deselect everything except features and markers.
  map.on('click', () => {
    const exclude = [ID.isFeatureId, ID.isMarkerId, ID.isMeasureId]
    const deselect = selection.selected(x => !exclude.some(p => p(x)))
    if (deselect.length) selection.deselect(deselect)
  })

  let resolution
  map.on('moveend', () => {
    const updated = map.getView().getResolution()
    if (updated !== resolution) {
      resolution = updated
      emitter.emit('view/resolution', { resolution })
    }
  })

  // Note: Neither dragstart nor dragend events are fired when dragging
  // a file into the browser from the OS.
  const target = document.getElementById('map')
  if (target) {
    target.addEventListener('dragenter', event => dragAndDrop.dragenter(event))
    target.addEventListener('dragleave', event => dragAndDrop.dragleave(event))
    target.addEventListener('dragover', event => dragAndDrop.dragover(event), false)
    target.addEventListener('drop', event => dragAndDrop.drop(event), false)
  }
}


/**
 *
 */
const ipcHandlers = (services, sources) => {
  const { ipcRenderer, selection } = services
  const { visibleSource } = sources

  const selectAll = () => {
    const element = document.activeElement
    const isBody = element => element.nodeName.toLowerCase() === 'body'
    const isMap = element => element.id === 'map'
    if (!element) return
    if (!isBody(element) && !isMap(element)) return

    const ids = visibleSource.getFeatures().map(feature => feature.getId())
    selection.select(ids)
  }

  ipcRenderer.on('EDIT_SELECT_ALL', selectAll)
}


const emitterHandlers = services => {
  const { emitter, selection, store } = services
  emitter.on('command/delete', () => store.delete(selection.selected()))
}


/**
 *
 */
export default options => {
  const { services, sources, vectorLayers, map } = options
  sourceHandlers(sources, vectorLayers)
  mapHandlers(services, map)
  ipcHandlers(services, sources)
  emitterHandlers(services)
}
