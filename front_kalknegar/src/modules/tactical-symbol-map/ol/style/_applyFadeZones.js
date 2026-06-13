import {
  normalizeFadeZones,
  splitByOpacity,
  toFadeBaseLine,
  positionOnGeometry,
  opacityAt,
  extractSubGeometry
} from './fadeZones'
import * as TS from '../ts'

const geometryType = geometry =>
  geometry && typeof geometry.getGeometryType === 'function'
    ? geometry.getGeometryType()
    : null

const isLineLike = geometry => {
  const type = geometryType(geometry)
  return type === 'LineString' || type === 'LinearRing'
}

const isPoint = geometry => geometryType(geometry) === 'Point'

const isStrokeEntry = entry => {
  const id = entry?.id || ''
  return id.endsWith('-stroke') || id === 'style:wasp-stroke' || id === 'style:guide-stroke'
}

const isFillEntry = entry => {
  const id = entry?.id || ''
  return id.endsWith('-fill')
}

const isPolygonLike = geometry => {
  const type = geometryType(geometry)
  return type === 'Polygon' || type === 'MultiPolygon'
}

const isMultiLineString = geometry => geometryType(geometry) === 'MultiLineString'

const isGeometryCollection = geometry => geometryType(geometry) === 'GeometryCollection'

const isCollectionSegmentEntry = entry => isStrokeEntry(entry) || isFillEntry(entry)

const shouldSegment = (entry, geometry) =>
  isLineLike(geometry) ||
  isMultiLineString(geometry) ||
  (isGeometryCollection(geometry) && isCollectionSegmentEntry(entry)) ||
  (isPolygonLike(geometry) && isStrokeEntry(entry))

const withOpacity = (entry, opacity) => {
  if (opacity >= 1) return entry
  return {
    ...entry,
    'line-opacity': opacity,
    'shape-opacity': opacity,
    'icon-opacity': opacity
  }
}

const hasDrawableCoordinates = geometry => {
  const coords = typeof geometry?.getCoordinates === 'function'
    ? geometry.getCoordinates()
    : []
  return coords.length >= 2
}

const isSegmentLineGeometry = geometry => {
  const type = geometryType(geometry)
  return type === 'LineString' || type === 'LinearRing' || type === 'MultiLineString'
}

const representativeCoordinate = geometry => {
  if (!geometry) return null
  if (isPoint(geometry)) return TS.coordinate(geometry)
  if (typeof geometry.getCentroid === 'function') {
    const centroid = geometry.getCentroid()
    if (centroid) return TS.coordinate(centroid)
  }
  const coords = typeof geometry.getCoordinates === 'function'
    ? geometry.getCoordinates()
    : []
  return coords[Math.floor(coords.length / 2)] || null
}

const isWithinSegment = (t, segment) =>
  t >= segment.from && (t < segment.to || segment.to === 1)

const collectGeometry = geometries => {
  const parts = geometries.filter(Boolean)
  if (!parts.length) return null
  return parts.length === 1 ? parts[0] : TS.collect(parts)
}

const minimumSegmentOpacity = segments =>
  Math.min(...segments.map(segment => segment.opacity))

const segmentCollectionParts = (geometry, segment, baseLine) => {
  if (!isGeometryCollection(geometry)) return []

  return TS.geometries(geometry).flatMap(part => {
    if (isGeometryCollection(part)) {
      return segmentCollectionParts(part, segment, baseLine)
    }

    if (isSegmentLineGeometry(part)) {
      const sub = extractSubGeometry(part, segment.from, segment.to)
      return sub && hasDrawableCoordinates(sub) ? [sub] : []
    }

    if (isPolygonLike(part) || isPoint(part)) {
      const coord = representativeCoordinate(part)
      if (!coord) return []
      const t = positionOnGeometry(baseLine, coord)
      return isWithinSegment(t, segment) ? [part] : []
    }

    return []
  })
}

/**
 * Split style descriptors and apply per-segment opacity from fadeZones.
 */
export default (styles, fadeZones, baseGeometry) => {
  const zones = normalizeFadeZones(fadeZones)
  if (!zones.length || !baseGeometry || !Array.isArray(styles)) return styles

  const baseLine = toFadeBaseLine(baseGeometry)
  if (!baseLine) return styles

  const segments = splitByOpacity(zones)

  return styles.flatMap(entry => {
    if (!entry?.geometry) return [entry]
    const geom = entry.geometry

    if (isGeometryCollection(geom) && isCollectionSegmentEntry(entry)) {
      return segments.flatMap(segment => {
        if (segment.opacity <= 0) return []
        const collection = collectGeometry(segmentCollectionParts(geom, segment, baseLine))
        if (!collection) return []
        return [withOpacity({ ...entry, geometry: collection }, segment.opacity)]
      })
    }

    if (isPolygonLike(geom) && isFillEntry(entry)) {
      const opacity = minimumSegmentOpacity(segments)
      if (opacity <= 0) return []
      return [withOpacity(entry, opacity)]
    }

    if (shouldSegment(entry, geom)) {
      return segments.flatMap(segment => {
        if (segment.opacity <= 0) return []
        const sub = extractSubGeometry(geom, segment.from, segment.to)
        if (!sub) return []
        const coords = typeof sub.getCoordinates === 'function'
          ? sub.getCoordinates()
          : []
        if (coords.length < 2) return []
        return [withOpacity({ ...entry, geometry: sub }, segment.opacity)]
      })
    }

    if (isPoint(geom)) {
      const coord = typeof geom.getCoordinate === 'function'
        ? geom.getCoordinate()
        : null
      if (!coord) return [entry]
      const t = positionOnGeometry(baseLine, coord)
      const opacity = opacityAt(t, zones)
      if (opacity <= 0) return []
      return [withOpacity(entry, opacity)]
    }

    return [entry]
  })
}
