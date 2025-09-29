// Unique Validation Processor - Unique value validation processor
// پردازشگر اعتبارسنجی یکتا - پردازشگر اعتبارسنجی مقدار یکتا

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Unique validation processor
 * پردازشگر اعتبارسنجی یکتا
 */
export class UniqueValidationProcessor implements IFieldProcessor {
  name = 'UniqueValidationProcessor';
  priority = 25;
  enabled = true;

  // In-memory storage for demonstration (in real app, this would be a database)
  private static uniqueValues: Map<string, Set<string>> = new Map();

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.validationRules?.unique &&
      context.currentValue !== undefined &&
      context.currentValue !== null &&
      context.currentValue !== ''
    );
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  async process(context: ProcessingContext): Promise<ProcessingResult> {
    const { field, currentValue } = context;
    const validationErrors: string[] = [];
    const suggestions: string[] = [];

    try {
      if (field.validationRules?.unique) {
        const value = String(currentValue);
        const fieldKey = `${field.englishName || field.name}`;
        
        // Initialize field storage if not exists
        if (!UniqueValidationProcessor.uniqueValues.has(fieldKey)) {
          UniqueValidationProcessor.uniqueValues.set(fieldKey, new Set());
        }
        
        const fieldValues = UniqueValidationProcessor.uniqueValues.get(fieldKey)!;
        
        // Check if value already exists
        if (fieldValues.has(value)) {
          validationErrors.push('این مقدار قبلاً استفاده شده است');
          suggestions.push('مقدار یکتای دیگری وارد کنید');
        } else {
          // Add value to storage (in real app, this would be a database insert)
          fieldValues.add(value);
        }
      }

      return {
        value: currentValue,
        isValid: validationErrors.length === 0,
        hasChanges: false,
        context,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Unique validation failed: ${error}`]
      };
    }
  }

  /**
   * Check if value is unique (async method for database checks)
   * بررسی یکتایی مقدار (متد async برای بررسی پایگاه داده)
   */
  private async checkUniquenessInDatabase(fieldKey: string, value: string): Promise<boolean> {
    // This would be an actual database query in a real implementation
    // For now, we'll simulate with a delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate database check
    const fieldValues = UniqueValidationProcessor.uniqueValues.get(fieldKey);
    return !fieldValues || !fieldValues.has(value);
  }

  /**
   * Add value to unique storage
   * اضافه کردن مقدار به ذخیره‌سازی یکتا
   */
  static addUniqueValue(fieldKey: string, value: string): void {
    if (!UniqueValidationProcessor.uniqueValues.has(fieldKey)) {
      UniqueValidationProcessor.uniqueValues.set(fieldKey, new Set());
    }
    UniqueValidationProcessor.uniqueValues.get(fieldKey)!.add(value);
  }

  /**
   * Remove value from unique storage
   * حذف مقدار از ذخیره‌سازی یکتا
   */
  static removeUniqueValue(fieldKey: string, value: string): void {
    const fieldValues = UniqueValidationProcessor.uniqueValues.get(fieldKey);
    if (fieldValues) {
      fieldValues.delete(value);
    }
  }

  /**
   * Clear all unique values for a field
   * پاک کردن تمام مقادیر یکتا برای یک فیلد
   */
  static clearFieldValues(fieldKey: string): void {
    UniqueValidationProcessor.uniqueValues.delete(fieldKey);
  }

  /**
   * Get all unique values for a field
   * دریافت تمام مقادیر یکتا برای یک فیلد
   */
  static getFieldValues(fieldKey: string): string[] {
    const fieldValues = UniqueValidationProcessor.uniqueValues.get(fieldKey);
    return fieldValues ? Array.from(fieldValues) : [];
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}
