import {
  normalizeFadeZones,
  splitByOpacity,
  toFadeBaseLine,
  positionOnGeometry,
  opacityAt,
  extractSubGeometry
} from './fadeZones'

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

const isPolygonLike = geometry => {
  const type = geometryType(geometry)
  return type === 'Polygon' || type === 'MultiPolygon'
}

const isMultiLineString = geometry => geometryType(geometry) === 'MultiLineString'

const isGeometryCollection = geometry => geometryType(geometry) === 'GeometryCollection'

const shouldSegment = (entry, geometry) =>
  isLineLike(geometry) ||
  isMultiLineString(geometry) ||
  (isGeometryCollection(geometry) && isStrokeEntry(entry)) ||
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

    if (shouldSegment(entry, geom)) {
      return segments.flatMap(segment => {
        if (segment.opacity <= 0) return []
        const sub = extractSubGeometry(baseLine, segment.from, segment.to)
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
