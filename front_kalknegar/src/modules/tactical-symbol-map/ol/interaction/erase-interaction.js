import Interaction from 'ol/interaction/Interaction'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import RBush from 'ol/structs/RBush'
import * as Extent from 'ol/extent'
import * as style from 'ol/style'
import { closestOnSegment } from 'ol/coordinate'
import { pointer as pointerPick } from './modify/events'
import uuid from '../../shared/uuid'
import * as TS from '../ts'
import {
  positionOnFeature,
  mergeFadeZone,
  extractSubLine,
  toFadeBaseLine
} from '../style/fadeZones'
import { extractFadeZoneGeometry } from '../style/_applyFadeZones'

const ORIGINATOR_ID = uuid()

const scenarioTimeKey = 'scenario:time'
const timedFeatureKey = featureId => `timed+feature:${featureId}`
const FADE_OPACITY = 0.15
const DEFAULT_BRUSH_SIZE = 3
const MIN_STROKE = 0.004

const ERASABLE_FADE = new Set(['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'MultiPoint'])
const ERASABLE_CUT = new Set(['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'MultiPoint'])

const normalizeBrushSize = value => {
  const next = Number(value)
  if (!Number.isFinite(next)) return DEFAULT_BRUSH_SIZE
  return Math.max(1, Math.min(5, Math.round(next)))
}

const brushSpan = brushSize => 0.01 + normalizeBrushSize(brushSize) * 0.005

const brushCursorRadius = brushSize => 5 + normalizeBrushSize(brushSize) * 2

const brushCursorStyle = brushSize => new style.Style({
  image: new style.Circle({
    radius: brushCursorRadius(brushSize),
    stroke: new style.Stroke({ color: 'rgba(255,80,80,0.9)', width: 2 }),
    fill: new style.Fill({ color: 'rgba(255,80,80,0.15)' })
  })
})

const lineSegments = coordinates => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return []
  return coordinates.slice(1).map((coordinate, index) => {
    const vertices = [coordinates[index], coordinate]
    return {
      vertices,
      splittable: true,
      extent: Extent.boundingExtent(vertices)
    }
  })
}

const eraseSegments = geometry => {
  if (!geometry) return []
  switch (geometry.getType()) {
    case 'LineString':
      return lineSegments(geometry.getCoordinates())
    case 'MultiPoint':
      return lineSegments(geometry.getCoordinates())
    case 'MultiLineString':
      return geometry.getCoordinates().flatMap(lineSegments)
    case 'Polygon':
      return geometry.getCoordinates().flatMap(lineSegments)
    case 'MultiPolygon':
      return geometry.getCoordinates().flatMap(polygon => polygon.flatMap(lineSegments))
    case 'GeometryCollection':
      return geometry.getGeometriesArray().flatMap(eraseSegments)
    default:
      return []
  }
}

const writeEraseIndex = feature => {
  const rbush = new RBush()
  const segments = eraseSegments(feature.getGeometry())
  if (!segments.length) return rbush

  rbush.load(
    segments.map(segment => segment.extent),
    segments
  )
  return rbush
}

const previewStroke = mode => new style.Style({
  stroke: new style.Stroke({
    color: mode === 'cut' ? 'rgba(255,60,60,0.9)' : 'rgba(255,160,60,0.85)',
    width: 4,
    lineDash: [8, 6]
  })
})

const flattenStyleLike = styles => {
  if (!styles) return []
  if (Array.isArray(styles)) return styles.flatMap(flattenStyleLike)
  return [styles]
}

const hasPreviewPaint = styleEntry =>
  !!(styleEntry?.getStroke?.() || styleEntry?.getFill?.())

const styleGeometryDescriptor = (styleEntry, feature) => {
  if (!hasPreviewPaint(styleEntry)) return null
  const geometryFunction = styleEntry.getGeometryFunction?.()
  const geometry = geometryFunction ? geometryFunction(feature) : null
  if (!geometry) return null

  try {
    return {
      id: 'style:2525c/default-stroke',
      geometry: TS.read(geometry)
    }
  } catch {
    return null
  }
}

export const renderedFadePreviewGeometry = (feature, resolution, from, to) => {
  const styleFunction = feature?.getStyleFunction?.()
  const olGeometry = feature?.getGeometry?.()
  if (!styleFunction || !olGeometry) return null

  const renderedStyles = flattenStyleLike(styleFunction(feature, resolution))
  const descriptors = renderedStyles
    .map(styleEntry => styleGeometryDescriptor(styleEntry, feature))
    .filter(Boolean)

  if (!descriptors.length) return null

  try {
    return extractFadeZoneGeometry(descriptors, from, to, TS.read(olGeometry))
  } catch {
    return null
  }
}

const geometryKind = feature => {
  const geom = feature?.getGeometry()
  if (!geom) return null
  const type = geom.getType()
  if (type === 'GeometryCollection') {
    return toFadeBaseLine(TS.read(geom)) ? 'LineString' : null
  }
  return type
}

const isErasable = (feature, brushMode) => {
  const type = geometryKind(feature)
  if (!type) return false
  return brushMode === 'cut' ? ERASABLE_CUT.has(type) : ERASABLE_FADE.has(type)
}

const expandBrush = (minT, maxT, t, size) => {
  const half = brushSpan(size) / 2
  return [
    Math.max(0, Math.min(minT, t - half)),
    Math.min(1, Math.max(maxT, t + half))
  ]
}

const upsertTimedState = (states, next) => {
  const list = Array.isArray(states) ? [...states] : []
  const idx = list.findIndex(s => s && s.t === next.t)
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...next,
      properties: {
        ...(list[idx].properties || {}),
        ...(next.properties || {})
      }
    }
  } else {
    list.push(next)
  }
  list.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0))
  return list
}

