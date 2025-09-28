/**
 * Test file for Persian Number utilities
 * Run this test to verify all Persian number conversions are working correctly
 */

import { describe, it, expect } from 'vitest';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  formatPersianNumber, 
  formatPersianCoordinates,
  formatPersianTime,
  formatPersianPercentage,
  persianizeText 
} from '@/utils/persianNumbers';

describe('Persian Number Utilities', () => {
  describe('toPersianDigits', () => {
    it('should convert English digits to Persian digits', () => {
      expect(toPersianDigits('1234567890')).toBe('۱۲۳۴۵۶۷۸۹۰');
      expect(toPersianDigits('123')).toBe('۱۲۳');
      expect(toPersianDigits('0')).toBe('۰');
    });

    it('should handle mixed content with digits', () => {
      expect(toPersianDigits('Unit 123')).toBe('Unit ۱۲۳');
      expect(toPersianDigits('Time: 14:30')).toBe('Time: ۱۴:۳۰');
    });

    it('should handle numbers as input', () => {
      expect(toPersianDigits(123)).toBe('۱۲۳');
      expect(toPersianDigits(0)).toBe('۰');
    });

    it('should handle null/undefined inputs', () => {
      expect(toPersianDigits(null as any)).toBe('');
      expect(toPersianDigits(undefined as any)).toBe('');
    });
  });

  describe('toEnglishDigits', () => {
    it('should convert Persian digits to English digits', () => {
      expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
      expect(toEnglishDigits('۱۲۳')).toBe('123');
      expect(toEnglishDigits('۰')).toBe('0');
    });

    it('should handle mixed content with Persian digits', () => {
      expect(toEnglishDigits('واحد ۱۲۳')).toBe('واحد 123');
      expect(toEnglishDigits('زمان: ۱۴:۳۰')).toBe('زمان: 14:30');
    });

    it('should handle empty input', () => {
      expect(toEnglishDigits('')).toBe('');
    });
  });

  describe('formatPersianNumber', () => {
    it('should format numbers with Persian digits', () => {
      expect(formatPersianNumber(1234)).toBe('۱,۲۳۴');
      expect(formatPersianNumber(1234567)).toBe('۱,۲۳۴,۵۶۷');
    });

    it('should handle decimal places', () => {
      expect(formatPersianNumber(123.456, 2)).toBe('۱۲۳.۴۶');
      expect(formatPersianNumber(1234.5, 1)).toBe('۱,۲۳۴.۵');
    });

    it('should handle edge cases', () => {
      expect(formatPersianNumber(0)).toBe('۰');
      expect(formatPersianNumber(NaN)).toBe('۰');
      expect(formatPersianNumber(null as any)).toBe('۰');
    });
  });

  describe('formatPersianCoordinates', () => {
    it('should format coordinates with Persian digits', () => {
      const result = formatPersianCoordinates(51.3890, 35.6892, 4);
      expect(result).toBe('۵۱.۳۸۹۰, ۳۵.۶۸۹۲');
    });

    it('should handle different precision', () => {
      const result = formatPersianCoordinates(51.3890, 35.6892, 2);
      expect(result).toBe('۵۱.۳۹, ۳۵.۶۹');
    });
  });

  describe('formatPersianTime', () => {
    it('should format timestamps with Persian digits', () => {
      const timestamp = new Date('2023-12-25T14:30:00').getTime();
      const result = formatPersianTime(timestamp);
      expect(result).toContain('۱۴:۳۰');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25T14:30:00');
      const result = formatPersianTime(date);
      expect(result).toContain('۱۴:۳۰');
    });

    it('should handle string input', () => {
      const result = formatPersianTime('14:30:00');
      expect(result).toBe('۱۴:۳۰:۰۰');
    });
  });

  describe('formatPersianPercentage', () => {
    it('should format percentage values with Persian digits', () => {
      expect(formatPersianPercentage(75)).toBe('%۷۵.۰');
      expect(formatPersianPercentage(0.75, true)).toBe('%۷۵.۰');
    });

    it('should handle decimal percentages', () => {
      expect(formatPersianPercentage(75.5)).toBe('%۷۵.۵');
      expect(formatPersianPercentage(0.755, true)).toBe('%۷۵.۵');
    });
  });

  describe('persianizeText', () => {
    it('should convert all numbers in text to Persian', () => {
      const text = 'Unit 123 moved from position 45.67, 89.12 at 14:30:00';
      const result = persianizeText(text);
      expect(result).toBe('Unit ۱۲۳ moved from position ۴۵.۶۷, ۸۹.۱۲ at ۱۴:۳۰:۰۰');
    });

    it('should handle Persian text with numbers', () => {
      const text = 'واحد 123 در موقعیت 45.67 قرار دارد';
      const result = persianizeText(text);
      expect(result).toBe('واحد ۱۲۳ در موقعیت ۴۵.۶۷ قرار دارد');
    });
  });

  describe('Bidirectional conversion', () => {
    it('should maintain consistency in bidirectional conversion', () => {
      const original = '123456789';
      const persian = toPersianDigits(original);
      const backToEnglish = toEnglishDigits(persian);
      expect(backToEnglish).toBe(original);
    });

    it('should handle mixed content bidirectionally', () => {
      const original = 'Unit 123 at 14:30';
      const persian = toPersianDigits(original);
      expect(persian).toBe('Unit ۱۲۳ at ۱۴:۳۰');
      const backToEnglish = toEnglishDigits(persian);
      expect(backToEnglish).toBe(original);
    });
  });
});