// Core Field Value Processor - Main processing orchestrator
// پردازشگر اصلی مقادیر فیلد - هماهنگ‌کننده اصلی پردازش

import { ExtendedCustomFieldDefinition } from '../../types/FieldEditTypes';
import {
  ProcessingContext,
  ProcessingResult,
  ProcessingOptions,
  createProcessingContext
} from './ProcessingContext';
import { ProcessingPipeline } from './ProcessingPipeline';

/**
 * Main field value processor singleton
 * پردازشگر اصلی مقادیر فیلد (تک‌نمونه)
 */
export class FieldValueProcessor {
  private static instance: FieldValueProcessor;
  private pipeline: ProcessingPipeline;
  private processingCache: Map<string, ProcessingResult> = new Map();
  private cacheTimeout: number = 5000; // 5 seconds
  private isInitialized: boolean = false;

  private constructor() {
    this.pipeline = new ProcessingPipeline();
  }

  /**
   * Get singleton instance
   * دریافت نمونه تک‌پارچه
   */
  static getInstance(): FieldValueProcessor {
    if (!FieldValueProcessor.instance) {
      FieldValueProcessor.instance = new FieldValueProcessor();
    }
    return FieldValueProcessor.instance;
  }

  /**
   * Initialize the processor with default processors
   * مقداردهی اولیه پردازشگر با پردازشگرهای پیش‌فرض
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Lazy load processors to avoid circular dependencies
      const { ContentTransformers } = await import('../transformers/index');
      const { CharacterValidators } = await import('../validators/index');
      const { SuggestionProcessor } = await import('../suggestions/index');
      const { BehaviorManager } = await import('../behavior/index');
      const { SecurityFilter } = await import('../security/index');

      // Register processors in priority order
      this.pipeline.registerProcessor(new CharacterValidators.CharacterTypeValidator(), {
        enabled: true,
        priority: 10
      });

      this.pipeline.registerProcessor(new CharacterValidators.ValidationRulesProcessor(), {
        enabled: true,
        priority: 15
      });

      this.pipeline.registerProcessor(new CharacterValidators.UniqueValidationProcessor(), {
        enabled: true,
        priority: 25
      });

      this.pipeline.registerProcessor(new CharacterValidators.ConditionalRulesProcessor(), {
        enabled: true,
        priority: 30
      });

      this.pipeline.registerProcessor(new CharacterValidators.ControlRulesProcessor(), {
        enabled: true,
        priority: 35
      });

      this.pipeline.registerProcessor(new ContentTransformers.CaseTransformer(), {
        enabled: true,
        priority: 20
      });

      this.pipeline.registerProcessor(new ContentTransformers.SpaceTransformer(), {
        enabled: true,
        priority: 30
      });

      this.pipeline.registerProcessor(new ContentTransformers.NumberTransformer(), {
        enabled: true,
        priority: 40
      });

      this.pipeline.registerProcessor(new ContentTransformers.HalfSpaceTransformer(), {
        enabled: true,
        priority: 50
      });

      this.pipeline.registerProcessor(new SuggestionProcessor.SuggestionManager(), {
        enabled: true,
        priority: 60
      });

      this.pipeline.registerProcessor(new SuggestionProcessor.MultiValueProcessor(), {
        enabled: true,
        priority: 65
      });

      this.pipeline.registerProcessor(new SecurityFilter.SensitiveDataDetector(), {
        enabled: true,
        priority: 70
      });

      this.pipeline.registerProcessor(new SecurityFilter.DataMaskingProcessor(), {
        enabled: true,
        priority: 75
      });

      this.pipeline.registerProcessor(new SecurityFilter.InappropriateWordsFilter(), {
        enabled: true,
        priority: 80
      });

      this.pipeline.registerProcessor(new BehaviorManager.ConditionalProcessor(), {
        enabled: true,
        priority: 100
      });

      this.pipeline.registerProcessor(new BehaviorManager.DependencyManager(), {
        enabled: true,
        priority: 105
      });

      this.pipeline.registerProcessor(new BehaviorManager.AutoSaveManager(), {
        enabled: true,
        priority: 110
      });

      this.isInitialized = true;
      console.log('FieldValueProcessor initialized successfully');

    } catch (error) {
      console.error('Failed to initialize FieldValueProcessor:', error);
      // Continue with basic functionality even if some processors fail to load
      this.isInitialized = true;
    }
  }

  /**
   * Process field value with full pipeline
   * پردازش مقدار فیلد با پایپ‌لاین کامل
   */
  async processValue(
    value: string,
    field: ExtendedCustomFieldDefinition,
    options: ProcessingOptions = {},
    formData?: Record<string, any>
  ): Promise<ProcessingResult> {
    // Ensure processor is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Create cache key
    const cacheKey = this.createCacheKey(value, field, options);
    
    // Check cache first
    if (!options.skipValidation) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Create processing context
    const context = createProcessingContext(field, value, undefined, formData);

    try {
      // Process through pipeline
      const result = await this.pipeline.processContext(context, options);
      
      // Cache the result
      this.setCachedResult(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('Field value processing error:', error);
      
      // Return safe fallback
      return {
        value,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Processing error: ${error}`]
      };
    }
  }

  /**
   * Quick synchronous processing for simple transformations
   * پردازش سریع همزمان برای تبدیلات ساده
   */
  processValueSync(
    value: string,
    field: ExtendedCustomFieldDefinition,
    options: ProcessingOptions = {}
  ): string {
    try {
      let processedValue = value;

      // Apply basic transformations synchronously
      if (field.caseTransform && field.caseTransform !== 'none') {
        processedValue = this.applyCaseTransform(processedValue, field.caseTransform);
      }

      if (field.trimWhitespace) {
        processedValue = this.applySpaceTrimming(processedValue);
      }

      if (field.characterControl && field.characterControl !== 'all') {
        processedValue = this.applyCharacterControl(processedValue, field.characterControl, field.customRegex);
      }

      if (field.normalizeDigits) {
        processedValue = this.applyNumberConversion(processedValue);
      }

      if (field.fixZWNJ) {
        processedValue = this.applyHalfSpaceFix(processedValue);
      }

      return processedValue;

    } catch (error) {
      console.warn('Sync processing error:', error);
      return value;
    }
  }

  /**
   * Apply case transformation
   * اعمال تبدیل حروف
   */
  private applyCaseTransform(value: string, transform: string): string {
    switch (transform) {
      case 'lowercase':
        return value.toLowerCase();
      case 'uppercase':
        return value.toUpperCase();
      case 'capitalize':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      default:
        return value;
    }
  }

  /**
   * Apply space trimming
   * اعمال حذف فاصله
   */
  private applySpaceTrimming(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  /**
   * Apply character control
   * اعمال کنترل کاراکتر
   */
  private applyCharacterControl(value: string, control: string, customRegex?: string): string {
    switch (control) {
      case 'letters':
        return value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
      case 'alphanumeric':
        return value.replace(/[^a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\s]/g, '');
      case 'custom':
        if (customRegex) {
          try {
            // For custom regex, we need to filter out characters that DON'T match the pattern
            // So we need to invert the logic - keep only characters that match
            const regex = new RegExp(customRegex, 'g');
            const matches = value.match(regex);
            return matches ? matches.join('') : '';
          } catch (error) {
            console.warn('Invalid custom regex:', customRegex);
            return value;
          }
        }
        return value;
      case 'all':
      default:
        return value;
    }
  }

  /**
   * Apply number conversion (Persian/Arabic to English)
   * اعمال تبدیل اعداد (فارسی/عربی به انگلیسی)
   */
  private applyNumberConversion(value: string): string {
    const persianToEnglish: Record<string, string> = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    
    const arabicToEnglish: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    
    let result = value;
    
    // Convert Persian numbers
    for (const [persian, english] of Object.entries(persianToEnglish)) {
      result = result.replace(new RegExp(persian, 'g'), english);
    }
    
    // Convert Arabic numbers
    for (const [arabic, english] of Object.entries(arabicToEnglish)) {
      result = result.replace(new RegExp(arabic, 'g'), english);
    }
    
    return result;
  }

  /**
   * Apply half-space fixing for Persian text
   * اعمال اصلاح نیم‌فاصله برای متن فارسی
   */
  private applyHalfSpaceFix(value: string): string {
    const HALF_SPACE = '\u200C';
    const PREFIXES = ['می', 'نمی', 'بی', 'غیر', 'فرا', 'برون', 'درون', 'پیش', 'باز', 'هم'];
    const SUFFIXES = ['ها', 'های', 'ان', 'ات', 'تان', 'تون', 'شان', 'شون', 'مان', 'مون'];
    
    let result = value;
    
    // Remove multiple consecutive half-spaces
    result = result.replace(/\u200C{2,}/g, HALF_SPACE);
    
    // Fix prefixes
    for (const prefix of PREFIXES) {
      const pattern = new RegExp(`\\b${prefix}([^\u200C\\s])`, 'g');
      result = result.replace(pattern, `${prefix}${HALF_SPACE}$1`);
    }
    
    // Fix suffixes
    for (const suffix of SUFFIXES) {
      const pattern = new RegExp(`([^\u200C\\s])${suffix}\\b`, 'g');
      result = result.replace(pattern, `$1${HALF_SPACE}${suffix}`);
    }
    
    // Remove half-spaces at the beginning and end
    result = result.replace(/^\u200C+|\u200C+$/g, '');
    
    return result;
  }

  /**
   * Create cache key for processing result
   * ایجاد کلید کش برای نتیجه پردازش
   */
  private createCacheKey(
    value: string,
    field: ExtendedCustomFieldDefinition,
    options: ProcessingOptions
  ): string {
    const fieldFingerprint = JSON.stringify({
      type: field.type,
      characterControl: field.characterControl,
      caseTransform: field.caseTransform,
      trimWhitespace: field.trimWhitespace,
      normalizeDigits: field.normalizeDigits,
      fixZWNJ: field.fixZWNJ,
      customRegex: field.customRegex
    });
    
    const optionsFingerprint = JSON.stringify(options);
    
    return `${value}:${fieldFingerprint}:${optionsFingerprint}`;
  }

  /**
   * Get cached processing result
   * دریافت نتیجه پردازش از کش
   */
  private getCachedResult(cacheKey: string): ProcessingResult | null {
    const cached = this.processingCache.get(cacheKey);
    if (cached && Date.now() - cached.context.metadata!.timestamp < this.cacheTimeout) {
      return cached;
    }
    
    if (cached) {
      this.processingCache.delete(cacheKey);
    }
    
    return null;
  }

  /**
   * Set cached processing result
   * تنظیم نتیجه پردازش در کش
   */
  private setCachedResult(cacheKey: string, result: ProcessingResult): void {
    // Limit cache size
    if (this.processingCache.size > 1000) {
      const firstKey = this.processingCache.keys().next().value;
      if (firstKey) {
        this.processingCache.delete(firstKey);
      }
    }
    
    this.processingCache.set(cacheKey, result);
  }

  /**
   * Clear processing cache
   * پاک کردن کش پردازش
   */
  clearCache(): void {
    this.processingCache.clear();
  }

  /**
   * Get processing statistics
   * دریافت آمار پردازش
   */
  getStatistics(): {
    cacheSize: number;
    pipelineStatus: any;
    isInitialized: boolean;
  } {
    return {
      cacheSize: this.processingCache.size,
      pipelineStatus: this.pipeline.getStatus(),
      isInitialized: this.isInitialized
    };
  }

  /**
   * Reset processor
   * ریست پردازشگر
   */
  reset(): void {
    this.clearCache();
    this.pipeline.clear();
    this.isInitialized = false;
  }
}