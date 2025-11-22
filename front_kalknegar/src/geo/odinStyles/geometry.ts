import Feature from 'ol/Feature'
import * as geom from 'ol/geom'
import { getPointResolution } from 'ol/proj'
import * as TS from './ts'
import { codeUTM, firstCoordinate } from './epsg'

<<<<<<< Updated upstream
export const geometryType = arg => {
=======
export const geometryType = (arg: any): string | null => {
>>>>>>> Stashed changes
  // OpenLayers:
  if (arg instanceof Feature) return geometryType(arg.getGeometry())
  else if (arg instanceof geom.GeometryCollection) return arg.getGeometries().map(geometryType).join(':')
  else if (arg instanceof geom.Geometry) return arg.getType()
  // GeoJSON:
  else if (arg.type === 'GeometryCollection') return arg.geometries.map(geometryType).join(':')
  else if (arg.type) return arg.type
  else return null
}

// Convert to/from JTS geometry.

<<<<<<< Updated upstream
export const transform = (olGeometry, target) => {
=======
export const transform = (olGeometry: any, target?: string) => {
>>>>>>> Stashed changes
  const origin = firstCoordinate(olGeometry)
  const code = target !== 'EPSG:3857' ? codeUTM(origin) : null

  return {
<<<<<<< Updated upstream
    pointResolution: resolution => {
      return getPointResolution('EPSG:3857', resolution, origin)
    },

    read: olGeometry => {
=======
    pointResolution: (resolution: number) => {
      return getPointResolution('EPSG:3857', resolution, origin)
    },

    read: (olGeometry: any) => {
>>>>>>> Stashed changes
      return TS.read(
        code
          ? olGeometry.clone().transform('EPSG:3857', code)
          : olGeometry
      )
    },

<<<<<<< Updated upstream
    write: jtsGeometry => {
=======
    write: (jtsGeometry: any) => {
>>>>>>> Stashed changes
      const olGeometry = TS.write(jtsGeometry)
      return code
        ? olGeometry.transform(code, 'EPSG:3857')
        : olGeometry
    }
  }
}

<<<<<<< Updated upstream
export const getCoordinates = geometry =>
  geometry instanceof geom.GeometryCollection
    ? geometry.getGeometries().map(getCoordinates)
    : geometry.getCoordinates()

export const setCoordinates = (geometry, coordinates) =>
  geometry instanceof geom.GeometryCollection
    ? geometry.getGeometriesArray().forEach((geometry, index) => setCoordinates(geometry, coordinates[index]))
    : geometry.setCoordinates(coordinates)
=======
export const getCoordinates = (geometry: any): any => {
  if (geometry instanceof geom.GeometryCollection) {
    return geometry.getGeometries().map(getCoordinates)
  }
  return geometry.getCoordinates()
}

export const setCoordinates = (geometry: any, coordinates: any): void => {
  if (geometry instanceof geom.GeometryCollection) {
    geometry.getGeometriesArray().forEach((geometry: any, index: number) => setCoordinates(geometry, coordinates[index]))
  } else {
    geometry.setCoordinates(coordinates)
  }
}

>>>>>>> Stashed changes
