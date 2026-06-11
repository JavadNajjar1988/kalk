import { describe, expect, it } from 'vitest'
import LineString from 'ol/geom/LineString'
import { styleFactory } from './styleFactory'

describe('styleFactory', () => {
  it('applies line opacity to named stroke colors', () => {
    const styles = styleFactory({
      geometry: new LineString([[0, 0], [10, 0]]),
      'line-color': 'black',
      'line-width': 2,
      'line-opacity': 0.15
    })

    expect(styles[0].getStroke().getColor()).toBe('rgba(0,0,0,0.15)')
  })
})
