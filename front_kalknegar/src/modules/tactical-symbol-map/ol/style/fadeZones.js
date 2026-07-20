import * as TS from '../ts'
import Coordinate from 'jsts/org/locationtech/jts/geom/Coordinate.js'

const MIN_ZONE = 0.005

/**
 * @typedef {{ from: number, to: number, opacity: number }} FadeZone
 */

export const normalizeFadeZones = zones => {
  if (!Array.isArray(zones)) return []
  return zones
    .filter(z => z && typeof z.from === 'number' && typeof z.to === 'number')
    .map(z => ({
      from: Math.max(0, Math.min(1, Math.min(z.from, z.to))),
      to: Math.max(0, Math.min(1, Math.max(z.from, z.to))),
      opacity: typeof z.opacity === 'number' ? Math.max(0, Math.min(1, z.opacity)) : 0.15
    }))
    .filter(z => z.to - z.from >= MIN_ZONE)
}

export const mergeFadeZone = (zones, zone) =>
  normalizeFadeZones([...(zones || []), zone])

export const opacityAt = (t, zones) => {
  const matches = (zones || []).filter(z => t >= z.from && t <= z.to)
  return matches.length
    ? Math.min(...matches.map(z => z.opacity))
    : 1
}

/**
 * Split [0,1] into constant-opacity intervals.
 */
export const splitByOpacity = zones => {
  const normalized = normalizeFadeZones(zones)
  if (!normalized.length) return [{ from: 0, to: 1, opacity: 1 }]

  const breakpoints = new Set([0, 1])
  normalized.forEach(z => {
    breakpoints.add(z.from)
    breakpoints.add(z.to)
  })

  const sorted = [...breakpoints].sort((a, b) => a - b)
  return sorted.slice(0, -1).map((from, i) => {
    const to = sorted[i + 1]
    const mid = (from + to) / 2
    return { from, to, opacity: opacityAt(mid, normalized) }
  })
}

const geometryType = geometry =>
  geometry && typeof geometry.getGeometryType === 'function'
    ? geometry.getGeometryType()
    : null

const asLineString = geometry =>
  geometryType(geometry) === 'LinearRing'
    ? TS.lineString(TS.coordinates(geometry))
    : geometry

const isLinealType = type =>
  type === 'LineString' ||
  type === 'LinearRing' ||
  type === 'MultiLineString'

const polygonRings = polygon => {
  const rings = [polygon.getExteriorRing()]
  const count = typeof polygon.getNumInteriorRing === 'function'
    ? polygon.getNumInteriorRing()
    : 0

  for (let i = 0; i < count; i++) {
    rings.push(polygon.getInteriorRingN(i))
  }

  return rings
}

export const toFadeBaseLines = geometry => {
  const type = geometryType(geometry)
  if (!type) return []

  if (type === 'LineString' || type === 'LinearRing') return [asLineString(geometry)]

  if (type === 'MultiPoint') {
    const coordinates = TS.coordinates(geometry)
    return coordinates.length >= 2 ? [TS.lineString(coordinates)] : []
  }

  if (type === 'MultiLineString') {
    return TS.geometries(geometry).map(asLineString)
  }

  if (type === 'Polygon') return polygonRings(geometry).map(asLineString)

  if (type === 'MultiPolygon') {
    return TS.geometries(geometry).flatMap(polygon => polygonRings(polygon).map(asLineString))
  }

  if (type === 'GeometryCollection') {
    return TS.geometries(geometry).flatMap(toFadeBaseLines)
  }

  return []
}

export const toFadeBaseLine = geometry => {
  const lines = toFadeBaseLines(geometry)
  if (!lines.length) return null
  if (lines.length === 1) return lines[0]
  return TS.multiLineString(lines)
}

export const positionOnBaseLine = (indexedLine, coordinate) => {
  if (!indexedLine || !coordinate) return 0
  const end = indexedLine.getEndIndex()
  if (!end) return 0

  const coord = coordinate instanceof Coordinate
    ? coordinate
    : new Coordinate(coordinate[0], coordinate[1])

  const index = indexedLine.indexOf(coord)
  return Math.max(0, Math.min(1, index / end))
}

const lineLength = line => TS.lengthIndexedLine(line).getEndIndex()

const normalizedCoordinate = coordinate =>
  coordinate instanceof Coordinate
    ? coordinate
    : new Coordinate(coordinate[0], coordinate[1])

