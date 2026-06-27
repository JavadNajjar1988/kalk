import { describe, expect, it } from 'vitest'
import { GeometryCollection, LineString, MultiPoint, MultiPolygon, Point } from 'ol/geom'
import * as TS from '../ts'
import applyFadeZones, { extractFadeZoneGeometry } from './_applyFadeZones'
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

  it('cuts collection line parts at the brushed position on the base line', () => {
    const baseLine = TS.lineString([
      TS.coordinate(0, 0),
      TS.coordinate(30, 0)
    ])
    const collection = TS.collect([
      TS.lineString([
        TS.coordinate(0, 0),
        TS.coordinate(5, 5),
        TS.coordinate(10, 0)
      ]),
      TS.lineString([
        TS.coordinate(10, 0),
        TS.coordinate(15, 5),
        TS.coordinate(20, 0)
      ]),
      TS.lineString([
        TS.coordinate(20, 0),
        TS.coordinate(25, 5),
        TS.coordinate(30, 0)
      ])
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/default-stroke', geometry: collection }],
      [{ from: 0.4, to: 0.6, opacity: 0 }],
      baseLine
    )

    const remainingParts = styles.flatMap(entry =>
      entry.geometry.getGeometryType() === 'GeometryCollection'
        ? TS.geometries(entry.geometry)
        : [entry.geometry]
    )

    expect(remainingParts).toHaveLength(4)
    expect(remainingParts.map(geometry => geometry.getCoordinates().map(coord => [
      Number(coord.x.toFixed(2)),
      Number(coord.y.toFixed(2))
    ]))).toEqual([
      [[0, 0], [5, 5], [10, 0]],
      [[10, 0], [12, 2]],
      [[18, 2], [20, 0]],
      [[20, 0], [25, 5], [30, 0]]
    ])
  })

  it('cuts a collection line part when the brush overlaps its edge but not its midpoint', () => {
    const baseLine = TS.lineString([
      TS.coordinate(0, 0),
      TS.coordinate(30, 0)
    ])
    const collection = TS.collect([
      TS.lineString([
        TS.coordinate(10, 0),
        TS.coordinate(15, 5),
        TS.coordinate(20, 0)
      ])
    ])

    const styles = applyFadeZones(
      [{ id: 'style:2525c/default-stroke', geometry: collection }],
      [{ from: 0.36, to: 0.44, opacity: 0 }],
      baseLine
    )

    const remainingParts = styles.flatMap(entry =>
      entry.geometry.getGeometryType() === 'GeometryCollection'
        ? TS.geometries(entry.geometry)
        : [entry.geometry]
    )

    expect(remainingParts).toHaveLength(2)
    expect(remainingParts.map(geometry => geometry.getCoordinates().map(coord => [
      Number(coord.x.toFixed(2)),
      Number(coord.y.toFixed(2))
    ]))).toEqual([
      [[10, 0], [10.8, 0.8]],
      [[13.2, 3.2], [15, 5], [20, 0]]
    ])
  })

  it('extracts the rendered collection geometry under the brush for preview', () => {
    const baseLine = TS.lineString([
      TS.coordinate(0, 0),
      TS.coordinate(30, 0)
    ])
    const collection = TS.collect([
      TS.lineString([
        TS.coordinate(10, 0),
        TS.coordinate(15, 5),
        TS.coordinate(20, 0)
      ])
    ])

    const preview = extractFadeZoneGeometry(
      [{ id: 'style:2525c/default-stroke', geometry: collection }],
      0.4,
      0.6,
      baseLine
    )

    const parts = preview.getGeometryType() === 'GeometryCollection'
      ? TS.geometries(preview)
      : [preview]

    expect(parts.map(geometry => geometry.getCoordinates().map(coord => [
      Number(coord.x.toFixed(2)),
      Number(coord.y.toFixed(2))
    ]))).toEqual([
      [[12, 2], [15, 5], [18, 2]]
    ])
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
