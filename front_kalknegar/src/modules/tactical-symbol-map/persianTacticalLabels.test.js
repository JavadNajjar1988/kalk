import { describe, expect, it } from 'vitest'
import symbols2525c from './symbology/2525c.json'
import symbolsSkkm from './symbology/skkm.json'
import {
  ensurePersianTacticalLabel,
  tacticalWordTranslations
} from './persianTacticalLabels.js'

describe('Persian tactical labels', () => {
  it('provides a Persian fallback for every 2525C and SKKM hierarchy label', () => {
    const hierarchyLabels = new Set(
      [...symbols2525c, ...symbolsSkkm]
        .flatMap(descriptor => descriptor.hierarchy || [])
    )

    expect(hierarchyLabels.size).toBeGreaterThan(0)
    for (const label of hierarchyLabels) {
      expect(
        ensurePersianTacticalLabel(label),
        `English leaked from tactical label: ${label}`
      ).not.toMatch(/[A-Za-z]/)
    }
  })

  it('uses semantic Persian equivalents for common tactical terms', () => {
    expect(tacticalWordTranslations.warfighting).toBe('رزم')
    expect(tacticalWordTranslations.equipment).toBe('تجهیزات')
    expect(tacticalWordTranslations.artillery).toBe('توپخانه')
    expect(ensurePersianTacticalLabel('Warfighting Symbols')).toBe('نمادهای رزم')
    expect(ensurePersianTacticalLabel('Fixed Wing Aircraft')).toBe('هواگرد بال ثابت')
    expect(ensurePersianTacticalLabel('Armored Reconnaissance Unit')).toBe('زرهی شناسایی یگان')
    expect(ensurePersianTacticalLabel('Blue Kill Box (BKB) - Irregular'))
      .toBe('محدوده انهدام آبی (بی‌کی‌بی) - نامنظم')
    expect(ensurePersianTacticalLabel('Civil Aircraft')).toBe('هواگرد غیرنظامی')
    expect(ensurePersianTacticalLabel('Civil Aircraft - Fixed Wing'))
      .toBe('هواگرد غیرنظامی - بال ثابت')
    expect(ensurePersianTacticalLabel('Civil Aircraft - Lighter Than Air'))
      .toBe('هواگرد غیرنظامی - سبک‌تر از هوا')
    expect(ensurePersianTacticalLabel('Warfighting Symbols • Air Track'))
      .toBe('نمادهای رزم • رد هوایی')
  })
})
