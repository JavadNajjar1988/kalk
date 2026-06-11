import Signal from '@syncpoint/signal'
import styles from './corridor-styles/index'
import graphics from './graphics'
import * as TS from '../ts'
import { PI_OVER_2 } from '../../shared/Math'

import _context from './_context'
import _shape from './_shape'
import _selection from './_selection'

const normalizeCorridorGeometry = (geometry, resolution) => {
  if (!geometry) return geometry

  const type = typeof geometry.getGeometryType === 'function'
    ? geometry.getGeometryType()
    : null

  let lineString
  let point

  if (type === 'GeometryCollection') {
    const parts = TS.geometries(geometry)
    lineString = parts.find(g => g.getGeometryType() === 'LineString')
    point = parts.find(g => g.getGeometryType() === 'Point')
  } else if (type === 'LineString') {
    lineString = geometry
  } else {
    return geometry
  }

  if (lineString && point) return TS.collect([lineString, point])
  if (!lineString) return geometry

  const segments = TS.segments(lineString)
  if (!segments.length) return geometry

  const minLength = Math.min(...segments.map(segment => segment.getLength()))
  const width = Math.min(minLength / 2, resolution * 50)
  const start = TS.coordinate(TS.startPoint(lineString))
  const angle = segments[0].angle() - PI_OVER_2
  const pointCoord = TS.projectCoordinate(start)([angle, width / 2])
  const generatedPoint = TS.point(pointCoord)

  return TS.collect([lineString, generatedPoint])
}

const lineFromCorridor = geometry => {
  if (!geometry) return null
  const parts = TS.geometries(geometry)
  return parts.find(part => part.getGeometryType() === 'LineString') || null
}

const specifics = $ => {
  $.corridorGeometry = Signal.link(normalizeCorridorGeometry, [$.jtsGeometry, $.resolution])
  $.fadeBaseGeometry = $.corridorGeometry.map(lineFromCorridor)
  $.context = Signal.link(_context, [$.corridorGeometry, $.resolution])
  $.shape = $.context.ap($.parameterizedSIDC.map(_shape(styles)))
  $.selection = Signal.link(_selection, [$.selectionMode, $.corridorGeometry])
  $.labels = Signal.of([])
}

export default graphics(specifics)
