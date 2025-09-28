// Space Transformer - Space trimming and normalization processor
// تبدیل‌کننده فاصله - پردازشگر حذف و عادی‌سازی فاصله

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Space transformation processor
 * پردازشگر تبدیل فاصله
 */
export class SpaceTransformer implements IFieldProcessor {
  name = 'SpaceTransformer';
  priority = 30;
  enabled = true;

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.trimExtraSpaces &&
      context.currentValue
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
      if (context.field.trimExtraSpaces) {
        transformedValue = this.normalizeSpaces(currentValue);
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
        validationErrors: [`Space transformation failed: ${error}`]
      };
    }
  }

  /**
   * Normalize spaces - remove extra spaces and trim
   * عادی‌سازی فاصله‌ها - حذف فاصله‌های اضافی و برش
   */
  private normalizeSpaces(value: string): string {
    return value
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim();               // Remove leading and trailing spaces
  }

  /**
   * Remove all spaces
   * حذف تمام فاصله‌ها
   */
  private removeAllSpaces(value: string): string {
    return value.replace(/\s/g, '');
  }

  /**
   * Normalize line breaks
   * عادی‌سازی شکست خطوط
   */
  private normalizeLineBreaks(value: string): string {
    return value
      .replace(/\r\n/g, '\n')     // Windows to Unix line breaks
      .replace(/\r/g, '\n')       // Old Mac to Unix line breaks
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks to 2
  }

  /**
   * Advanced space normalization with Persian support
   * عادی‌سازی پیشرفته فاصله با پشتیبانی فارسی
   */
  private normalizeSpacesAdvanced(value: string): string {
    return value
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/\u00A0/g, ' ')                // Convert non-breaking space to regular space
      .replace(/\u2000-\u200A/g, ' ')         // Convert various Unicode spaces to regular space
      .replace(/\s+/g, ' ')                   // Replace multiple spaces with single space
      .trim();                                // Remove leading and trailing spaces
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}