
/**
 *
 */
import GeoJSON from 'ol/format/GeoJSON'

const geojson = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})

const isJtsGeometry = geometry =>
  geometry &&
  typeof geometry.getGeometryType === 'function' &&
  typeof geometry.getEnvelopeInternal === 'function'

const normalizeGeometry = geometry => {
  if (!geometry) return geometry
  if (isJtsGeometry(geometry)) return geometry
  if (typeof geometry.getType === 'function') return geometry
  if (geometry.type) {
    try {
      return geojson.readGeometry(geometry)
    } catch {
      return geometry
    }
  }
  return geometry
}

export default fn => ({ geometry, ...rest }) => {
  if (!geometry) return rest
  const normalized = normalizeGeometry(geometry)
  if (isJtsGeometry(normalized)) {
    try {
      const rewritten = fn(normalized)
      if (rewritten && typeof rewritten.getType === 'function') {
        return { geometry: rewritten, ...rest }
      }
      return rest
    } catch {
      return rest
    }
  }
  if (normalized && typeof normalized.getType === 'function') {
    return { geometry: normalized, ...rest }
  }
  return rest
}
