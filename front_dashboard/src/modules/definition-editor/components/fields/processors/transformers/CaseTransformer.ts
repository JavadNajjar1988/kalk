// Case Transformer - Text case conversion processor
// تبدیل‌کننده حروف - پردازشگر تبدیل حالت متن

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Case transformation processor
 * پردازشگر تبدیل حروف
 */
export class CaseTransformer implements IFieldProcessor {
  name = 'CaseTransformer';
  priority = 20;
  enabled = true;

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.caseTransform && 
      context.field.caseTransform !== 'none' &&
      context.currentValue
    );
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    let transformedValue = currentValue;

    try {
      switch (field.caseTransform) {
        case 'lowercase':
          transformedValue = this.toLowerCase(currentValue);
          break;
        case 'uppercase':
          transformedValue = this.toUpperCase(currentValue);
          break;
        case 'capitalize':
          transformedValue = this.toCapitalize(currentValue);
          break;
        default:
          transformedValue = currentValue;
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
        validationErrors: [`Case transformation failed: ${error}`]
      };
    }
  }

  /**
   * Convert to lowercase
   * تبدیل به حروف کوچک
   */
  private toLowerCase(value: string): string {
    return value.toLowerCase();
  }

  /**
   * Convert to uppercase
   * تبدیل به حروف بزرگ
   */
  private toUpperCase(value: string): string {
    return value.toUpperCase();
  }

  /**
   * Capitalize first letter of each word
   * بزرگ کردن حرف اول هر کلمه
   */
  private toCapitalize(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}