export const positionOnLines = (lines, coordinate) => {
  if (!lines.length || !coordinate) return 0

  const coord = normalizedCoordinate(coordinate)
  const point = TS.point(coord)
  const total = lines.reduce((sum, line) => sum + lineLength(line), 0)
  if (!total) return 0

  let offset = 0
  let best = null

  for (const line of lines) {
    const indexed = TS.lengthIndexedLine(line)
    const end = indexed.getEndIndex()
    const local = Math.max(0, Math.min(end, indexed.indexOf(coord)))
    const distance = typeof line.distance === 'function' ? line.distance(point) : 0

    if (!best || distance < best.distance) {
      best = { distance, index: offset + local }
    }

    offset += end
  }

  return Math.max(0, Math.min(1, (best?.index || 0) / total))
}

export const extractSubLine = (indexedLine, from, to) => {
  const end = indexedLine.getEndIndex()
  const i1 = from * end
  const i2 = to * end
  if (i2 - i1 < 1e-6) return null
  try {
    return indexedLine.extractLine(i1, i2)
  } catch {
    return null
  }
}

const extractLineParts = (lines, from, to) => {
  const totalLength = lines.reduce((sum, line) => sum + lineLength(line), 0)
  const cutStart = from * totalLength
  const cutEnd = to * totalLength
  const result = []
  let offset = 0

  for (const line of lines) {
    const indexed = TS.lengthIndexedLine(line)
    const lineEnd = indexed.getEndIndex()
    if (lineEnd <= 1e-6) continue
    const lineStart = offset
    const lineStop = offset + lineEnd

    const pushPart = (start, stop) => {
      const part = extractSubLine(indexed, start / lineEnd, stop / lineEnd)
      if (part && TS.coordinates(part).length >= 2) result.push(asLineString(part))
    }

    if (lineStop <= cutStart || lineStart >= cutEnd) {
      result.push(line)
    } else {
      const localStart = Math.max(0, cutStart - lineStart)
      const localEnd = Math.min(lineEnd, cutEnd - lineStart)
      if (localStart > 1e-6) pushPart(0, localStart)
      if (localEnd < lineEnd - 1e-6) pushPart(localEnd, lineEnd)
    }

    offset += lineEnd
  }

  return result
}

const extractRangeParts = (lines, from, to) => {
  const totalLength = lines.reduce((sum, line) => sum + lineLength(line), 0)
  const rangeStart = from * totalLength
  const rangeEnd = to * totalLength
  const result = []
  let offset = 0

  for (const line of lines) {
    const indexed = TS.lengthIndexedLine(line)
    const lineEnd = indexed.getEndIndex()
    if (lineEnd <= 1e-6) continue
    const lineStart = offset
    const lineStop = offset + lineEnd

    if (lineStop > rangeStart && lineStart < rangeEnd && lineEnd > 0) {
      const localStart = Math.max(0, rangeStart - lineStart)
      const localEnd = Math.min(lineEnd, rangeEnd - lineStart)
      const part = extractSubLine(indexed, localStart / lineEnd, localEnd / lineEnd)
      if (part && TS.coordinates(part).length >= 2) result.push(asLineString(part))
    }

    offset += lineEnd
  }

  return result
}

const lineGeometry = lines => {
  if (!lines.length) return null
  if (lines.length === 1) return lines[0]
  return TS.multiLineString(lines)
}

export const extractSubGeometry = (geometry, from, to) => {
  const lines = toFadeBaseLines(geometry)
  const parts = extractRangeParts(lines, from, to)
  return lineGeometry(parts)
}

export const positionOnGeometry = (geometry, coordinate) =>
  positionOnLines(toFadeBaseLines(geometry), coordinate)

export const positionOnFeature = (olGeometry, coordinate) => {
  const jts = TS.read(olGeometry)
  const lines = toFadeBaseLines(jts)
  if (!lines.length) return null
  return positionOnLines(lines, coordinate)
}

export const cutLineGeometry = (olGeometry, from, to) => {
  const type = olGeometry.getType()
  const jts = TS.read(olGeometry)

  if (type === 'GeometryCollection') {
    const parts = TS.geometries(jts)
    const lineParts = parts.flatMap(part => {
      const partType = geometryType(part)
      return isLinealType(partType)
        ? toFadeBaseLines(part)
        : []
    })
    const otherParts = parts.filter(part => !isLinealType(geometryType(part)))
    const remaining = extractLineParts(lineParts, from, to)
    if (!remaining.length) return null
    return TS.write(TS.collect([...remaining, ...otherParts]))
  }

  if (type !== 'LineString' && type !== 'MultiLineString') return null

  const remaining = extractLineParts(toFadeBaseLines(jts), from, to)
  const geometry = lineGeometry(remaining)
  return geometry ? TS.write(geometry) : null
}