export default options => {
  const { services, map, hitTolerance = 12, recordingStore } = options
  const { store, emitter } = services

  let mode = 'fade'
  let brushing = false
  let brushFeature = null
  let brushFrom = null
  let brushTo = null
  let brushSize = DEFAULT_BRUSH_SIZE
  let lastAppliedFrom = null
  let lastAppliedTo = null

  const overlaySource = new VectorSource({ useSpatialIndex: false })
  const overlayLayer = new VectorLayer({
    source: overlaySource,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
    zIndex: 25
  })

  const clearOverlay = () => {
    overlaySource.clear()
  }

  const showBrushCursor = coordinate => {
    const existing = overlaySource.getFeatureById('brush-cursor')
    if (!coordinate) {
      if (existing) overlaySource.removeFeature(existing)
      return
    }
    if (existing) {
      existing.getGeometry().setCoordinates(coordinate)
      existing.setStyle(brushCursorStyle(brushSize))
    } else {
      const feature = new Feature(new Point(coordinate))
      feature.setId('brush-cursor')
      feature.setStyle(brushCursorStyle(brushSize))
      overlaySource.addFeature(feature)
    }
  }

  const showPreview = (feature, from, to) => {
    const olGeom = feature.getGeometry()
    const jts = TS.read(olGeom)
    const baseLine = toFadeBaseLine(jts)
    if (!baseLine) return

    const sub = renderedFadePreviewGeometry(
      feature,
      map.getView()?.getResolution?.(),
      from,
      to
    ) || extractSubLine(TS.lengthIndexedLine(baseLine), from, to)
    if (!sub) return

    const olPreview = TS.write(sub)
    let preview = overlaySource.getFeatureById('brush-preview')
    if (!preview) {
      preview = new Feature(olPreview)
      preview.setId('brush-preview')
      preview.setStyle(previewStroke(mode))
      overlaySource.addFeature(preview)
    } else {
      preview.setGeometry(olPreview)
      preview.setStyle(previewStroke(mode))
    }
  }

  const resetBrush = () => {
    brushing = false
    brushFeature = null
    brushFrom = null
    brushTo = null
    lastAppliedFrom = null
    lastAppliedTo = null
    clearOverlay()
  }

  const pickOnFeature = (feature, event) => {
    const rbush = writeEraseIndex(feature)
    const pick = pointerPick({
      pixelTolerance: Math.max(hitTolerance, brushCursorRadius(brushSize))
    }, rbush, event).pick()
    if (!pick.coordinate) return null
    const coordinate = pick.segment?.vertices
      ? closestOnSegment(event.coordinate, pick.segment.vertices)
      : pick.coordinate
    const t = positionOnFeature(feature.getGeometry(), coordinate)
    if (t === null) return null
    return { coordinate, t }
  }

  const findFeatureAt = event => {
    const candidates = []
    map.forEachFeatureAtPixel(
      event.pixel,
      (feature, layer) => {
        if (layer?.get('selectable') && isErasable(feature, mode)) {
          candidates.push(feature)
        }
      },
      {
        hitTolerance: Math.max(hitTolerance, brushCursorRadius(brushSize)),
        layerFilter: layer => layer.get('selectable')
      }
    )

    if (!candidates.length) return null

    let best = null
    for (const feature of candidates) {
      const pick = pickOnFeature(feature, event)
      if (pick) {
        best = { feature, ...pick }
        break
      }
    }
    return best
  }

  const getScenarioTime = () => {
    if (typeof options.getScenarioTime === 'function') {
      const t = options.getScenarioTime()
      if (typeof t === 'number' && Number.isFinite(t)) return t
    }
    const t = store.value?.(scenarioTimeKey, Number.MIN_SAFE_INTEGER)
    return typeof t === 'number' && Number.isFinite(t)
      ? t
      : Number.MIN_SAFE_INTEGER
  }

  const getPlaybackRange = () => {
    if (typeof options.getPlaybackRange !== 'function') return null
    const range = options.getPlaybackRange()
    const start = Number(range?.start)
    const end = Number(range?.end)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return null
    return {
      start: Math.min(start, end),
      end: Math.max(start, end)
    }
  }

  const isTimedRecording = () => !!recordingStore?.isRecordingTacticalGeometry

  const persistTimedState = (feature, nextState, restoreState = null) => {
    const key = feature.getId()
    const timedKey = timedFeatureKey(key)
    const range = getPlaybackRange()
    const t = range?.start ?? getScenarioTime()
    const oldStates = store.value?.(timedKey, []) || []
    const update = states => {
      let nextStates = upsertTimedState(states, { t, ...nextState })
      if (range && restoreState) {
        nextStates = upsertTimedState(nextStates, { t: range.end, ...restoreState })
      }
      store.update([timedKey], [nextStates], [states])
    }
    if (typeof oldStates?.then === 'function') oldStates.then(update)
    else update(oldStates)
  }

  const persistFade = (feature, from, to, opacity = FADE_OPACITY) => {
    if (to - from < MIN_STROKE) return
    const key = feature.getId()
    const fadeZones = mergeFadeZone(feature.get('fadeZones'), {
      from,
      to,
      opacity
    })
    feature.set('fadeZones', fadeZones)
    if (isTimedRecording()) {
      persistTimedState(
        feature,
        { properties: { fadeZones } },
        { properties: {} }
      )
      feature.commit?.()
      return
    }
    store.update([key], value => ({
      ...value,
      properties: {
        ...value.properties,
        fadeZones
      }
    }))
    feature.commit?.()
  }

  const persistCut = (feature, from, to) => {
    if (to - from < MIN_STROKE) return
    persistFade(feature, from, to, 0)
  }

  const applyBrushRange = (feature, from, to, { preview = false } = {}) => {
    if (to - from < MIN_STROKE) return
    if (preview) {
      showPreview(feature, from, to)
      return
    }
    if (mode === 'cut') persistCut(feature, from, to)
    else persistFade(feature, from, to)
    emitter.emit('ui/erase/applied', { from, to, mode })
  }

  const extendBrush = (feature, t) => {
    const [from, to] = expandBrush(brushFrom, brushTo, t, brushSize)
    brushFrom = from
    brushTo = to

    if (mode === 'fade') {
      const grown = lastAppliedFrom === null ||
        from < lastAppliedFrom - 0.001 ||
        to > lastAppliedTo + 0.001
      if (grown) {
        applyBrushRange(feature, from, to)
        lastAppliedFrom = from
        lastAppliedTo = to
      }
      showPreview(feature, from, to)
    } else {
      showPreview(feature, from, to)
    }
  }

  const interaction = new Interaction({ handleEvent })

  function handleEvent (event) {
    if (!interaction.getActive()) return true

    if (event.type === 'pointermove' && !brushing) {
      const hit = findFeatureAt(event)
      showBrushCursor(hit?.coordinate ?? null)
      return true
    }

    if (event.type === 'pointerdown' && event.originalEvent?.buttons === 1) {
      const hit = findFeatureAt(event)
      if (!hit) return true

      event.stopPropagation()
      brushing = true
      brushFeature = hit.feature
      brushFrom = hit.t
      brushTo = hit.t
      lastAppliedFrom = null
      lastAppliedTo = null
      extendBrush(hit.feature, hit.t)
      showBrushCursor(hit.coordinate)
      return false
    }

    const isBrushingMove =
      brushing &&
      brushFeature &&
      (event.type === 'pointerdrag' ||
        (event.type === 'pointermove' && event.originalEvent?.buttons === 1))

    if (isBrushingMove) {
      event.stopPropagation()
      const pick = pickOnFeature(brushFeature, event)
      if (pick) {
        extendBrush(brushFeature, pick.t)
        showBrushCursor(pick.coordinate)
      }
      return false
    }

    if (event.type === 'pointerup' && brushing && brushFeature) {
      event.stopPropagation()
      if (mode === 'cut' && brushFrom !== null && brushTo !== null) {
        applyBrushRange(brushFeature, brushFrom, brushTo)
      }
      resetBrush()
      return false
    }

    return true
  }

  interaction.setMode = nextMode => {
    mode = nextMode === 'cut' ? 'cut' : 'fade'
    resetBrush()
  }

  interaction.getMode = () => mode

  interaction.setBrushSize = nextBrushSize => {
    brushSize = normalizeBrushSize(nextBrushSize)
    const cursor = overlaySource.getFeatureById('brush-cursor')
    if (cursor) cursor.setStyle(brushCursorStyle(brushSize))
  }

  interaction.getBrushSize = () => brushSize

  interaction.cancel = () => resetBrush()

  const baseSetMap = interaction.setMap.bind(interaction)
  interaction.setMap = mapInstance => {
    baseSetMap(mapInstance)
    overlayLayer.setMap(mapInstance)
  }

  emitter.on('ERASE_FADE_START', options => {
    emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    interaction.setBrushSize(options?.brushSize)
    interaction.setMode('fade')
    interaction.setActive(true)
    emitter.emit('ui/erase/active', { mode: 'fade', brushSize })
  })

  emitter.on('ERASE_CUT_START', options => {
    emitter.emit('command/draw/cancel', { originatorId: ORIGINATOR_ID })
    interaction.setBrushSize(options?.brushSize)
    interaction.setMode('cut')
    interaction.setActive(true)
    emitter.emit('ui/erase/active', { mode: 'cut', brushSize })
  })

  emitter.on('command/erase/brush-size', options => {
    interaction.setBrushSize(options?.brushSize)
    if (interaction.getActive()) {
      emitter.emit('ui/erase/active', { mode, brushSize })
    }
  })

  emitter.on('command/erase/cancel', () => {
    interaction.setActive(false)
    resetBrush()
    emitter.emit('ui/erase/inactive')
  })

  emitter.on('command/draw/cancel', ({ originatorId }) => {
    if (originatorId === ORIGINATOR_ID) return
    if (interaction.getActive()) {
      interaction.setActive(false)
      resetBrush()
      emitter.emit('ui/erase/inactive')
    }
  })

  return interaction
}
