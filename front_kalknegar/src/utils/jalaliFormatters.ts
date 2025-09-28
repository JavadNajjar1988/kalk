/**
 * Comprehensive Jalali date formatters for entire project
 * فرمت‌کننده‌های جامع تاریخ شمسی برای کل پروژه
 */

import dayjs from "dayjs";
import { toPersianDigits } from "./persianNumbers";

/**
 * تبدیل timestamp میلادی به فرمت شمسی
 * Convert Gregorian timestamp to Jalali format
 */
export function formatJalaliTimestamp(timestamp: number, format: string): string {
  try {
    // Use jalaliday plugin to convert to Jalali calendar
    const jalaliFormatted = dayjs(timestamp).calendar('jalali').locale('fa').format(format);
    return toPersianDigits(jalaliFormatted);
  } catch (error) {
    console.warn('Error formatting Jalali date:', error);
    // Fallback: try with calendar only
    try {
      const calendarFormatted = dayjs(timestamp).calendar('jalali').format(format);
      return toPersianDigits(calendarFormatted);
    } catch (e2) {
      // Final fallback to original format with Persian digits
      return toPersianDigits(dayjs(timestamp).format(format));
    }
  }
}

/**
 * تبدیل تاریخ میلادی به شمسی
 * Convert any date input to Jalali format
 */
export function toJalali(date: Date | string | number, format: string = 'YYYY/MM/DD'): string {
  return formatJalaliTimestamp(+new Date(date), format);
}

/**
 * گرفتن نام ماه شمسی
 * Get Persian month name
 */
export function getPersianMonthName(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'MMMM');
}

/**
 * گرفتن نام روز هفته شمسی
 * Get Persian day name
 */
export function getPersianDayName(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'dddd');
}

/**
 * فرمت کامل تاریخ شمسی با نام روز و ماه
 * Full Persian date with day and month names
 */
export function formatPersianDateFull(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'dddd DD MMMM YYYY');
}

/**
 * فرمت کوتاه تاریخ شمسی
 * Short Persian date format
 */
export function formatPersianDateShort(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'YYYY/MM/DD');
}

/**
 * فرمت متوسط تاریخ شمسی
 * Medium Persian date format
 */
export function formatPersianDateMedium(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'DD MMMM YYYY');
}

/**
 * فرمت‌کننده ساعت شمسی
 * Jalali hour formatter for timeline
 */
export function jalaliHourFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'HH');
}

/**
 * فرمت‌کننده تاریخ کوتاه شمسی
 * Jalali short date formatter
 */
export function jalaliShortDateFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'DD MMMM');
}

/**
 * فرمت‌کننده تاریخ کامل شمسی
 * Jalali full date formatter  
 */
export function jalaliFullDateFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'ddd DD MMMM');
}

/**
 * فرمت‌کننده کامل تاریخ و زمان شمسی
 * Complete Jalali date-time formatter
 */
export function jalaliDateTimeFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'YYYY/MM/DD HH:mm');
}

/**
 * فرمت‌کننده تاریخ برای فرم‌ها
 * Date formatter for forms (input fields)
 */
export function jalaliFormDateFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'YYYY-MM-DD');
}

/**
 * فرمت‌کننده زمان برای فرم‌ها
 * Time formatter for forms
 */
export function jalaliFormTimeFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'HH:mm');
}

/**
 * فرمت‌کننده برای نمایش در جداول
 * Formatter for table displays
 */
export function jalaliTableDateFormatter(timestamp: number): string {
  return formatJalaliTimestamp(timestamp, 'DD/MM/YYYY');
}

/**
 * فرمت‌کننده برای توضیحات زمان (مثل "۲ ساعت پیش")
 * Relative time formatter (like "2 hours ago")
 */
export function jalaliRelativeTimeFormatter(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) return 'چند لحظه پیش';
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;
  if (months < 12) return `${toPersianDigits(months)} ماه پیش`;
  return `${toPersianDigits(years)} سال پیش`;
}

/**
 * تولید فرمت‌کننده ماینور بر اساس عرض
 * Generate minor formatter based on width
 */
export function getJalaliMinorFormatter(majorWidth: number) {
  if (majorWidth < 50) {
    return (timestamp: number) => "";
  }
  return jalaliHourFormatter;
}

/**
 * تولید فرمت‌کننده مِیجور بر اساس عرض  
 * Generate major formatter based on width
 */
export function getJalaliMajorFormatter(majorWidth: number) {
  if (majorWidth < 100) {
    return jalaliShortDateFormatter;
  }
  return jalaliFullDateFormatter;
}