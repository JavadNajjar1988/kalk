// Number Transformer - Persian/English number conversion processor
// تبدیل‌کننده اعداد - پردازشگر تبدیل اعداد فارسی/انگلیسی

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Number transformation processor
 * پردازشگر تبدیل اعداد
 */
export class NumberTransformer implements IFieldProcessor {
  name = 'NumberTransformer';
  priority = 40;
  enabled = true;

  // Persian to English number mapping
  // نگاشت اعداد فارسی به انگلیسی
  private persianToEnglish: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };

  // English to Persian number mapping
  // نگاشت اعداد انگلیسی به فارسی
  private englishToPersian: Record<string, string> = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };

  // Arabic to English number mapping
  // نگاشت اعداد عربی به انگلیسی
  private arabicToEnglish: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.convertNumbers &&
      context.currentValue &&
      this.hasNumbers(context.currentValue)
    );
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  process(context: ProcessingContext): ProcessingResult {
    const { currentValue } = context;
    let transformedValue = currentValue;

    try {
      if (context.field.convertNumbers) {
        // Default behavior: convert all to English numbers
        transformedValue = this.convertToEnglish(currentValue);
        
        // Optional: if field direction is RTL, convert to Persian
        if (context.field.direction === 'rtl') {
          // Keep English for consistency unless specifically requested Persian
          // transformedValue = this.convertToPersian(currentValue);
        }
      }

      return {
        value: transformedValue,
        isValid: true,
        hasChanges: transformedValue !== currentValue,
        context
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Number transformation failed: ${error}`]
      };
    }
  }

  /**
   * Check if string contains numbers
   * بررسی وجود عدد در رشته
   */
  private hasNumbers(value: string): boolean {
    return /[\d۰-۹٠-٩]/.test(value);
  }

  /**
   * Convert all numbers to English
   * تبدیل تمام اعداد به انگلیسی
   */
  private convertToEnglish(value: string): string {
    let result = value;
    
    // Convert Persian numbers
    for (const [persian, english] of Object.entries(this.persianToEnglish)) {
      result = result.replace(new RegExp(persian, 'g'), english);
    }
    
    // Convert Arabic numbers
    for (const [arabic, english] of Object.entries(this.arabicToEnglish)) {
      result = result.replace(new RegExp(arabic, 'g'), english);
    }
    
    return result;
  }

  /**
   * Convert all numbers to Persian
   * تبدیل تمام اعداد به فارسی
   */
  private convertToPersian(value: string): string {
    let result = value;
    
    // Convert English numbers
    for (const [english, persian] of Object.entries(this.englishToPersian)) {
      result = result.replace(new RegExp(english, 'g'), persian);
    }
    
    // Convert Arabic numbers to Persian
    for (const [arabic, english] of Object.entries(this.arabicToEnglish)) {
      const persian = this.englishToPersian[english];
      if (persian) {
        result = result.replace(new RegExp(arabic, 'g'), persian);
      }
    }
    
    return result;
  }

  /**
   * Convert mixed numbers to consistent format
   * تبدیل اعداد مختلط به فرمت یکسان
   */
  private normalizeNumbers(value: string, targetFormat: 'english' | 'persian' = 'english'): string {
    if (targetFormat === 'english') {
      return this.convertToEnglish(value);
    } else {
      return this.convertToPersian(value);
    }
  }

  /**
   * Extract numbers from text
   * استخراج اعداد از متن
   */
  private extractNumbers(value: string): string[] {
    const englishNumbers = value.match(/\d+/g) || [];
    const persianNumbers = value.match(/[۰-۹]+/g) || [];
    const arabicNumbers = value.match(/[٠-٩]+/g) || [];
    
    return [...englishNumbers, ...persianNumbers, ...arabicNumbers];
  }

  /**
   * Format number with thousand separators
   * فرمت عدد با جداکننده هزارگان
   */
  private formatWithSeparators(value: string, separator: string = ','): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}