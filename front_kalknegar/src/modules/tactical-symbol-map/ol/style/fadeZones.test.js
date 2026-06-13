import { describe, expect, it } from 'vitest'
import { GeometryCollection, LineString, MultiPoint, MultiPolygon, Point } from 'ol/geom'
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

  it('uses MultiPoint control points as the fade baseline', () => {
    const geometry = new MultiPoint([
      [0, 0],
      [10, 0],
      [20, 5]
    ])

    const baseLine = toFadeBaseLine(TS.read(geometry))

    expect(baseLine?.getGeometryType()).toBe('LineString')
    expect(baseLine?.getCoordinates()).toHaveLength(3)
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

  it('fades polygon fill entries instead of leaving area fills unchanged', () => {
    const polygon = TS.polygon([
      TS.coordinate(0, 0),
      TS.coordinate(10, 0),
      TS.coordinate(10, 10),
      TS.coordinate(0, 0)
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/hatch-fill', geometry: polygon }],
      [{ from: 0.25, to: 0.75, opacity: 0.15 }],
      polygon
    )

    expect(styles).toHaveLength(1)
    expect(styles[0].geometry).toBe(polygon)
    expect(styles[0]['shape-opacity']).toBe(0.15)
  })

  it('lets delete zones override existing fade zones', () => {
    const line = TS.lineString([
      TS.coordinate(0, 0),
      TS.coordinate(10, 0)
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/default-stroke', geometry: line }],
      [
        { from: 0, to: 1, opacity: 0.15 },
        { from: 0.25, to: 0.75, opacity: 0 }
      ],
      line
    )

    expect(styles).toHaveLength(2)
    expect(styles.map(entry => entry.geometry.getGeometryType())).toEqual([
      'LineString',
      'LineString'
    ])
    expect(styles.map(entry => entry['line-opacity'])).toEqual([0.15, 0.15])
  })

  it('segments the rendered style geometry instead of replacing it with the base geometry', () => {
    const baseLine = TS.lineString([
      TS.coordinate(0, 0),
      TS.coordinate(10, 0)
    ])
    const renderedLine = TS.lineString([
      TS.coordinate(0, 10),
      TS.coordinate(10, 10)
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/default-stroke', geometry: renderedLine }],
      [{ from: 0.25, to: 0.75, opacity: 0.15 }],
      baseLine
    )

    expect(styles.map(entry => entry.geometry.getCoordinates().map(c => c.y))).toEqual([
      [10, 10],
      [10, 10],
      [10, 10]
    ])
  })

  it('applies fade zones to filled geometry collections without dropping polygon parts', () => {
    const baseLine = TS.lineString([
      TS.coordinate(0, 0),
      TS.coordinate(10, 0)
    ])
    const tooth = TS.polygon([
      TS.coordinate(4, 0),
      TS.coordinate(5, 3),
      TS.coordinate(6, 0),
      TS.coordinate(4, 0)
    ])
    const collection = TS.collect([baseLine, tooth])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/solid-fill', geometry: collection }],
      [{ from: 0.25, to: 0.75, opacity: 0.15 }],
      baseLine
    )

    const faded = styles.find(entry => entry['shape-opacity'] === 0.15)
    expect(faded).toBeDefined()
    expect(TS.geometries(faded.geometry).map(geometry => geometry.getGeometryType())).toContain('Polygon')
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
