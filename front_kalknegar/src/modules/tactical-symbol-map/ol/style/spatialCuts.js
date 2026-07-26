import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import * as TS from '../ts'

const validCoordinate = coordinate =>
  Array.isArray(coordinate) &&
  coordinate.length >= 2 &&
  Number.isFinite(coordinate[0]) &&
  Number.isFinite(coordinate[1])

export const normalizeSpatialCuts = cuts => {
  if (!Array.isArray(cuts)) return []
  return cuts
    .filter(cut => cut && Array.isArray(cut.coordinates))
    .map(cut => ({
      coordinates: cut.coordinates.filter(validCoordinate).map(coordinate => [
        coordinate[0],
        coordinate[1]
      ]),
      radius: Number.isFinite(cut.radius) ? Math.max(0, cut.radius) : 0,
      gesture: typeof cut.gesture === 'string' ? cut.gesture : undefined
    }))
    .filter(cut => cut.coordinates.length > 0 && cut.radius > 0)
}

export const mergeSpatialCut = (cuts, cut) => {
  const normalized = normalizeSpatialCuts(cuts)
  const [next] = normalizeSpatialCuts([cut])
  if (!next) return normalized

  const previous = normalized[normalized.length - 1]
  if (previous && previous.gesture && previous.gesture === next.gesture) {
    previous.coordinates.push(...next.coordinates)
    previous.radius = Math.max(previous.radius, next.radius)
    return normalized
  }

  normalized.push(next)
  return normalized
}

const maskRadius = (cut, read) => {
  const [x, y] = cut.coordinates[0]
  const measure = read(
    new LineString([
      [x, y],
      [x + cut.radius, y]
    ])
  )
  return measure?.getLength?.() ?? 0
}

const cutMask = (cut, read) => {
  const olGeometry =
    cut.coordinates.length === 1
      ? new Point(cut.coordinates[0])
      : new LineString(cut.coordinates)
  const geometry = read(olGeometry)
  const radius = maskRadius(cut, read)
  if (!geometry || radius <= 0) return null
  return TS.simpleBuffer(geometry)(radius)
}

const hasGeometry = geometry =>
  geometry &&
  typeof geometry.getNumPoints === 'function' &&
  geometry.getNumPoints() > 0

export default (styles, cuts, read) => {
  if (!Array.isArray(styles) || typeof read !== 'function') return styles
  const masks = normalizeSpatialCuts(cuts)
    .map(cut => cutMask(cut, read))
    .filter(Boolean)
  if (!masks.length) return styles

  return styles.flatMap(entry => {
    if (!entry?.geometry) return [entry]
    try {
      const geometry = TS.difference([entry.geometry, ...masks])
      return hasGeometry(geometry) ? [{ ...entry, geometry }] : []
    } catch {
      return [entry]
    }
  })
}
