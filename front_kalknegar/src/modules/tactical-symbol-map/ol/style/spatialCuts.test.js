import { LineString, MultiLineString, Polygon } from 'ol/geom'
import { describe, expect, it } from 'vitest'
import * as TS from '../ts'
import applySpatialCuts from './spatialCuts'

const read = geometry => TS.read(geometry)

describe('spatialCuts', () => {
  it('cuts only the rendered branch beneath the mouse path', () => {
    const renderedBranches = TS.read(
      new MultiLineString([
        [
          [0, 0],
          [10, 0]
        ],
        [
          [0, 10],
          [10, 10]
        ]
      ])
    )

    const [result] = applySpatialCuts(
      [{ id: 'style:2525c/default-stroke', geometry: renderedBranches }],
      [{ coordinates: [[5, 0]], radius: 1, gesture: 'test' }],
      read
    )

    const parts = TS.geometries(result.geometry)
    const upperBranch = parts.find(part =>
      part.getCoordinates().every(coordinate => coordinate.y === 10)
    )
    const lowerBranches = parts.filter(part =>
      part.getCoordinates().every(coordinate => coordinate.y === 0)
    )

    expect(upperBranch.getCoordinates().map(({ x, y }) => [x, y])).toEqual([
      [0, 10],
      [10, 10]
    ])
    expect(lowerBranches).toHaveLength(2)
  })

  it('removes only a local area from a filled tactical shape', () => {
    const polygon = TS.read(
      new Polygon([
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0]
        ]
      ])
    )

    const [result] = applySpatialCuts(
      [{ id: 'style:2525c/default-fill', geometry: polygon }],
      [{ coordinates: [[2, 2]], radius: 1, gesture: 'test' }],
      read
    )

    expect(result.geometry.getArea()).toBeGreaterThan(90)
    expect(result.geometry.getArea()).toBeLessThan(100)
  })

  it('extends one cut mask while the same mouse gesture continues', async () => {
    const { mergeSpatialCut } = await import('./spatialCuts')
    const first = mergeSpatialCut([], {
      coordinates: [[1, 1]],
      radius: 2,
      gesture: 'gesture:a'
    })
    const extended = mergeSpatialCut(first, {
      coordinates: [
        [1, 1],
        [2, 1]
      ],
      radius: 2,
      gesture: 'gesture:a'
    })

    expect(extended).toHaveLength(1)
    expect(extended[0].coordinates).toEqual([
      [1, 1],
      [2, 1]
    ])
  })

  it('removes consecutive duplicate coordinates from persisted masks', async () => {
    const { normalizeSpatialCuts } = await import('./spatialCuts')

    expect(
      normalizeSpatialCuts([
        {
          coordinates: [
            [1, 1],
            [1, 1],
            [2, 1],
            [2, 1]
          ],
          radius: 2,
          gesture: 'gesture:a'
        }
      ])[0].coordinates
    ).toEqual([
      [1, 1],
      [2, 1]
    ])
  })
})
