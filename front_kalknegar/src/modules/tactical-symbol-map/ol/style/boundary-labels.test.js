import { describe, expect, it } from 'vitest'
import labels from './linestring-styles/labels'
import evaluateStyleText from './_evalSync'

const evaluateBoundaryLabels = (sidc, properties = {}) =>
  evaluateStyleText(sidc, properties, {})(labels['G*G*GLB---'])

describe('Boundary labels', () => {
  it.each([
    ['B', '•'],
    ['C', '••'],
    ['D', '•••'],
  ])('renders echelon %s with the same solid dots as its preset', (code, marker) => {
    const styles = evaluateBoundaryLabels(`GFGPGLB---*${code}***`, {
      t: 'چپ',
      t1: 'راست',
    })

    expect(styles).toEqual(expect.arrayContaining([
      expect.objectContaining({
        'text-field': marker,
        'text-anchor': 'center',
        'text-padding': 5,
      }),
    ]))
  })

  it('keeps legacy boundaries without an echelon as plain lines', () => {
    const styles = evaluateBoundaryLabels('GFGPGLB---*****')

    expect(styles.some(style => style['text-anchor'] === 'center')).toBe(false)
  })
})
