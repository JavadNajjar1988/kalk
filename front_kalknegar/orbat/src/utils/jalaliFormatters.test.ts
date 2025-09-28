import { describe, it, expect } from 'vitest';
import { 
  formatJalaliTimestamp, 
  jalaliDateTimeFormatter,
  toJalali,
  getPersianMonthName,
  getPersianDayName,
  formatPersianDateShort,
  formatPersianDateFull,
  jalaliFormDateFormatter,
  jalaliShortDateFormatter,
  jalaliFullDateFormatter
} from './jalaliFormatters';
import '../dayjs';

describe('Jalali Formatters', () => {
  const testTimestamp = 1640995200000; // 2022-01-01 00:00:00 UTC (1400/10/11 in Jalali)
  
  it('should format Jalali timestamp', () => {
    const result = formatJalaliTimestamp(testTimestamp, 'YYYY/MM/DD');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/\u06f1\u06f4\u06f0\u06f0/); // Contains Persian digit 1400
  });
  
  it('should format date-time', () => {
    const result = jalaliDateTimeFormatter(testTimestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/\u06f1\u06f4\u06f0\u06f0/); // Contains Persian digit 1400
  });
  
  it('should convert any date to Jalali', () => {
    const result = toJalali(new Date(2022, 0, 1), 'YYYY/MM/DD');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  
  it('should get Persian month name', () => {
    const result = getPersianMonthName(testTimestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  
  it('should get Persian day name', () => {
    const result = getPersianDayName(testTimestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  
  it('should format short Persian date', () => {
    const result = formatPersianDateShort(testTimestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/\u06f1\u06f4\u06f0\u06f0/); // Contains Persian digit 1400
  });
  
  it('should format full Persian date', () => {
    const result = formatPersianDateFull(testTimestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  
  it('should format Jalali for forms', () => {
    const result = jalaliFormDateFormatter(testTimestamp);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/\u06f1\u06f4\u06f0\u06f0/); // Contains Persian digit 1400
  });
  
  it('should show full month names correctly', () => {
    // Test Farvardin (first month)
    const farvardinDate = 1648771200000; // 2022-04-01 (start of Farvardin 1401)
    const fullMonth = getPersianMonthName(farvardinDate);
    console.log('Full month name:', fullMonth);
    expect(fullMonth).toBeDefined();
    expect(typeof fullMonth).toBe('string');
    expect(fullMonth.length).toBeGreaterThan(3); // Should be longer than "فرو"
    
    // Test the FIXED formatters that should now use MMMM instead of MMM
    const shortDateResult = jalaliShortDateFormatter(farvardinDate);
    console.log('Short date formatter (should show full month):', shortDateResult);
    expect(shortDateResult).toContain('فروردین'); // Should contain full "Farvardin"
    
    const fullDateResult = jalaliFullDateFormatter(farvardinDate);
    console.log('Full date formatter (should show full month):', fullDateResult);
    expect(fullDateResult).toContain('فروردین'); // Should contain full "Farvardin"
    
    // Test with MMM format (should still be short - this is the direct format)
    const shortMonth = formatJalaliTimestamp(farvardinDate, 'MMM');
    console.log('Direct MMM format (still short):', shortMonth);
    expect(shortMonth).toBeDefined();
    
    // Test with MMMM format (should be full)
    const longMonth = formatJalaliTimestamp(farvardinDate, 'MMMM');
    console.log('Direct MMMM format (full):', longMonth);
    expect(longMonth).toBeDefined();
    expect(longMonth.length).toBeGreaterThan(shortMonth.length);
  });
});