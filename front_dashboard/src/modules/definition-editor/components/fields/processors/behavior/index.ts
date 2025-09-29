// Behavior Manager module - Advanced conditional behavior and auto-save functionality
// ماژول مدیر رفتار - عملکرد رفتار شرطی پیشرفته و ذخیره خودکار

import { IFieldProcessor, ProcessingContext, ProcessingResult } from '../core/ProcessingContext';

/**
 * Conditional display/enable processor
 * پردازشگر نمایش/فعال‌سازی شرطی
 */
export class ConditionalProcessor implements IFieldProcessor {
  name = 'ConditionalProcessor';
  priority = 100;
  enabled = true;

  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.enableConditionalDisplay ||
      context.field.enableConditionalEnable ||
      context.field.conditionalVisibility?.enabled ||
      context.field.conditionalEnable?.enabled
    );
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue, formData } = context;
    let isValid = true;
    const validationErrors: string[] = [];

    try {
      // Check conditional visibility
      if (field.conditionalVisibility?.enabled && formData) {
        const shouldBeVisible = this.evaluateCondition(
          field.conditionalVisibility,
          formData
        );
        
        if (!shouldBeVisible) {
          validationErrors.push('این فیلد در شرایط فعلی قابل نمایش نیست');
          isValid = false;
        }
      }

      // Check conditional enable
      if (field.conditionalEnable?.enabled && formData) {
        const shouldBeEnabled = this.evaluateCondition(
          field.conditionalEnable,
          formData
        );
        
        if (!shouldBeEnabled) {
          validationErrors.push('این فیلد در شرایط فعلی غیرفعال است');
          isValid = false;
        }
      }

      // Legacy conditional display
      if (field.enableConditionalDisplay && field.conditionalDisplayField && formData) {
        const dependentValue = formData[field.conditionalDisplayField];
        const shouldDisplay = this.evaluateLegacyCondition(
          dependentValue,
          field.conditionalDisplayOperator || 'equals',
          field.conditionalDisplayValue
        );
        
        if (!shouldDisplay) {
          validationErrors.push('شرایط نمایش فیلد برآورده نشده است');
          isValid = false;
        }
      }

      // Legacy conditional enable
      if (field.enableConditionalEnable && field.conditionalEnableField && formData) {
        const dependentValue = formData[field.conditionalEnableField];
        const shouldEnable = this.evaluateLegacyCondition(
          dependentValue,
          field.conditionalEnableOperator || 'equals',
          field.conditionalEnableValue
        );
        
        if (!shouldEnable) {
          validationErrors.push('شرایط فعال‌سازی فیلد برآورده نشده است');
          isValid = false;
        }
      }

      return {
        value: currentValue,
        isValid,
        hasChanges: false,
        context,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Conditional processing failed: ${error}`]
      };
    }
  }

  /**
   * Evaluate modern condition format
   * ارزیابی فرمت شرط مدرن
   */
  private evaluateCondition(
    condition: { fieldId?: string; condition?: string; value?: string },
    formData: Record<string, any>
  ): boolean {
    if (!condition.fieldId || !condition.condition) {
      return true;
    }

    const fieldValue = formData[condition.fieldId];
    const expectedValue = condition.value;
    
    return this.evaluateLegacyCondition(
      fieldValue,
      condition.condition as any,
      expectedValue
    );
  }

  /**
   * Evaluate legacy condition format
   * ارزیابی فرمت شرط قدیمی
   */
  private evaluateLegacyCondition(
    fieldValue: any,
    operator: string,
    expectedValue: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'contains':
        return String(fieldValue || '').includes(String(expectedValue || ''));
      case 'not_contains':
        return !String(fieldValue || '').includes(String(expectedValue || ''));
      case 'empty':
        return !fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined;
      case 'not_empty':
        return fieldValue && fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
      default:
        return true;
    }
  }

  cleanup(): void {}
}

/**
 * Auto-save manager with intelligent timing
 * مدیر ذخیره خودکار با زمان‌بندی هوشمند
 */
export class AutoSaveManager implements IFieldProcessor {
  name = 'AutoSaveManager';
  priority = 110;
  enabled = true;
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastSaveAttempts: Map<string, number> = new Map();

  canProcess(context: ProcessingContext): boolean {
    return !!(context.field.enableAutoSave && context.field.autoSaveDelay);
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    
    if (field.enableAutoSave && field.autoSaveDelay) {
      this.scheduleAutoSave(field.id, currentValue, field.autoSaveDelay);
    }

    return {
      value: currentValue,
      isValid: true,
      hasChanges: false,
      context
    };
  }

  /**
   * Schedule auto-save with debouncing
   * زمان‌بندی ذخیره خودکار با تأخیر
   */
  private scheduleAutoSave(fieldId: string, value: string, delay: number): void {
    // Clear existing timer
    const existingTimer = this.saveTimers.get(fieldId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new save
    const timer = setTimeout(() => {
      this.performAutoSave(fieldId, value);
      this.saveTimers.delete(fieldId);
    }, delay);

    this.saveTimers.set(fieldId, timer);
  }

  /**
   * Perform the actual auto-save
   * انجام ذخیره خودکار واقعی
   */
  private performAutoSave(fieldId: string, value: string): void {
    try {
      const now = Date.now();
      const lastAttempt = this.lastSaveAttempts.get(fieldId) || 0;
      
      // Prevent too frequent saves (minimum 5 seconds apart)
      if (now - lastAttempt < 5000) {
        return;
      }

      this.lastSaveAttempts.set(fieldId, now);
      
      // Trigger auto-save event (can be listened to by parent components)
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('fieldAutoSave', {
          detail: { fieldId, value, timestamp: now }
        });
        window.dispatchEvent(event);
      }
      
      console.log(`Auto-saved field ${fieldId} with value: ${value}`);
      
    } catch (error) {
      console.warn(`Auto-save failed for field ${fieldId}:`, error);
    }
  }

  cleanup(): void {
    // Clear all pending timers
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();
    this.lastSaveAttempts.clear();
  }
}

/**
 * Field dependency manager
 * مدیر وابستگی فیلدها
 */
export class DependencyManager implements IFieldProcessor {
  name = 'DependencyManager';
  priority = 105;
  enabled = true;
  private dependencyCache: Map<string, any> = new Map();

  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.conditionalRules?.visibility?.enabled ||
      context.field.conditionalRules?.enable?.enabled ||
      context.field.conditionalRules?.required?.enabled
    );
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue, formData } = context;
    let isValid = true;
    const validationErrors: string[] = [];

    try {
      if (!formData) {
        return {
          value: currentValue,
          isValid: true,
          hasChanges: false,
          context
        };
      }

      // Check required dependency
      if (field.conditionalRules?.required?.enabled) {
        const isRequired = this.evaluateRuleCondition(
          field.conditionalRules.required,
          formData
        );
        
        if (isRequired && (!currentValue || currentValue.trim() === '')) {
          validationErrors.push('این فیلد در شرایط فعلی اجباری است');
          isValid = false;
        }
      }

      // Check custom rules
      if (field.conditionalRules?.custom?.enabled && field.conditionalRules.custom.rule) {
        const customValid = this.evaluateCustomRule(
          field.conditionalRules.custom.rule,
          currentValue,
          formData
        );
        
        if (!customValid) {
          validationErrors.push(
            field.conditionalRules.custom.message || 'قانون سفارشی نقض شده است'
          );
          isValid = false;
        }
      }

      return {
        value: currentValue,
        isValid,
        hasChanges: false,
        context,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Dependency processing failed: ${error}`]
      };
    }
  }

  /**
   * Evaluate rule condition
   * ارزیابی شرط قانون
   */
  private evaluateRuleCondition(
    rule: { dependsOn?: string; condition?: string; value?: string },
    formData: Record<string, any>
  ): boolean {
    if (!rule.dependsOn || !rule.condition) {
      return false;
    }

    const dependentValue = formData[rule.dependsOn];
    const expectedValue = rule.value;
    
    switch (rule.condition) {
      case 'equals':
        return dependentValue === expectedValue;
      case 'not_equals':
        return dependentValue !== expectedValue;
      case 'contains':
        return String(dependentValue || '').includes(String(expectedValue || ''));
      case 'not_contains':
        return !String(dependentValue || '').includes(String(expectedValue || ''));
      case 'empty':
        return !dependentValue || dependentValue === '';
      case 'not_empty':
        return dependentValue && dependentValue !== '';
      default:
        return false;
    }
  }

  /**
   * Evaluate custom JavaScript rule
   * ارزیابی قانون سفارشی جاوااسکریپت
   */
  private evaluateCustomRule(
    rule: string,
    value: string,
    formData: Record<string, any>
  ): boolean {
    try {
      // Create a safe evaluation context
      const context = {
        value,
        formData,
        // Safe utility functions
        isEmpty: (v: any) => !v || v === '',
        isNotEmpty: (v: any) => v && v !== '',
        length: (v: string) => String(v || '').length,
        includes: (v: string, search: string) => String(v || '').includes(search),
        startsWith: (v: string, prefix: string) => String(v || '').startsWith(prefix),
        endsWith: (v: string, suffix: string) => String(v || '').endsWith(suffix),
        matches: (v: string, pattern: string) => new RegExp(pattern).test(String(v || '')),
        // Math functions
        Math: {
          max: Math.max,
          min: Math.min,
          abs: Math.abs,
          round: Math.round,
          floor: Math.floor,
          ceil: Math.ceil
        }
      };

      // Create function with limited scope
      const func = new Function('context', `
        with (context) {
          return ${rule};
        }
      `);

      return Boolean(func(context));
      
    } catch (error) {
      console.warn('Custom rule evaluation failed:', error);
      return false;
    }
  }

  cleanup(): void {
    this.dependencyCache.clear();
  }
}

export const BehaviorManager = { 
  ConditionalProcessor, 
  AutoSaveManager, 
  DependencyManager 
};