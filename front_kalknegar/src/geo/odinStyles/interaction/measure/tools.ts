import GeometryType from '../GeometryType'
import { getArea, getLength } from 'ol/sphere'
import type LineString from 'ol/geom/LineString'
import type Polygon from 'ol/geom/Polygon'
import type { Geometry } from 'ol/geom'

const meterFormatter = new Intl.NumberFormat(
  window.navigator.userLanguage || window.navigator.language,
  { maximumFractionDigits: 1, style: 'unit', unit: 'meter' }
)
const kilometerFormatter = new Intl.NumberFormat(
  window.navigator.userLanguage || window.navigator.language,
  { maximumFractionDigits: 1, style: 'unit', unit: 'kilometer' }
)
const oneDigitFormatter = new Intl.NumberFormat(
  window.navigator.userLanguage || window.navigator.language,
  {
    maximumFractionDigits: 1
  }
)

const formatLength = (length: number): string => {
  if (length < 1000) {
    return meterFormatter.format(length)
  }
  return kilometerFormatter.format(length / 1000)
}

export const formatAngle = (angle: number): string => {
  return `${oneDigitFormatter.format(angle)}°`
}

export const formatArea = (area: number): string => {
  const unit = area > 100000 ? 'km²' : 'm²'
  const factor = area > 100000 ? 1000000 : 1
  return `${oneDigitFormatter.format(area / factor)} ${unit}`
}

export const length = (geometry: LineString | Polygon | Geometry): string => {
  return formatLength(getLength(geometry))
}

export const angle = (lineStringSegment: LineString): string => {
  return formatAngle((-1 * radiansAngle(lineStringSegment) * 180 / Math.PI + 450) % 360)
}

export const radiansAngle = (lineStringSegment: LineString): number => {
  const start = lineStringSegment.getFirstCoordinate()
  const end = lineStringSegment.getLastCoordinate()
  return Math.atan2(end[1] - start[1], end[0] - start[0])
}

export const area = (polygonGeometry: Polygon): string => {
  return formatArea(getArea(polygonGeometry))
}

export const getLastSegmentCoordinates = (lineStringGeometry: LineString): number[][] => {
  const coordinates = lineStringGeometry.getCoordinates()
  if (coordinates.length <= 2) return coordinates
  return [coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]]
}

export const isSingleSegment = (lineStringGeometry: LineString): boolean => {
  if (lineStringGeometry.getType() !== GeometryType.LINE_STRING) return false
  return lineStringGeometry.getCoordinates().length === 2
}

