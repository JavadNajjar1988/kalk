/**
 * Persian Number Utilities
 * Converts English digits (0-9) to Persian digits (۰-۹) for UI display
 */

// Mapping of English digits to Persian digits
const englishToPersianMap: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹'
};

// Mapping of Persian digits to English digits (for reverse conversion if needed)
const persianToEnglishMap: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9'
};

/**
 * Converts English digits to Persian digits in a string
 * @param input - The input string or number
 * @returns String with Persian digits
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  
  const str = String(input);
  return str.replace(/[0-9]/g, (digit) => englishToPersianMap[digit] || digit);
}

/**
 * Converts Persian digits to English digits in a string
 * @param input - The input string with Persian digits
 * @returns String with English digits
 */
export function toEnglishDigits(input: string): string {
  if (!input) return '';
  
  return input.replace(/[۰-۹]/g, (digit) => persianToEnglishMap[digit] || digit);
}

/**
 * Formats a number for Persian display with thousands separator
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with Persian digits and comma separators
 */
export function formatPersianNumber(num: number, decimals: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) return '۰';
  
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return toPersianDigits(formatted);
}

/**
 * Formats coordinates for Persian display
 * @param lat - Latitude
 * @param lon - Longitude
 * @param precision - Decimal precision (default: 6)
 * @returns Formatted coordinate string in Persian
 */
export function formatPersianCoordinates(lat: number, lon: number, precision: number = 6): string {
  const latStr = formatPersianNumber(lat, precision);
  const lonStr = formatPersianNumber(lon, precision);
  return `${latStr}, ${lonStr}`;
}

/**
 * Formats time display with Persian digits
 * @param timestamp - Unix timestamp or date string
 * @param format - Time format (optional, defaults to HH:MM)
 * @returns Time string with Persian digits
 */
export function formatPersianTime(timestamp: number | string | Date, format?: string): string {
  let timeStr: string;
  
  if (timestamp instanceof Date) {
    timeStr = timestamp.toLocaleTimeString('en-US', { hour12: false });
  } else if (typeof timestamp === 'number') {
    timeStr = new Date(timestamp).toLocaleTimeString('en-US', { hour12: false });
  } else {
    timeStr = String(timestamp);
  }
  
  return toPersianDigits(timeStr);
}

/**
 * Formats percentage values for Persian display
 * @param value - The percentage value (0-100 or 0-1)
 * @param isDecimal - Whether the value is in decimal form (0-1) or percentage form (0-100)
 * @returns Formatted percentage string with Persian digits
 */
export function formatPersianPercentage(value: number, isDecimal: boolean = false): string {
  const percentage = isDecimal ? value * 100 : value;
  return `%${formatPersianNumber(percentage, 1)}`;
}

/**
 * Global utility function to automatically convert numbers in text content
 * @param text - Text that may contain numbers
 * @returns Text with Persian digits
 */
export function persianizeText(text: string): string {
  return toPersianDigits(text);
}