/**
 * Persian Numbers Composable
 * Provides reactive Persian number formatting utilities for Vue components
 */

import { computed, ref, type Ref } from 'vue';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  formatPersianNumber, 
  formatPersianCoordinates,
  formatPersianTime,
  formatPersianPercentage,
  persianizeText 
} from '@/utils/persianNumbers';

/**
 * Composable for Persian number formatting
 */
export function usePersianNumbers() {
  /**
   * Reactive Persian number formatter
   * @param source - Reactive source containing numbers
   * @returns Computed property with Persian digits
   */
  function persianNumber<T extends string | number>(source: Ref<T> | T) {
    if (typeof source === 'object' && 'value' in source) {
      return computed(() => toPersianDigits(String(source.value)));
    }
    return toPersianDigits(String(source));
  }

  /**
   * Reactive Persian text formatter (converts all numbers in text)
   * @param source - Reactive source containing text with numbers
   * @returns Computed property with Persian digits
   */
  function persianText<T extends string>(source: Ref<T> | T) {
    if (typeof source === 'object' && 'value' in source) {
      return computed(() => persianizeText(source.value));
    }
    return persianizeText(source);
  }

  /**
   * Reactive Persian time formatter
   * @param timestamp - Reactive timestamp
   * @param format - Time format (optional)
   * @returns Computed property with Persian time
   */
  function persianTime(timestamp: Ref<number | string | Date>, format?: string) {
    return computed(() => formatPersianTime(timestamp.value, format));
  }

  /**
   * Reactive Persian coordinate formatter
   * @param lat - Reactive latitude
   * @param lon - Reactive longitude
   * @param precision - Decimal precision
   * @returns Computed property with Persian coordinates
   */
  function persianCoordinates(lat: Ref<number>, lon: Ref<number>, precision: number = 6) {
    return computed(() => formatPersianCoordinates(lat.value, lon.value, precision));
  }

  /**
   * Reactive Persian percentage formatter
   * @param value - Reactive percentage value
   * @param isDecimal - Whether value is decimal (0-1) or percentage (0-100)
   * @returns Computed property with Persian percentage
   */
  function persianPercentage(value: Ref<number>, isDecimal: boolean = false) {
    return computed(() => formatPersianPercentage(value.value, isDecimal));
  }

  /**
   * Two-way binding for Persian input fields
   * Allows editing with Persian digits while maintaining English digits for processing
   * @param initialValue - Initial value
   * @returns Object with display value (Persian) and actual value (English)
   */
  function persianInput(initialValue: string | number = '') {
    const internalValue = ref(String(initialValue));
    
    const displayValue = computed({
      get() {
        return toPersianDigits(internalValue.value);
      },
      set(newValue: string) {
        internalValue.value = toEnglishDigits(newValue);
      }
    });

    const actualValue = computed(() => internalValue.value);
    
    return {
      displayValue,
      actualValue,
      setValue: (value: string | number) => {
        internalValue.value = String(value);
      }
    };
  }

  /**
   * Format number with thousands separator in Persian
   * @param num - Number to format
   * @param decimals - Number of decimal places
   * @returns Formatted string with Persian digits
   */
  function formatNumber(num: number, decimals: number = 0): string {
    return formatPersianNumber(num, decimals);
  }

  /**
   * Convert English digits to Persian digits
   * @param input - Input string or number
   * @returns String with Persian digits
   */
  function toPersian(input: string | number): string {
    return toPersianDigits(input);
  }

  /**
   * Convert Persian digits to English digits
   * @param input - Input string with Persian digits
   * @returns String with English digits
   */
  function toEnglish(input: string): string {
    return toEnglishDigits(input);
  }

  return {
    // Reactive formatters
    persianNumber,
    persianText,
    persianTime,
    persianCoordinates,
    persianPercentage,
    persianInput,
    
    // Direct formatters
    formatNumber,
    toPersian,
    toEnglish,
    
    // Original utility functions for advanced use
    toPersianDigits,
    toEnglishDigits,
    formatPersianNumber,
    formatPersianCoordinates,
    formatPersianTime,
    formatPersianPercentage,
    persianizeText
  };
}

/**
 * Global Persian numbers composable instance
 * Can be used in templates without importing
 */
export const $persian = usePersianNumbers();