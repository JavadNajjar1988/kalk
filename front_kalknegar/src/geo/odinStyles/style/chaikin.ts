import * as R from 'ramda'
import { Polygon, LineString, MultiPolygon, MultiLineString, GeometryCollection } from 'ol/geom'

<<<<<<< Updated upstream
const lerp = t => (v0, v1) => v0 * (1 - t) + v1 * t
const lerpB = lerp(0.25)
const lerpXY = ([[x1, y1], [x2, y2]]) => [
=======
const lerp = (t: number) => (v0: number, v1: number) => v0 * (1 - t) + v1 * t
const lerpB = lerp(0.25)
const lerpXY = ([[x1, y1], [x2, y2]]: number[][]): number[][] => [
>>>>>>> Stashed changes
  [lerpB(x1, x2), lerpB(y1, y2)],
  [lerpB(x2, x1), lerpB(y2, y1)]
]

<<<<<<< Updated upstream
const chaikinLine = (coords, n) => {
=======
const chaikinLine = (coords: number[][], n: number): number[][] => {
>>>>>>> Stashed changes
  if (n === 0) return coords

  const xs = R.dropLast(1, coords)
    .map(([x1, y1], index) => [[x1, y1], coords[index + 1]])
    .flatMap(lerpXY)

<<<<<<< Updated upstream
  return chaikinLine([R.head(coords), ...xs, R.last(coords)], n - 1)
}

const chaikinRing = (coords, n) => {
=======
  return chaikinLine([R.head(coords)!, ...xs, R.last(coords)!], n - 1)
}

const chaikinRing = (coords: number[][], n: number): number[][] => {
>>>>>>> Stashed changes
  if (n === 0) return coords

  const xs = coords
    .map(([x1, y1], index) => [[x1, y1], coords[(index + 1) % coords.length]])
    .flatMap(lerpXY)

  return chaikinRing(xs, n - 1)
}

<<<<<<< Updated upstream
const K = v => fn => { fn(v); return v }
const I = v => v

const closeRing = coords => K(coords)(coords => coords.push(coords[0]))
const smoothRing = n => ring => closeRing(chaikinRing(R.dropLast(1, ring), n))
const smoothPolygon = n => polygon => polygon.map(smoothRing(n))
const smoothLine = n => line => chaikinLine(line, n)
const smoothCollection = n => geometry => geometry.getGeometries().map(geometry => smooth(geometry, n))

const mappers = n => ({
  Polygon: geometry => new Polygon(geometry.getCoordinates().map(smoothRing(n))),
  MultiPolygon: geometry => new MultiPolygon(geometry.getCoordinates().map(smoothPolygon(n))),
  LineString: geometry => new LineString(smoothLine(n)(geometry.getCoordinates())),
  MultiLineString: geometry => new MultiLineString(geometry.getCoordinates().map(smoothLine(n))),
  GeometryCollection: geometry => new GeometryCollection(smoothCollection(n)(geometry))
})

export const smooth = (geometry, n = 3) => (mappers(n)[geometry.getType()] || I)(geometry)
=======
const K = (v: any) => (fn: any) => { fn(v); return v }
const I = (v: any) => v

const closeRing = (coords: number[][]) => K(coords)((coords: number[][]) => coords.push(coords[0]))
const smoothRing = (n: number) => (ring: number[][]) => closeRing(chaikinRing(R.dropLast(1, ring), n))
const smoothPolygon = (n: number) => (polygon: number[][][]) => polygon.map(smoothRing(n))
const smoothLine = (n: number) => (line: number[][]) => chaikinLine(line, n)
const smoothCollection = (n: number) => (geometry: any) => geometry.getGeometries().map((geometry: any) => smooth(geometry, n))

const mappers = (n: number) => ({
  Polygon: (geometry: any) => new Polygon(geometry.getCoordinates().map(smoothRing(n))),
  MultiPolygon: (geometry: any) => new MultiPolygon(geometry.getCoordinates().map(smoothPolygon(n))),
  LineString: (geometry: any) => new LineString(smoothLine(n)(geometry.getCoordinates())),
  MultiLineString: (geometry: any) => new MultiLineString(geometry.getCoordinates().map(smoothLine(n))),
  GeometryCollection: (geometry: any) => new GeometryCollection(smoothCollection(n)(geometry))
})

export const smooth = (geometry: any, n: number = 3): any => (mappers(n)[geometry.getType() as keyof typeof mappers] || I)(geometry)

>>>>>>> Stashed changes
