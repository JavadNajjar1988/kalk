import { describe, expect, it } from 'vitest';
import {
  formatPersianDate,
  formatPersianDateTime,
  localDateTimeToIso,
  toLocalDateTimeInput,
} from './dateUtils';

describe('Persian date utilities', () => {
  it('formats Gregorian timestamps with the Persian calendar', () => {
    const value = new Date(2026, 6, 28, 14, 30);
    expect(formatPersianDate(value)).toContain('۱۴۰۵');
    expect(formatPersianDateTime(value)).toContain('۱۴:۳۰');
  });

  it('round trips local date-time values through ISO storage', () => {
    const local = '2026-07-28T14:30';
    const iso = localDateTimeToIso(local);
    expect(iso).toBeTruthy();
    expect(toLocalDateTimeInput(iso)).toBe(local);
  });
});
