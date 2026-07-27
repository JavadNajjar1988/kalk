import { describe, expect, it } from 'vitest';
import {
  gregorianToPersianDate,
  isValidTimeZone,
  persianToGregorianDate,
  scenarioDateTimeToIso,
} from './scenarioDateTime';

describe('scenarioDateTimeToIso', () => {
  it('keeps UTC wall-clock values in UTC', () => {
    expect(scenarioDateTimeToIso(2026, 7, 26, 0, 0, 'UTC')).toBe(
      '2026-07-26T00:00:00.000Z'
    );
  });

  it('converts Tehran wall-clock values using the selected time zone', () => {
    expect(scenarioDateTimeToIso(2026, 7, 26, 0, 0, 'Asia/Tehran')).toBe(
      '2026-07-25T20:30:00.000Z'
    );
  });

  it('rejects invalid dates and time zones', () => {
    expect(() => scenarioDateTimeToIso(2026, 2, 30, 0, 0, 'UTC')).toThrow();
    expect(isValidTimeZone('Invalid/Zone')).toBe(false);
  });

  it('converts between Persian display dates and Gregorian storage dates', () => {
    expect(gregorianToPersianDate({ year: 2026, month: 7, day: 26 })).toEqual({
      year: 1405,
      month: 5,
      day: 4,
    });
    expect(persianToGregorianDate({ year: 1405, month: 5, day: 4 })).toEqual({
      year: 2026,
      month: 7,
      day: 26,
    });
  });
});
