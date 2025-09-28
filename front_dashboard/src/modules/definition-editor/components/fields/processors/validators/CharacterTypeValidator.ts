// Character Type Validator - Character type control and validation processor
// اعتبارسنج نوع کاراکتر - پردازشگر کنترل و اعتبارسنجی نوع کاراکتر

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Character type validation processor
 * پردازشگر اعتبارسنجی نوع کاراکتر
 */
export class CharacterTypeValidator implements IFieldProcessor {
  name = 'CharacterTypeValidator';
  priority = 10;
  enabled = true;

  // Character sets
  // مجموعه کاراکترها
  private readonly PERSIAN_LETTERS = /[\u0600-\u06FF]/;
  private readonly ENGLISH_LETTERS = /[a-zA-Z]/;
  private readonly NUMBERS = /[0-9\u06F0-\u06F9\u0660-\u0669]/;
  private readonly SPACES = /\s/;
  private readonly PUNCTUATION = /[.,;:!?()[\]{}"'-]/;

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    const hasCharacterControl = context.field.characterControl && context.field.characterControl !== 'all';
    const hasAllowedCharset = context.field.allowedCharset && context.field.allowedCharset !== 'all';
    const hasCustomRegex = !!context.field.customRegex;
    const hasValue = !!context.currentValue;
    
    return (hasCharacterControl || hasAllowedCharset || hasCustomRegex) && hasValue;
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    let processedValue = currentValue;
    const validationErrors: string[] = [];

    try {
      // Apply character control filtering
      if (field.characterControl && field.characterControl !== 'all') {
        processedValue = this.filterCharacters(processedValue, field.characterControl);
      }

      // Apply charset validation
      if (field.allowedCharset && field.allowedCharset !== 'all') {
        const isValid = this.validateCharset(processedValue, field.allowedCharset);
        if (!isValid) {
          validationErrors.push(this.getCharsetErrorMessage(field.allowedCharset));
        }
      }

      // Apply custom regex validation
      if (field.customRegex) {
        const isValid = this.validateCustomRegex(processedValue, field.customRegex);
        if (!isValid) {
          validationErrors.push('مقدار وارد شده با الگوی تعریف شده مطابقت ندارد');
        }
      }

      return {
        value: processedValue,
        isValid: validationErrors.length === 0,
        hasChanges: processedValue !== currentValue,
        context,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Character validation failed: ${error}`]
      };
    }
  }

  /**
   * Filter characters based on control type
   * فیلتر کاراکترها بر اساس نوع کنترل
   */
  private filterCharacters(value: string, controlType: string): string {
    switch (controlType) {
      case 'letters-only':
        return this.filterLettersOnly(value);
      case 'letters-numbers':
        return this.filterLettersAndNumbers(value);
      case 'custom':
        // Custom filtering will be handled by custom regex
        return value;
      default:
        return value;
    }
  }

  /**
   * Filter to keep only letters and spaces
   * فیلتر برای نگه داشتن فقط حروف و فاصله
   */
  private filterLettersOnly(value: string): string {
    return value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
  }

  /**
   * Filter to keep only letters, numbers and spaces
   * فیلتر برای نگه داشتن فقط حروف، اعداد و فاصله
   */
  private filterLettersAndNumbers(value: string): string {
    return value.replace(/[^a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\u0660-\u0669\s]/g, '');
  }

  /**
   * Validate character set
   * اعتبارسنجی مجموعه کاراکتر
   */
  private validateCharset(value: string, charsetType: string): boolean {
    switch (charsetType) {
      case 'letters':
        return this.isLettersOnly(value);
      case 'alphanumeric':
        return this.isAlphanumeric(value);
      case 'custom':
        // Custom validation will be handled separately
        return true;
      default:
        return true;
    }
  }

  /**
   * Check if value contains only letters and spaces
   * بررسی اینکه مقدار فقط شامل حروف و فاصله است
   */
  private isLettersOnly(value: string): boolean {
    return /^[a-zA-Z\u0600-\u06FF\s]*$/.test(value);
  }

  /**
   * Check if value contains only alphanumeric characters and spaces
   * بررسی اینکه مقدار فقط شامل حروف، اعداد و فاصله است
   */
  private isAlphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\u0660-\u0669\s]*$/.test(value);
  }

  /**
   * Validate against custom regex
   * اعتبارسنجی در برابر regex سفارشی
   */
  private validateCustomRegex(value: string, customRegex: string): boolean {
    try {
      const regex = new RegExp(customRegex);
      return regex.test(value);
    } catch (error) {
      console.warn('Invalid custom regex:', customRegex, error);
      return true; // Don't fail validation for invalid regex
    }
  }

  /**
   * Get error message for charset validation
   * دریافت پیام خطا برای اعتبارسنجی مجموعه کاراکتر
   */
  private getCharsetErrorMessage(charsetType: string): string {
    switch (charsetType) {
      case 'letters':
        return 'فقط حروف مجاز هستند';
      case 'alphanumeric':
        return 'فقط حروف و اعداد مجاز هستند';
      case 'custom':
        return 'کاراکترهای وارد شده مجاز نیستند';
      default:
        return 'کاراکترهای نامعتبر';
    }
  }

  /**
   * Analyze character composition
   * تحلیل ترکیب کاراکتر
   */
  private analyzeCharacters(value: string): {
    persianLetters: number;
    englishLetters: number;
    numbers: number;
    spaces: number;
    punctuation: number;
    other: number;
  } {
    const analysis = {
      persianLetters: 0,
      englishLetters: 0,
      numbers: 0,
      spaces: 0,
      punctuation: 0,
      other: 0
    };

    for (const char of value) {
      if (this.PERSIAN_LETTERS.test(char)) {
        analysis.persianLetters++;
      } else if (this.ENGLISH_LETTERS.test(char)) {
        analysis.englishLetters++;
      } else if (this.NUMBERS.test(char)) {
        analysis.numbers++;
      } else if (this.SPACES.test(char)) {
        analysis.spaces++;
      } else if (this.PUNCTUATION.test(char)) {
        analysis.punctuation++;
      } else {
        analysis.other++;
      }
    }

    return analysis;
  }

  /**
   * Get suggestions based on character analysis
   * دریافت پیشنهادات بر اساس تحلیل کاراکتر
   */
  private getSuggestions(value: string, field: any): string[] {
    const suggestions: string[] = [];
    const analysis = this.analyzeCharacters(value);

    // Suggest removing invalid characters
    if (field.characterControl === 'letters-only' && (analysis.numbers > 0 || analysis.other > 0)) {
      suggestions.push('اعداد و کاراکترهای خاص را حذف کنید');
    }

    if (field.characterControl === 'letters-numbers' && analysis.other > 0) {
      suggestions.push('کاراکترهای خاص را حذف کنید');
    }

    // Suggest text direction
    if (analysis.persianLetters > analysis.englishLetters) {
      suggestions.push('متن فارسی تشخیص داده شد - راست‌چین کنید');
    } else if (analysis.englishLetters > analysis.persianLetters) {
      suggestions.push('متن انگلیسی تشخیص داده شد - چپ‌چین کنید');
    }

    return suggestions;
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}