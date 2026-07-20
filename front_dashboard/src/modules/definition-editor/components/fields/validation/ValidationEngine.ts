import {
  ValidationRule,
  ValidationRuleType,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationContext,
  ValidationMode,
  ValidationOptions
} from './types';

export class ValidationEngine {
  private static instance: ValidationEngine;
  private rules: Map<string, ValidationRule> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  public static getInstance(): ValidationEngine {
    if (!ValidationEngine.instance) {
      ValidationEngine.instance = new ValidationEngine();
    }
    return ValidationEngine.instance;
  }

  // Add or update validation rule
  public addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  // Remove validation rule
  public removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  // Get all rules for a field
  public getRulesForField(fieldId: string): ValidationRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  // Main validation method
  public async validateField(
    context: ValidationContext,
    options: ValidationOptions = { mode: ValidationMode.ON_CHANGE }
  ): Promise<ValidationResult> {
    const { fieldId, value, formData, fieldDefinition } = context;
    
    // Get applicable rules
    const fieldRules = this.getRulesForField(fieldId);
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Apply debouncing for real-time validation
    if (options.mode === ValidationMode.REAL_TIME && options.debounceDelay) {
      return this.debounceValidation(context, options);
    }

    // Validate each rule
    for (const rule of fieldRules) {
      try {
        const ruleResult = await this.validateRule(rule, value, context);
        
        if (!ruleResult.isValid) {
          if (ruleResult.severity === 'error') {
            errors.push({
              ruleId: rule.id,
              message: rule.errorMessage,
              severity: 'error',
              code: `VALIDATION_${rule.type.toUpperCase()}`,
              field: fieldId,
              value
            });
            
            // Stop on first error if configured
            if (options.stopOnFirstError) {
              break;
            }
          } else if (ruleResult.severity === 'warning' && options.showWarnings) {
            warnings.push({
              ruleId: rule.id,
              message: rule.warningMessage || rule.errorMessage,
              code: `WARNING_${rule.type.toUpperCase()}`,
              field: fieldId,
              value
            });
          }
        }
      } catch (error) {
        console.error(`Validation rule ${rule.id} failed:`, error);
        errors.push({
          ruleId: rule.id,
          message: 'Validation rule execution failed',
          severity: 'error',
          code: 'VALIDATION_EXECUTION_ERROR',
          field: fieldId,
          value
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldId,
      timestamp: Date.now()
    };
  }

  // Debounced validation for real-time mode
  private debounceValidation(
    context: ValidationContext,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    const { fieldId } = context;
    const delay = options.debounceDelay || 300;

    return new Promise((resolve) => {
      // Clear existing timer
      if (this.debounceTimers.has(fieldId)) {
        clearTimeout(this.debounceTimers.get(fieldId)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const result = await this.validateField(context, {
          ...options,
          debounceDelay: undefined // Prevent infinite recursion
        });
        this.debounceTimers.delete(fieldId);
        resolve(result);
      }, delay);

      this.debounceTimers.set(fieldId, timer);
    });
  }

  // Validate individual rule
  private async validateRule(
    rule: ValidationRule,
    value: any,
    context: ValidationContext
  ): Promise<{ isValid: boolean; severity: 'error' | 'warning' }> {
    const { config } = rule;

    switch (rule.type) {
      case ValidationRuleType.REQUIRED:
        return {
          isValid: this.validateRequired(value),
          severity: 'error'
        };

      case ValidationRuleType.MIN_LENGTH:
        return {
          isValid: this.validateMinLength(value, config.minLength!),
          severity: 'error'
        };

      case ValidationRuleType.MAX_LENGTH:
        return {
          isValid: this.validateMaxLength(value, config.maxLength!),
          severity: 'error'
        };

      case ValidationRuleType.PATTERN:
        return {
          isValid: this.validatePattern(value, config.pattern!, config.caseSensitive),
          severity: 'error'
        };

      case ValidationRuleType.EMAIL:
        return {
          isValid: this.validateEmail(value),
          severity: 'error'
        };

      case ValidationRuleType.PHONE:
        return {
          isValid: this.validatePhone(value),
          severity: 'error'
        };

      case ValidationRuleType.URL:
        return {
          isValid: this.validateUrl(value),
          severity: 'error'
        };

      case ValidationRuleType.NUMBER_RANGE:
        return {
          isValid: this.validateNumberRange(value, config.min, config.max),
          severity: 'error'
        };

      case ValidationRuleType.DATE_RANGE:
        return {
          isValid: this.validateDateRange(value, config.minDate, config.maxDate),
          severity: 'error'
        };

      case ValidationRuleType.DEPENDENCY:
        return {
          isValid: this.validateDependency(value, context, config),
          severity: 'error'
        };

      case ValidationRuleType.CONDITIONAL:
        return {
          isValid: await this.validateConditional(value, context, config),
          severity: 'error'
        };

      case ValidationRuleType.CUSTOM:
        return {
          isValid: await this.validateCustom(value, context, config),
          severity: 'error'
        };

      default:
        return { isValid: true, severity: 'error' };
    }
  }

  // Individual validation methods
  private validateRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private validateMinLength(value: any, minLength: number): boolean {
    if (!value) return true; // Let required rule handle empty values
    return String(value).length >= minLength;
  }

  private validateMaxLength(value: any, maxLength: number): boolean {
    if (!value) return true;
    return String(value).length <= maxLength;
  }

  private validatePattern(value: any, pattern: string, caseSensitive?: boolean): boolean {
    if (!value) return true;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    return regex.test(String(value));
  }

  private validateEmail(value: any): boolean {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(value));
  }

  private validatePhone(value: any): boolean {
    if (!value) return true;
    // Iranian mobile number format
    const phoneRegex = /^(\+98|0)?9\d{9}$/;
    return phoneRegex.test(String(value));
  }

  private validateUrl(value: any): boolean {
    if (!value) return true;
    try {
      new URL(String(value));
      return true;
    } catch {
      return false;
    }
  }

  private validateNumberRange(value: any, min?: number, max?: number): boolean {
    if (!value) return true;
    const num = Number(value);
    if (isNaN(num)) return false;
    
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    
    return true;
  }

  private validateDateRange(value: any, minDate?: string, maxDate?: string): boolean {
    if (!value) return true;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) return false;
    }
    
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) return false;
    }
    
    return true;
  }

  private validateDependency(value: any, context: ValidationContext, config: any): boolean {
    const { formData } = context;
    const { dependsOn, dependencyValue, dependencyOperator } = config;
    
    if (!dependsOn || !formData) return true;
    
    const dependentValue = formData[dependsOn];
    
    switch (dependencyOperator) {
      case 'equals':
        return dependentValue === dependencyValue;
      case 'notEquals':
        return dependentValue !== dependencyValue;
      case 'contains':
        return String(dependentValue).includes(String(dependencyValue));
      case 'notContains':
        return !String(dependentValue).includes(String(dependencyValue));
      case 'greaterThan':
        return Number(dependentValue) > Number(dependencyValue);
      case 'lessThan':
        return Number(dependentValue) < Number(dependencyValue);
      default:
        return true;
    }
  }

  private async validateConditional(value: any, context: ValidationContext, config: any): Promise<boolean> {
    const { conditions } = config;
    if (!conditions || conditions.length === 0) return true;
    
    const { formData } = context;
    
    for (const condition of conditions) {
      const fieldValue = formData[condition.fieldId];
      const conditionMet = this.evaluateCondition(fieldValue, condition);
      
      // Handle logical operators (AND/OR)
      if (condition.logicalOperator === 'OR' && conditionMet) {
        return true;
      } else if (!conditionMet && condition.logicalOperator !== 'OR') {
        return false;
      }
    }
    
    return true;
  }

  private evaluateCondition(fieldValue: any, condition: any): boolean {
    const { operator, value } = condition;
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'notContains':
        return !String(fieldValue).includes(String(value));
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      case 'isEmpty':
        return !fieldValue || String(fieldValue).trim() === '';
      case 'isNotEmpty':
        return fieldValue && String(fieldValue).trim() !== '';
      default:
        return true;
    }
  }

  private async validateCustom(value: any, context: ValidationContext, config: any): Promise<boolean> {
    const { customFunction } = config;
    if (!customFunction) return true;
    
    try {
      // Create a safe execution context
      const func = new Function('value', 'context', `return (${customFunction})(value, context)`);
      const result = await func(value, context);
      return Boolean(result);
    } catch (error) {
      console.error('Custom validation function failed:', error);
      return false;
    }
  }

  // Cleanup method
  public cleanup(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}