// Control Rules Processor - Field control rules processor
// پردازشگر قوانین کنترلی - پردازشگر قوانین کنترلی فیلد

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Control rules processor
 * پردازشگر قوانین کنترلی
 */
export class ControlRulesProcessor implements IFieldProcessor {
  name = 'ControlRulesProcessor';
  priority = 35;
  enabled = true;
  
  // Cache for performance optimization
  private controlCache = new Map<string, any>();
  private lastFormDataHash = '';
  private debounceTimer: NodeJS.Timeout | null = null;
  private processingQueue = new Map<string, Promise<any>>();

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.controlRules &&
      context.formData &&
      Object.keys(context.formData).length > 0
    );
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  process(context: ProcessingContext): ProcessingResult {
    const { field, formData, currentValue } = context;
    const validationErrors: string[] = [];
    const suggestions: string[] = [];

    try {
      if (field.controlRules) {
        const rules = field.controlRules;
        
        // Check if form data has changed to invalidate cache
        const currentFormDataHash = this.generateFormDataHash(formData);
        if (currentFormDataHash !== this.lastFormDataHash) {
          this.controlCache.clear();
          this.lastFormDataHash = currentFormDataHash;
        }

        // Use cached result if available
        const cacheKey = this.generateCacheKey(field, formData, currentValue);
        const cachedResult = this.getCachedControl(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }

        // Process default value
        if (rules.defaultValue !== undefined) {
          const sanitizedDefaultValue = this.sanitizeInput(rules.defaultValue);
          const defaultValueResult = this.processDefaultValue(sanitizedDefaultValue, field, currentValue);
          if (!defaultValueResult.isValid) {
            validationErrors.push(...defaultValueResult.errors);
            suggestions.push(...defaultValueResult.suggestions);
          }
        }

        // Process lock after save
        if (rules.lockAfterSave) {
          const lockResult = this.processLockAfterSave(rules.lockAfterSave, field, formData);
          if (!lockResult.isValid) {
            validationErrors.push(...lockResult.errors);
            suggestions.push(...lockResult.suggestions);
          }
        }

        // Process read only
        if (rules.readOnly) {
          const readOnlyResult = this.processReadOnly(rules.readOnly, field, formData);
          if (!readOnlyResult.isValid) {
            validationErrors.push(...readOnlyResult.errors);
            suggestions.push(...readOnlyResult.suggestions);
          }
        }

        // Process advanced rules
        if (rules.advanced) {
          const advancedResult = this.processAdvancedRules(rules.advanced, field, formData);
          if (!advancedResult.isValid) {
            validationErrors.push(...advancedResult.errors);
            suggestions.push(...advancedResult.suggestions);
          }
        }

        // Cache the result
        const result = {
          value: context.currentValue,
          isValid: validationErrors.length === 0,
          hasChanges: false,
          context,
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        };
        
        this.setCachedControl(cacheKey, result);
        return result;
      }

      return {
        value: context.currentValue,
        isValid: true,
        hasChanges: false,
        context
      };

    } catch (error) {
      return {
        value: context.currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Control rules processing failed: ${error}`]
      };
    }
  }

  /**
   * Process default value
   * پردازش مقدار پیش‌فرض
   */
  private processDefaultValue(defaultValue: string, field: any, currentValue: any): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate default value type
    if (defaultValue && !this.isValidDefaultValue(defaultValue, field.type)) {
      errors.push(`مقدار پیش‌فرض با نوع فیلد ${field.type} سازگار نیست`);
      suggestions.push('نوع مقدار پیش‌فرض را بررسی کنید');
    }

    // Validate default value length
    if (defaultValue && field.validationRules) {
      const rules = field.validationRules;
      
      if (rules.minLength && defaultValue.length < rules.minLength) {
        errors.push(`مقدار پیش‌فرض باید حداقل ${rules.minLength} کاراکتر باشد`);
        suggestions.push(`حداقل ${rules.minLength} کاراکتر وارد کنید`);
      }
      
      if (rules.maxLength && defaultValue.length > rules.maxLength) {
        errors.push(`مقدار پیش‌فرض باید حداکثر ${rules.maxLength} کاراکتر باشد`);
        suggestions.push(`حداکثر ${rules.maxLength} کاراکتر مجاز است`);
      }
    }

    // Validate default value pattern
    if (defaultValue && field.validationRules?.pattern) {
      try {
        const regex = new RegExp(field.validationRules.pattern);
        if (!regex.test(defaultValue)) {
          errors.push('مقدار پیش‌فرض با الگوی تعریف شده مطابقت ندارد');
          suggestions.push('مقدار پیش‌فرض را با الگوی فیلد تطبیق دهید');
        }
      } catch (error) {
        errors.push('الگوی اعتبارسنجی نامعتبر است');
        suggestions.push('الگوی regex را بررسی کنید');
      }
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  /**
   * Process lock after save
   * پردازش قفل بعد از ذخیره
   */
  private processLockAfterSave(lockAfterSave: boolean, field: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicts with readOnly
    if (lockAfterSave && field.controlRules?.readOnly) {
      errors.push('قفل بعد از ذخیره با فقط خواندنی تداخل دارد');
      suggestions.push('یکی از قوانین را انتخاب کنید');
    }

    // Check for conflicts with editableAfterSave
    if (lockAfterSave && field.editableAfterSave === false) {
      errors.push('قفل بعد از ذخیره با غیرقابل ویرایش بعد از ذخیره تداخل دارد');
      suggestions.push('تنظیمات تداخل‌دار را بررسی کنید');
    }

    // Check for conflicts with conditional enable
    if (lockAfterSave && field.conditionalRules?.enable?.enabled) {
      suggestions.push('قفل بعد از ذخیره ممکن است با فعال‌سازی شرطی تداخل داشته باشد');
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  /**
   * Process read only
   * پردازش فقط خواندنی
   */
  private processReadOnly(readOnly: boolean, field: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicts with lockAfterSave
    if (readOnly && field.controlRules?.lockAfterSave) {
      errors.push('فقط خواندنی با قفل بعد از ذخیره تداخل دارد');
      suggestions.push('یکی از قوانین را انتخاب کنید');
    }

    // Check for conflicts with editableAfterSave
    if (readOnly && field.editableAfterSave === true) {
      errors.push('فقط خواندنی با قابل ویرایش بعد از ذخیره تداخل دارد');
      suggestions.push('تنظیمات تداخل‌دار را بررسی کنید');
    }

    // Check for conflicts with conditional enable
    if (readOnly && field.conditionalRules?.enable?.enabled) {
      suggestions.push('فقط خواندنی ممکن است با فعال‌سازی شرطی تداخل داشته باشد');
    }

    // Check for conflicts with auto save
    if (readOnly && field.enableAutoSave) {
      suggestions.push('فقط خواندنی با ذخیره خودکار تداخل دارد');
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  /**
   * Validate default value type
   * اعتبارسنجی نوع مقدار پیش‌فرض
   */
  private isValidDefaultValue(value: string, fieldType: string): boolean {
    if (!value) return true;

    switch (fieldType) {
      case 'text':
      case 'email':
      case 'password':
      case 'textarea':
      case 'text-english':
      case 'text-numeric':
        return typeof value === 'string';
      
      case 'number':
        return !isNaN(Number(value));
      
      case 'date':
        return !isNaN(Date.parse(value));
      
      case 'boolean':
        return value === 'true' || value === 'false';
      
      case 'select':
      case 'multiselect':
        return Array.isArray(value) || typeof value === 'string';
      
      default:
        return true;
    }
  }

  /**
   * Generate hash for form data to detect changes
   * تولید هش برای تشخیص تغییرات فرم
   */
  private generateFormDataHash(formData: Record<string, any>): string {
    const keys = Object.keys(formData).sort();
    const values = keys.map(key => String(formData[key] || ''));
    return keys.join(',') + '|' + values.join(',');
  }

  /**
   * Get cached control result
   * دریافت نتیجه کنترلی از cache
   */
  private getCachedControl(key: string): any {
    return this.controlCache.get(key);
  }

  /**
   * Set cached control result
   * ذخیره نتیجه کنترلی در cache
   */
  private setCachedControl(key: string, result: any): void {
    this.controlCache.set(key, result);
  }

  /**
   * Process advanced rules
   * پردازش قوانین پیشرفته
   */
  private processAdvancedRules(advanced: any, field: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Process conditional default value
    if (advanced.enableConditionalDefault && advanced.conditionalDefaultValue) {
      try {
        // Sanitize conditional default value
        const sanitizedValue = this.sanitizeInput(advanced.conditionalDefaultValue);
        // Validate conditional default value
        const isValid = this.isValidDefaultValue(sanitizedValue, field.type);
        if (!isValid) {
          errors.push('مقدار پیش‌فرض شرطی با نوع فیلد سازگار نیست');
          suggestions.push('نوع مقدار پیش‌فرض شرطی را بررسی کنید');
        }
      } catch (error) {
        errors.push('خطا در پردازش مقدار پیش‌فرض شرطی');
      }
    }

    // Process conditional lock rule
    if (advanced.enableConditionalLock && advanced.conditionalLockRule) {
      try {
        // Validate JavaScript rule
        const isValid = this.isValidJavaScriptRule(advanced.conditionalLockRule);
        if (!isValid) {
          errors.push('قانون قفل شرطی نامعتبر است');
          suggestions.push('قانون JavaScript را بررسی کنید');
        }
      } catch (error) {
        errors.push('خطا در پردازش قانون قفل شرطی');
      }
    }

    // Process conditional read only rule
    if (advanced.enableConditionalReadOnly && advanced.conditionalReadOnlyRule) {
      try {
        // Validate JavaScript rule
        const isValid = this.isValidJavaScriptRule(advanced.conditionalReadOnlyRule);
        if (!isValid) {
          errors.push('قانون فقط خواندنی شرطی نامعتبر است');
          suggestions.push('قانون JavaScript را بررسی کنید');
        }
      } catch (error) {
        errors.push('خطا در پردازش قانون فقط خواندنی شرطی');
      }
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  /**
   * Validate JavaScript rule
   * اعتبارسنجی قانون JavaScript
   */
  private isValidJavaScriptRule(rule: string): boolean {
    if (!rule || rule.trim() === '') return false;
    
    // Security validation
    if (!this.isSecureJavaScriptRule(rule)) {
      return false;
    }
    
    try {
      // Basic syntax validation
      new Function('formData', `return ${rule}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if JavaScript rule is secure
   * بررسی امنیت قانون JavaScript
   */
  private isSecureJavaScriptRule(rule: string): boolean {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /function\s*\(/,
      /new\s+\w+/,
      /delete\s+\w+/,
      /window\./,
      /document\./,
      /global\./,
      /process\./,
      /require\s*\(/,
      /import\s+/,
      /export\s+/,
      /module\./,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /alert\s*\(/,
      /confirm\s*\(/,
      /prompt\s*\(/,
      /localStorage\./,
      /sessionStorage\./,
      /cookie/,
      /XMLHttpRequest/,
      /fetch\s*\(/,
      /ajax/,
      /\.innerHTML/,
      /\.outerHTML/,
      /\.textContent/,
      /\.style\./,
      /\.className/,
      /\.id/
    ];

    return !dangerousPatterns.some(pattern => pattern.test(rule));
  }

  /**
   * Sanitize input value
   * پاکسازی مقدار ورودی
   */
  private sanitizeInput(value: string): string {
    if (!value) return '';
    
    return value
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[|&]/g, '') // Remove logical operators
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Generate cache key
   * تولید کلید cache
   */
  private generateCacheKey(field: any, formData: Record<string, any>, currentValue: any): string {
    const fieldId = field.id || field.name || 'unknown';
    const formDataHash = this.generateFormDataHash(formData);
    const valueHash = String(currentValue || '');
    return `${fieldId}_${formDataHash}_${valueHash}`;
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    this.controlCache.clear();
    this.lastFormDataHash = '';
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.processingQueue.clear();
  }
}
