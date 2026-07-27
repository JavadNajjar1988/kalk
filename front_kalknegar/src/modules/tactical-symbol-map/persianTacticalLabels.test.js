import { describe, expect, it } from 'vitest'
import symbols2525c from './symbology/2525c.json'
import symbolsSkkm from './symbology/skkm.json'
import { ensurePersianTacticalLabel } from './persianTacticalLabels.js'

describe('Persian tactical hierarchy labels', () => {
  it('covers every hierarchy level in 2525C and SKKM', () => {
    const labels = [...symbols2525c, ...symbolsSkkm]
      .flatMap(descriptor => Array.isArray(descriptor.hierarchy) ? descriptor.hierarchy : [])

    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      expect(ensurePersianTacticalLabel(label)).not.toMatch(/[A-Za-z]/)
    }
  })

  it('uses semantic translations for common military terms', () => {
    expect(ensurePersianTacticalLabel('Warfighting')).toBe('رزم')
    expect(ensurePersianTacticalLabel('Fixed Wing Aircraft')).toBe('ثابت بال هواگرد')
    expect(ensurePersianTacticalLabel('Armored Reconnaissance Unit')).toBe('زرهی شناسایی یگان')
  })
})
