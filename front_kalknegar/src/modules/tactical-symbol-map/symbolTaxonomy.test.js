import { describe, expect, it } from 'vitest'
import {
  TAXONOMY_CATEGORIES,
  TAXONOMY_DRAWING_TYPES,
  TAXONOMY_ENVIRONMENTS,
  TAXONOMY_STANDARDS,
  classifyCategory,
  classifyDrawingType,
  classifyEnvironment,
  classifyStandard,
} from './symbolTaxonomy.js'
import { descriptors } from './symbology/2525c.js'

describe('symbol taxonomy', () => {
  it('groups symbols by semantic purpose before their technical scope', () => {
    expect(classifyCategory({ scope: 'UNIT', hierarchy: ['Warfighting Symbols'] })).toBe(
      'units',
    )
    expect(
      classifyCategory({
        scope: 'ACTIVITY',
        hierarchy: ['Emergency Management Symbols', 'Fire Incident'],
      }),
    ).toBe('incidents')
    expect(
      classifyCategory({
        scope: 'INSTALLATION',
        hierarchy: ['Emergency Management Symbols', 'Educational Facilities Infrastructure'],
      }),
    ).toBe('infrastructure')
  })

  it('uses environment, geometry and standard as secondary facets', () => {
    const descriptor = {
      scope: 'SKKM',
      dimensions: ['LAND', 'SIGINT'],
      geometry: { type: 'LineString' },
    }

    expect(classifyEnvironment(descriptor)).toBe('land')
    expect(classifyDrawingType(descriptor)).toBe('line')
    expect(classifyStandard(descriptor)).toBe('skkm')
  })

  it('classifies every available symbol into a visible taxonomy option', () => {
    const categoryKeys = new Set(TAXONOMY_CATEGORIES.map(({ key }) => key))
    const environmentKeys = new Set(TAXONOMY_ENVIRONMENTS.map(({ key }) => key))
    const drawingTypeKeys = new Set(TAXONOMY_DRAWING_TYPES.map(({ key }) => key))
    const standardKeys = new Set(TAXONOMY_STANDARDS.map(({ key }) => key))

    Object.values(descriptors).forEach((descriptor) => {
      expect(categoryKeys.has(classifyCategory(descriptor))).toBe(true)
      expect(environmentKeys.has(classifyEnvironment(descriptor))).toBe(true)
      expect(drawingTypeKeys.has(classifyDrawingType(descriptor))).toBe(true)
      expect(standardKeys.has(classifyStandard(descriptor))).toBe(true)
    })
  })
})
