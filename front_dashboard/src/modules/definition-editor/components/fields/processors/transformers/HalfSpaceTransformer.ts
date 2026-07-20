// Half-Space Transformer - Persian half-space fixing processor
// تبدیل‌کننده نیم‌فاصله - پردازشگر اصلاح نیم‌فاصله فارسی

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Half-space transformation processor
 * پردازشگر تبدیل نیم‌فاصله
 */
export class HalfSpaceTransformer implements IFieldProcessor {
  name = 'HalfSpaceTransformer';
  priority = 50;
  enabled = true;

  // Half-space character (U+200C Zero Width Non-Joiner)
  // کاراکتر نیم‌فاصله
  private readonly HALF_SPACE = '\u200C';
  
  // Common Persian prefixes and suffixes that need half-space
  // پیشوندها و پسوندهای فارسی رایج که نیاز به نیم‌فاصله دارند
  private readonly PREFIXES = [
    'می', 'نمی', 'بی', 'غیر', 'فرا', 'برون', 'درون', 'پیش', 'باز', 'هم'
  ];
  
  private readonly SUFFIXES = [
    'ها', 'های', 'ان', 'ات', 'تان', 'تون', 'شان', 'شون', 'مان', 'مون'
  ];

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.fixHalfSpace &&
      context.currentValue &&
      this.needsHalfSpaceFix(context.currentValue)
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
      if (context.field.fixHalfSpace) {
        transformedValue = this.fixHalfSpaces(currentValue);
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
        validationErrors: [`Half-space transformation failed: ${error}`]
      };
    }
  }

  /**
   * Check if text needs half-space fixing
   * بررسی نیاز متن به اصلاح نیم‌فاصله
   */
  private needsHalfSpaceFix(value: string): boolean {
    // Check for Persian text
    const hasPersianChars = /[\u0600-\u06FF]/.test(value);
    if (!hasPersianChars) return false;

    // Check for missing half-spaces in common patterns
    return this.hasMissingHalfSpaces(value) || this.hasExtraHalfSpaces(value);
  }

  /**
   * Check for missing half-spaces
   * بررسی نیم‌فاصله‌های گم شده
   */
  private hasMissingHalfSpaces(value: string): boolean {
    // Check for prefixes without half-space
    for (const prefix of this.PREFIXES) {
      const pattern = new RegExp(`${prefix}[^\u200C\\s]`, 'g');
      if (pattern.test(value)) return true;
    }
    
    // Check for suffixes without half-space
    for (const suffix of this.SUFFIXES) {
      const pattern = new RegExp(`[^\u200C\\s]${suffix}`, 'g');
      if (pattern.test(value)) return true;
    }
    
    return false;
  }

  /**
   * Check for extra half-spaces
   * بررسی نیم‌فاصله‌های اضافی
   */
  private hasExtraHalfSpaces(value: string): boolean {
    // Check for multiple consecutive half-spaces
    return /\u200C{2,}/.test(value);
  }

  /**
   * Fix half-spaces in Persian text
   * اصلاح نیم‌فاصله در متن فارسی
   */
  private fixHalfSpaces(value: string): string {
    let result = value;

    // Remove multiple consecutive half-spaces
    result = result.replace(/\u200C{2,}/g, this.HALF_SPACE);

    // Fix prefixes
    result = this.fixPrefixes(result);
    
    // Fix suffixes
    result = this.fixSuffixes(result);
    
    // Fix compound words
    result = this.fixCompoundWords(result);
    
    // Remove half-spaces at the beginning and end
    result = result.replace(/^\u200C+|\u200C+$/g, '');

    return result;
  }

  /**
   * Fix prefixes
   * اصلاح پیشوندها
   */
  private fixPrefixes(value: string): string {
    let result = value;
    
    for (const prefix of this.PREFIXES) {
      // Add half-space after prefix if missing
      const pattern = new RegExp(`\\b${prefix}([^\u200C\\s])`, 'g');
      result = result.replace(pattern, `${prefix}${this.HALF_SPACE}$1`);
      
      // Remove space before half-space
      const spacePattern = new RegExp(`\\b${prefix}\\s+\u200C`, 'g');
      result = result.replace(spacePattern, `${prefix}${this.HALF_SPACE}`);
    }
    
    return result;
  }

  /**
   * Fix suffixes
   * اصلاح پسوندها
   */
  private fixSuffixes(value: string): string {
    let result = value;
    
    for (const suffix of this.SUFFIXES) {
      // Add half-space before suffix if missing
      const pattern = new RegExp(`([^\u200C\\s])${suffix}\\b`, 'g');
      result = result.replace(pattern, `$1${this.HALF_SPACE}${suffix}`);
      
      // Remove space after half-space
      const spacePattern = new RegExp(`\u200C\\s+${suffix}\\b`, 'g');
      result = result.replace(spacePattern, `${this.HALF_SPACE}${suffix}`);
    }
    
    return result;
  }

  /**
   * Fix compound words
   * اصلاح کلمات مرکب
   */
  private fixCompoundWords(value: string): string {
    let result = value;

    // Common compound word patterns
    const compoundPatterns = [
      // خانه‌ای → خانه‌ای
      /(\w+)ای\b/g,
      // دست‌ساز → دست‌ساز  
      /(\w+)ساز\b/g,
      // خود‌کار → خود‌کار
      /خود(\w+)/g
    ];

    for (const pattern of compoundPatterns) {
      result = result.replace(pattern, (match, ...groups) => {
        if (!match.includes(this.HALF_SPACE)) {
          return match.replace(/(\w+)(\w+)/, `$1${this.HALF_SPACE}$2`);
        }
        return match;
      });
    }

    return result;
  }

  /**
   * Remove all half-spaces
   * حذف تمام نیم‌فاصله‌ها
   */
  private removeAllHalfSpaces(value: string): string {
    return value.replace(/\u200C/g, '');
  }

  /**
   * Normalize half-spaces (remove extras, keep necessary ones)
   * عادی‌سازی نیم‌فاصله‌ها
   */
  private normalizeHalfSpaces(value: string): string {
    return value
      .replace(/\u200C{2,}/g, this.HALF_SPACE)  // Multiple half-spaces to single
      .replace(/\s\u200C/g, this.HALF_SPACE)    // Space + half-space to half-space
      .replace(/\u200C\s/g, this.HALF_SPACE);   // Half-space + space to half-space
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}