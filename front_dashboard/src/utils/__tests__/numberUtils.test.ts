import { describe, it, expect } from 'vitest';
import { convertToFarsiNumber, convertToEnglishNumber } from '../numberUtils';

describe('numberUtils', () => {
  describe('convertToFarsiNumber', () => {
    it('باید اعداد انگلیسی را به فارسی تبدیل کند', () => {
      expect(convertToFarsiNumber(123)).toBe('۱۲۳');
      expect(convertToFarsiNumber(0)).toBe('۰');
      expect(convertToFarsiNumber(1000)).toBe('۱۰۰۰');
    });

    it('باید اعداد منفی را به درستی تبدیل کند', () => {
      expect(convertToFarsiNumber(-123)).toBe('-۱۲۳');
      expect(convertToFarsiNumber(-1000)).toBe('-۱۰۰۰');
    });

    it('باید اعداد اعشاری را به درستی تبدیل کند', () => {
      expect(convertToFarsiNumber(123.45)).toBe('۱۲۳.۴۵');
      expect(convertToFarsiNumber(0.5)).toBe('۰.۵');
    });

    it('باید رشته‌های عددی را به درستی تبدیل کند', () => {
      expect(convertToFarsiNumber('123')).toBe('۱۲۳');
      expect(convertToFarsiNumber('0')).toBe('۰');
      expect(convertToFarsiNumber('1000')).toBe('۱۰۰۰');
    });

    it('باید برای ورودی‌های نامعتبر رشته خالی برگرداند', () => {
      expect(convertToFarsiNumber(undefined as any)).toBe('');
      expect(convertToFarsiNumber(null as any)).toBe('');
    });
  });

  describe('convertToEnglishNumber', () => {
    it('باید اعداد فارسی را به انگلیسی تبدیل کند', () => {
      expect(convertToEnglishNumber('۱۲۳')).toBe('123');
      expect(convertToEnglishNumber('۰')).toBe('0');
      expect(convertToEnglishNumber('۱۰۰۰')).toBe('1000');
    });

    it('باید اعداد عربی را به انگلیسی تبدیل کند', () => {
      expect(convertToEnglishNumber('١٢٣')).toBe('123');
      expect(convertToEnglishNumber('٠')).toBe('0');
      expect(convertToEnglishNumber('١٠٠٠')).toBe('1000');
    });

    it('باید اعداد منفی فارسی را به درستی تبدیل کند', () => {
      expect(convertToEnglishNumber('-۱۲۳')).toBe('-123');
      expect(convertToEnglishNumber('-۱۰۰۰')).toBe('-1000');
    });

    it('باید اعداد اعشاری فارسی را به درستی تبدیل کند', () => {
      expect(convertToEnglishNumber('۱۲۳.۴۵')).toBe('123.45');
      expect(convertToEnglishNumber('۰.۵')).toBe('0.5');
    });

    it('باید برای ورودی‌های نامعتبر رشته خالی برگرداند', () => {
      expect(convertToEnglishNumber('')).toBe('');
      expect(convertToEnglishNumber(null as any)).toBe('');
    });
  });
}); 