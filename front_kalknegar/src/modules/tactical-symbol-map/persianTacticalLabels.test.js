import { describe, expect, it } from 'vitest'
import symbols2525c from './symbology/2525c.json'
import symbolsSkkm from './symbology/skkm.json'
import {
  ensurePersianTacticalLabel,
  tacticalWordTranslations
} from './persianTacticalLabels.js'

describe('Persian tactical labels', () => {
  it('uses either reviewed Persian or the unchanged source label', () => {
    const hierarchyLabels = new Set(
      [...symbols2525c, ...symbolsSkkm]
        .flatMap(descriptor => descriptor.hierarchy || [])
    )

    expect(hierarchyLabels.size).toBeGreaterThan(0)
    for (const label of hierarchyLabels) {
      const translated = ensurePersianTacticalLabel(label)
      expect(
        translated === label || !/[A-Za-z]/.test(translated),
        `Partially translated tactical label: ${label} => ${translated}`
      ).toBe(true)
    }
  })

  it('uses semantic Persian equivalents for common tactical terms', () => {
    expect(tacticalWordTranslations.warfighting).toBe('رزم')
    expect(tacticalWordTranslations.equipment).toBe('تجهیزات')
    expect(tacticalWordTranslations.artillery).toBe('توپخانه')
    expect(ensurePersianTacticalLabel('Warfighting Symbols')).toBe('نمادهای رزم')
    expect(ensurePersianTacticalLabel('Fixed Wing Aircraft')).toBe('هواگرد بال ثابت')
    expect(ensurePersianTacticalLabel('Armored Reconnaissance Unit'))
      .toBe('یگان شناسایی زرهی')
    expect(ensurePersianTacticalLabel('Emergency Medical Operation Unit'))
      .toBe('یگان عملیات پزشکی اضطراری')
    expect(ensurePersianTacticalLabel('Fire Support Area'))
      .toBe('منطقه پشتیبانی آتش')
    expect(ensurePersianTacticalLabel('Blue Kill Box (BKB) - Irregular'))
      .toBe('محدوده انهدام آبی (بی‌کی‌بی) - نامنظم')
    expect(ensurePersianTacticalLabel('Civil Aircraft')).toBe('هواگرد غیرنظامی')
    expect(ensurePersianTacticalLabel('Civil Aircraft - Fixed Wing'))
      .toBe('هواگرد غیرنظامی - بال ثابت')
    expect(ensurePersianTacticalLabel('Civil Aircraft - Lighter Than Air'))
      .toBe('هواگرد غیرنظامی - سبک‌تر از هوا')
    expect(ensurePersianTacticalLabel('Warfighting Symbols • Air Track'))
      .toBe('نمادهای رزم • رد هوایی')
    expect(ensurePersianTacticalLabel('Unreviewed Tactical Phrase'))
      .toBe('Unreviewed Tactical Phrase')
  })
})
