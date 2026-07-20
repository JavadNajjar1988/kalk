// Conditional Rules Processor - Field conditional rules processor
// پردازشگر قوانین شرطی - پردازشگر قوانین شرطی فیلد

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Conditional rules processor
 * پردازشگر قوانین شرطی
 */
export class ConditionalRulesProcessor implements IFieldProcessor {
  name = 'ConditionalRulesProcessor';
  priority = 30;
  enabled = true;
  
  // Cache for performance optimization
  private conditionCache = new Map<string, boolean>();
  private lastFormDataHash = '';

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.conditionalRules &&
      context.formData &&
      Object.keys(context.formData).length > 0
    );
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  process(context: ProcessingContext): ProcessingResult {
    const { field, formData } = context;
    const validationErrors: string[] = [];
    const suggestions: string[] = [];

    try {
      if (field.conditionalRules) {
        const rules = field.conditionalRules;
        
        // Check if form data has changed to invalidate cache
        const currentFormDataHash = this.generateFormDataHash(formData);
        if (currentFormDataHash !== this.lastFormDataHash) {
          this.conditionCache.clear();
          this.lastFormDataHash = currentFormDataHash;
        }

        // Process visibility rules
        if (rules.visibility?.enabled) {
          const visibilityResult = this.processVisibilityRule(rules.visibility, formData);
          if (!visibilityResult.isValid) {
            validationErrors.push(...visibilityResult.errors);
            suggestions.push(...visibilityResult.suggestions);
          }
        }

        // Process enable rules
        if (rules.enable?.enabled) {
          const enableResult = this.processEnableRule(rules.enable, formData);
          if (!enableResult.isValid) {
            validationErrors.push(...enableResult.errors);
            suggestions.push(...enableResult.suggestions);
          }
        }

        // Process required rules
        if (rules.required?.enabled) {
          const requiredResult = this.processRequiredRule(rules.required, formData);
          if (!requiredResult.isValid) {
            validationErrors.push(...requiredResult.errors);
            suggestions.push(...requiredResult.suggestions);
          }
        }

        // Process custom rules
        if (rules.custom?.enabled) {
          const customResult = this.processCustomRule(rules.custom, formData);
          if (!customResult.isValid) {
            validationErrors.push(...customResult.errors);
            suggestions.push(...customResult.suggestions);
          }
        }
      }

      return {
        value: context.currentValue,
        isValid: validationErrors.length === 0,
        hasChanges: false,
        context,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };

    } catch (error) {
      return {
        value: context.currentValue,
        isValid: false,
        hasChanges: false,
        context,
        validationErrors: [`Conditional rules processing failed: ${error}`]
      };
    }
  }

  // Evaluate single condition with type-safe comparison
  private evaluateCondition(left: any, operator: string, right: any): boolean {
    // handle empty/not_empty
    if (operator === 'empty') return !left || String(left).trim() === '';
    if (operator === 'not_empty') return !!(left && String(left).trim() !== '');

    const normalizeNumber = (raw: any): number | null => {
      if (raw === null || raw === undefined) return null;
      const s = String(raw).replace(/,/g, '');
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    };

    const ln = normalizeNumber(left);
    const rn = normalizeNumber(right);
    const bothNumeric = ln !== null && rn !== null;

    switch (operator) {
      case 'equals':
        return bothNumeric ? ln === rn : String(left) === String(right);
      case 'not_equals':
        return bothNumeric ? ln !== rn : String(left) !== String(right);
      case 'greater_than':
        return bothNumeric ? (ln! > rn!) : String(left) > String(right);
      case 'less_than':
        return bothNumeric ? (ln! < rn!) : String(left) < String(right);
      case 'greater_equal':
        return bothNumeric ? (ln! >= rn!) : String(left) >= String(right);
      case 'less_equal':
        return bothNumeric ? (ln! <= rn!) : String(left) <= String(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'not_contains':
        return !String(left).includes(String(right));
      default:
        return false;
    }
  }

  /**
   * Process visibility rule
   * پردازش قانون نمایش
   */
  private processVisibilityRule(rule: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check if dependent field exists
    if (!rule.dependsOn) {
      errors.push('فیلد وابسته مشخص نشده است');
      return { isValid: false, errors, suggestions };
    }

    if (!formData[rule.dependsOn]) {
      errors.push(`فیلد وابسته '${rule.dependsOn}' یافت نشد`);
      suggestions.push('نام فیلد وابسته را بررسی کنید');
      return { isValid: false, errors, suggestions };
    }

    // Check for multiple conditions
    if (rule.conditions && rule.conditions.length > 0) {
      const logic = rule.logic || 'AND';
      const isVisible = this.evaluateMultipleConditions(rule.conditions, logic, formData);
      
      if (!isVisible) {
        suggestions.push(`فیلد بر اساس شرط‌های ${logic} مخفی است`);
      }
    } else {
      // Single condition
      const dependentValue = formData[rule.dependsOn];
      const condition = rule.condition || 'equals';
      const expectedValue = rule.value || '';

      const isVisible = this.evaluateCondition(dependentValue, condition, expectedValue);
      
      if (!isVisible) {
        suggestions.push(`فیلد بر اساس شرط ${condition} مخفی است`);
      }
    }

    return { isValid: true, errors, suggestions };
  }

  /**
   * Process enable rule
   * پردازش قانون فعال‌سازی
   */
  private processEnableRule(rule: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check if dependent field exists
    if (!rule.dependsOn) {
      errors.push('فیلد وابسته مشخص نشده است');
      return { isValid: false, errors, suggestions };
    }

    if (!formData[rule.dependsOn]) {
      errors.push(`فیلد وابسته '${rule.dependsOn}' یافت نشد`);
      suggestions.push('نام فیلد وابسته را بررسی کنید');
      return { isValid: false, errors, suggestions };
    }

    // Check condition
    const dependentValue = formData[rule.dependsOn];
    const condition = rule.condition || 'equals';
    const expectedValue = rule.value || '';

    const isEnabled = this.evaluateCondition(dependentValue, condition, expectedValue);
    
    if (!isEnabled) {
      suggestions.push(`فیلد بر اساس شرط ${condition} غیرفعال است`);
    }

    return { isValid: true, errors, suggestions };
  }

  /**
   * Process required rule
   * پردازش قانون اجباری
   */
  private processRequiredRule(rule: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check if dependent field exists
    if (!rule.dependsOn) {
      errors.push('فیلد وابسته مشخص نشده است');
      return { isValid: false, errors, suggestions };
    }

    if (!formData[rule.dependsOn]) {
      errors.push(`فیلد وابسته '${rule.dependsOn}' یافت نشد`);
      suggestions.push('نام فیلد وابسته را بررسی کنید');
      return { isValid: false, errors, suggestions };
    }

    // Check condition
    const dependentValue = formData[rule.dependsOn];
    const condition = rule.condition || 'equals';
    const expectedValue = rule.value || '';

    const isRequired = this.evaluateCondition(dependentValue, condition, expectedValue);
    
    if (isRequired) {
      suggestions.push('فیلد بر اساس شرط اجباری است');
    }

    return { isValid: true, errors, suggestions };
  }

  /**
   * Process custom rule
   * پردازش قانون سفارشی
   */
  private processCustomRule(rule: any, formData: Record<string, any>): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!rule.rule) {
      errors.push('قانون سفارشی مشخص نشده است');
      return { isValid: false, errors, suggestions };
    }

    try {
      // Sanitize and validate custom rule
      const sanitizedRule = this.sanitizeCustomRule(rule.rule);
      
      // Evaluate custom rule (in a real implementation, this would be more secure)
      const result = this.evaluateCustomRule(sanitizedRule, formData);
      
      if (!result.isValid) {
        errors.push(rule.message || 'قانون سفارشی اعتبارسنجی نشد');
        suggestions.push('قانون سفارشی را بررسی کنید');
      }

    } catch (error) {
      errors.push('قانون سفارشی نامعتبر است');
      suggestions.push('نحو قانون سفارشی را بررسی کنید');
    }

    return { isValid: errors.length === 0, errors, suggestions };
  }

  /**
   * Evaluate condition
   * ارزیابی شرط
   */
  private evaluateCondition(value: any, condition: string, expectedValue: string): boolean {
    const stringValue = String(value || '');
    const stringExpected = String(expectedValue || '');

    switch (condition) {
      case 'equals':
        return stringValue === stringExpected;
      case 'not_equals':
        return stringValue !== stringExpected;
      case 'contains':
        return stringValue.includes(stringExpected);
      case 'not_contains':
        return !stringValue.includes(stringExpected);
      case 'empty':
        return !stringValue || stringValue.trim() === '';
      case 'not_empty':
        return stringValue && stringValue.trim() !== '';
      case 'greater_than':
        return parseFloat(stringValue) > parseFloat(stringExpected);
      case 'less_than':
        return parseFloat(stringValue) < parseFloat(stringExpected);
      default:
        return true;
    }
  }

  /**
   * Evaluate multiple conditions with logic
   * ارزیابی چندین شرط با منطق
   */
  private evaluateMultipleConditions(conditions: any[], logic: 'AND' | 'OR', formData: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true;

    const results = conditions.map(condition => {
      if (!condition.dependsOn) return false;
      
      const dependentValue = formData[condition.dependsOn];
      const conditionType = condition.condition || 'equals';
      const expectedValue = condition.value || '';

      return this.evaluateCondition(dependentValue, conditionType, expectedValue);
    });

    if (logic === 'AND') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }

  /**
   * Sanitize custom rule
   * پاکسازی قانون سفارشی
   */
  private sanitizeCustomRule(rule: string): string {
    // Remove potentially dangerous patterns
    return rule
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[|&]/g, '') // Remove logical operators
      .replace(/eval|function|new|delete|window|document|global|process/g, '') // Remove dangerous keywords
      .replace(/require|import|export|module/g, '') // Remove module keywords
      .replace(/setTimeout|setInterval|clearTimeout|clearInterval/g, '') // Remove timer functions
      .replace(/alert|confirm|prompt/g, '') // Remove dialog functions
      .replace(/localStorage|sessionStorage|cookie/g, '') // Remove storage access
      .replace(/XMLHttpRequest|fetch|ajax/g, '') // Remove network access
      .replace(/\.innerHTML|\.outerHTML|\.textContent/g, '') // Remove DOM manipulation
      .replace(/\.style\.|\.className|\.id/g, '') // Remove style manipulation
      .substring(0, 200); // Limit length
  }

  /**
   * Evaluate custom rule
   * ارزیابی قانون سفارشی
   */
  private evaluateCustomRule(rule: string, formData: Record<string, any>): {
    isValid: boolean;
    result?: any;
  } {
    try {
      // Security validation
      if (!this.isSecureCustomRule(rule)) {
        return { isValid: false };
      }

      // In a real implementation, this would use a safe expression evaluator
      // For now, we'll do basic validation
      if (rule.includes('formData')) {
        // Simple formData access validation
        const matches = rule.match(/formData\[['"]([^'"]+)['"]\]/g);
        if (matches) {
          for (const match of matches) {
            const fieldName = match.match(/formData\[['"]([^'"]+)['"]\]/)?.[1];
            if (fieldName && !formData[fieldName]) {
              return { isValid: false };
            }
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Check if custom rule is secure
   * بررسی امنیت قانون سفارشی
   */
  private isSecureCustomRule(rule: string): boolean {
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
   * Generate hash for form data to detect changes
   * تولید هش برای تشخیص تغییرات فرم
   */
  private generateFormDataHash(formData: Record<string, any>): string {
    const keys = Object.keys(formData).sort();
    const values = keys.map(key => String(formData[key] || ''));
    return keys.join(',') + '|' + values.join(',');
  }

  /**
   * Get cached condition result
   * دریافت نتیجه شرط از cache
   */
  private getCachedCondition(key: string): boolean | null {
    return this.conditionCache.get(key) || null;
  }

  /**
   * Set cached condition result
   * ذخیره نتیجه شرط در cache
   */
  private setCachedCondition(key: string, result: boolean): void {
    this.conditionCache.set(key, result);
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    this.conditionCache.clear();
    this.lastFormDataHash = '';
  }
}
