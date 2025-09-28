// Field Enhancer - Main orchestrator for field value processing
// تقویت‌کننده فیلد - هماهنگ‌کننده اصلی برای پردازش مقادیر فیلد

import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import { FieldValueProcessor } from './core/FieldValueProcessor';
import { ProcessingOptions, ProcessingResult } from './core/ProcessingContext';

/**
 * Field enhancer configuration
 * پیکربندی تقویت‌کننده فیلد
 */
export interface FieldEnhancerConfig {
  enableRealTimeProcessing?: boolean;
  enableAsyncProcessing?: boolean;
  enableCaching?: boolean;
  enableDebugMode?: boolean;
  processingTimeout?: number;
  maxRetries?: number;
}

/**
 * Field enhancer for seamless integration with existing components
 * تقویت‌کننده فیلد برای یکپارچه‌سازی بدون درز با کامپوننت‌های موجود
 */
export class FieldEnhancer {
  private static instance: FieldEnhancer;
  private processor: FieldValueProcessor;
  private config: FieldEnhancerConfig;
  private isEnabled: boolean = true;

  private constructor(config: FieldEnhancerConfig = {}) {
    this.processor = FieldValueProcessor.getInstance();
    this.config = {
      enableRealTimeProcessing: true,
      enableAsyncProcessing: true,
      enableCaching: true,
      enableDebugMode: false,
      processingTimeout: 5000,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Get singleton instance
   * دریافت نمونه تک‌پارچه
   */
  static getInstance(config?: FieldEnhancerConfig): FieldEnhancer {
    if (!FieldEnhancer.instance) {
      FieldEnhancer.instance = new FieldEnhancer(config);
    }
    return FieldEnhancer.instance;
  }

  /**
   * Main processing method for field values
   * روش اصلی پردازش برای مقادیر فیلد
   */
  static async processValue(
    value: string,
    field: ExtendedCustomFieldDefinition,
    options: ProcessingOptions = {},
    formData?: Record<string, any>
  ): Promise<ProcessingResult> {
    const enhancer = FieldEnhancer.getInstance();
    
    if (!enhancer.isEnabled) {
      return {
        value,
        isValid: true,
        hasChanges: false,
        context: { field, currentValue: value, metadata: { timestamp: Date.now(), source: 'user_input', processingSteps: [], errors: [], warnings: [] } }
      };
    }

    try {
      const processingOptions: ProcessingOptions = {
        enableDebug: enhancer.config.enableDebugMode,
        timeout: enhancer.config.processingTimeout,
        maxRetries: enhancer.config.maxRetries,
        ...options
      };

      return await enhancer.processor.processValue(value, field, processingOptions, formData);
    } catch (error) {
      console.error('Field enhancement error:', error);
      return {
        value,
        isValid: false,
        hasChanges: false,
        context: { field, currentValue: value, metadata: { timestamp: Date.now(), source: 'user_input', processingSteps: [], errors: [], warnings: [] } },
        validationErrors: [`Enhancement failed: ${error}`]
      };
    }
  }

  /**
   * Synchronous processing for simple transformations
   * پردازش همزمان برای تبدیلات ساده
   */
  static processValueSync(
    value: string,
    field: ExtendedCustomFieldDefinition,
    options: ProcessingOptions = {}
  ): string {
    const enhancer = FieldEnhancer.getInstance();
    
    if (!enhancer.isEnabled || !enhancer.config.enableRealTimeProcessing) {
      return value;
    }

    try {
      return enhancer.processor.processValueSync(value, field, options);
    } catch (error) {
      console.warn('Sync enhancement error:', error);
      return value;
    }
  }

  /**
   * Enhanced onChange handler for field components
   * کنترل‌کننده onChange تقویت شده برای کامپوننت‌های فیلد
   */
  static createEnhancedChangeHandler(
    field: ExtendedCustomFieldDefinition,
    originalHandler: (fieldId: string, value: string) => void,
    options: {
      useAsyncProcessing?: boolean;
      formData?: Record<string, any>;
      onProcessingResult?: (result: ProcessingResult) => void;
    } = {}
  ) {
    const enhancer = FieldEnhancer.getInstance();
    
    return async (fieldId: string, rawValue: string) => {
      if (!enhancer.isEnabled) {
        originalHandler(fieldId, rawValue);
        return;
      }

      try {
        // Always apply sync processing first for immediate feedback
        const syncProcessedValue = FieldEnhancer.processValueSync(rawValue, field);
        
        // Call original handler with sync-processed value
        originalHandler(fieldId, syncProcessedValue);

        // If async processing is enabled, do full processing in background
        if (options.useAsyncProcessing && enhancer.config.enableAsyncProcessing) {
          const fullResult = await FieldEnhancer.processValue(
            syncProcessedValue,
            field,
            { enableDebug: enhancer.config.enableDebugMode },
            options.formData
          );

          // If async processing made additional changes, update again
          if (fullResult.hasChanges && fullResult.value !== syncProcessedValue) {
            originalHandler(fieldId, fullResult.value);
          }

          // Notify about processing result
          if (options.onProcessingResult) {
            options.onProcessingResult(fullResult);
          }
        }

      } catch (error) {
        console.error('Enhanced change handler error:', error);
        // Fallback to original behavior
        originalHandler(fieldId, rawValue);
      }
    };
  }

  /**
   * Get field processing suggestions
   * دریافت پیشنهادات پردازش فیلد
   */
  static async getFieldSuggestions(
    value: string,
    field: ExtendedCustomFieldDefinition,
    formData?: Record<string, any>
  ): Promise<string[]> {
    try {
      const result = await FieldEnhancer.processValue(value, field, { skipTransformation: true }, formData);
      return result.suggestions || [];
    } catch (error) {
      console.warn('Error getting field suggestions:', error);
      return [];
    }
  }

  /**
   * Validate field value
   * اعتبارسنجی مقدار فیلد
   */
  static async validateFieldValue(
    value: string,
    field: ExtendedCustomFieldDefinition,
    formData?: Record<string, any>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const result = await FieldEnhancer.processValue(
        value,
        field,
        { skipTransformation: true },
        formData
      );
      
      return {
        isValid: result.isValid,
        errors: result.validationErrors || []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Check if field needs processing
   * بررسی نیاز فیلد به پردازش
   */
  static fieldNeedsProcessing(field: ExtendedCustomFieldDefinition): boolean {
    return !!(
      field.caseTransform && field.caseTransform !== 'none' ||
      field.trimExtraSpaces ||
      field.convertNumbers ||
      field.fixHalfSpace ||
      field.characterControl && field.characterControl !== 'all' ||
      field.allowedCharset && field.allowedCharset !== 'all' ||
      field.customRegex ||
      field.enableSuggestions ||
      field.enableSensitiveDataDetection ||
      field.enableInappropriateWordsDetection
    );
  }

  /**
   * Enable/disable field enhancement
   * فعال/غیرفعال کردن تقویت فیلد
   */
  static setEnabled(enabled: boolean): void {
    const enhancer = FieldEnhancer.getInstance();
    enhancer.isEnabled = enabled;
  }

  /**
   * Update configuration
   * به‌روزرسانی پیکربندی
   */
  static updateConfig(newConfig: Partial<FieldEnhancerConfig>): void {
    const enhancer = FieldEnhancer.getInstance();
    enhancer.config = { ...enhancer.config, ...newConfig };
  }

  /**
   * Get enhancement statistics
   * دریافت آمار تقویت
   */
  static getStatistics(): {
    isEnabled: boolean;
    config: FieldEnhancerConfig;
    processorStats: any;
  } {
    const enhancer = FieldEnhancer.getInstance();
    return {
      isEnabled: enhancer.isEnabled,
      config: enhancer.config,
      processorStats: enhancer.processor.getStatistics()
    };
  }

  /**
   * Reset enhancement system
   * ریست سیستم تقویت
   */
  static reset(): void {
    const enhancer = FieldEnhancer.getInstance();
    enhancer.processor.reset();
    enhancer.isEnabled = true;
  }

  /**
   * Initialize the enhancement system
   * مقداردهی اولیه سیستم تقویت
   */
  static async initialize(config?: FieldEnhancerConfig): Promise<void> {
    const enhancer = FieldEnhancer.getInstance(config);
    await enhancer.processor.initialize();
  }
}