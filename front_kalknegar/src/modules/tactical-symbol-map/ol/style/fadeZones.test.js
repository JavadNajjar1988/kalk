import { describe, expect, it } from 'vitest'
import { GeometryCollection, LineString, MultiPolygon, Point } from 'ol/geom'
import * as TS from '../ts'
import applyFadeZones from './_applyFadeZones'
import { cutLineGeometry, toFadeBaseLine } from './fadeZones'

describe('fadeZones', () => {
  it('uses all exterior rings of a MultiPolygon as the fade baseline', () => {
    const geometry = new MultiPolygon([
      [[[0, 0], [10, 0], [10, 10], [0, 0]]],
      [[[20, 0], [30, 0], [30, 10], [20, 0]]]
    ])

    const baseLine = toFadeBaseLine(TS.read(geometry))

    expect(baseLine?.getGeometryType()).toBe('MultiLineString')
    expect(baseLine?.getNumGeometries()).toBe(2)
  })

  it('fades polygon stroke entries by rendering faded boundary segments', () => {
    const polygon = TS.polygon([
      TS.coordinate(0, 0),
      TS.coordinate(10, 0),
      TS.coordinate(10, 10),
      TS.coordinate(0, 0)
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/default-stroke', geometry: polygon }],
      [{ from: 0.25, to: 0.75, opacity: 0.15 }],
      polygon
    )

    expect(styles).toHaveLength(3)
    expect(styles.map(entry => entry.geometry.getGeometryType())).toEqual([
      'LineString',
      'LineString',
      'LineString'
    ])
    expect(styles.map(entry => entry['line-opacity'] ?? 1)).toEqual([1, 0.15, 1])
  })

  it('removes polygon stroke segments with zero opacity zones', () => {
    const polygon = TS.polygon([
      TS.coordinate(0, 0),
      TS.coordinate(10, 0),
      TS.coordinate(10, 10),
      TS.coordinate(0, 0)
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/default-stroke', geometry: polygon }],
      [{ from: 0.25, to: 0.75, opacity: 0 }],
      polygon
    )

    expect(styles).toHaveLength(2)
    expect(styles.every(entry => entry.geometry.getGeometryType() === 'LineString')).toBe(true)
    expect(styles.every(entry => entry['line-opacity'] === undefined)).toBe(true)
  })

  it('cuts the line part of a GeometryCollection while preserving point parts', () => {
    const geometry = new GeometryCollection([
      new LineString([[0, 0], [10, 0]]),
      new Point([0, 2])
    ])

    const result = cutLineGeometry(geometry, 0, 0.5)

    expect(result?.getType()).toBe('GeometryCollection')
    expect(result?.getGeometries().map(geom => geom.getType())).toEqual(['LineString', 'Point'])
    expect(result?.getGeometries()[0].getCoordinates()).toEqual([[5, 0], [10, 0]])
  })
})
