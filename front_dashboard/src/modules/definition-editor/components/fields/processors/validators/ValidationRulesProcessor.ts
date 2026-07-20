// Validation Rules Processor - Field validation rules processor
// پردازشگر قوانین اعتبارسنجی - پردازشگر قوانین اعتبارسنجی فیلد

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Validation rules processor
 * پردازشگر قوانین اعتبارسنجی
 */
export class ValidationRulesProcessor implements IFieldProcessor {
  name = 'ValidationRulesProcessor';
  priority = 20;
  enabled = true;

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.validationRules &&
      context.currentValue !== undefined &&
      context.currentValue !== null
    );
  }

  /**
   * Process the context
   * پردازش زمینه
   */
  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    const validationErrors: string[] = [];
    const suggestions: string[] = [];

    try {
      if (field.validationRules) {
        const rules = field.validationRules;
        const value = String(currentValue);

        // Required validation
        if (field.isRequired && (!value || value.trim() === '')) {
          validationErrors.push('این فیلد اجباری است');
        }

        // Length validation
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          validationErrors.push(`حداقل ${rules.minLength} کاراکتر وارد کنید`);
          suggestions.push(`حداقل ${rules.minLength} کاراکتر مورد نیاز است`);
        }

        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          validationErrors.push(`حداکثر ${rules.maxLength} کاراکتر مجاز است`);
          suggestions.push(`حداکثر ${rules.maxLength} کاراکتر مجاز است`);
        }

        // Pattern validation
        if (rules.pattern) {
          // Validate pattern security first
          const securityCheck = this.validatePatternSecurity(rules.pattern);
          if (!securityCheck.isValid) {
            validationErrors.push('الگوی regex نامعتبر یا خطرناک است');
            suggestions.push(...securityCheck.warnings);
          } else {
            const isValidPattern = this.validatePattern(value, rules.pattern);
            if (!isValidPattern) {
              const errorMessage = rules.patternMessage || 'فرمت وارد شده صحیح نیست';
              validationErrors.push(errorMessage);
              
              // Generate pattern suggestions
              const patternSuggestions = this.generatePatternSuggestions(value, rules.pattern);
              suggestions.push(...patternSuggestions);
            }
          }
        }

        // Unique validation (placeholder - would need database check)
        if (rules.unique) {
          // This would typically require an async database check
          // For now, we'll just add a note that this needs to be checked
          suggestions.push('بررسی یکتایی مقدار نیاز به بررسی در پایگاه داده دارد');
          
          // In a real implementation, this would be an async check
          // For now, we'll simulate it by checking if the value is not empty
          if (value && value.trim() !== '') {
            // This is a placeholder - in reality, you'd check against a database
            // For demonstration, we'll assume it's unique if it's not empty
            console.log(`Unique validation check for value: ${value}`);
          }
        }

        // Number-specific validations
        if (field.type === 'number') {
          const numberField: any = (field as any).numberField || {};
          const enableMultipleValues = !!numberField.enableMultipleValues;

          const getSeparator = () => {
            const sep = numberField.multiValueSeparator || 'comma';
            if (sep === 'space') return ' ';
            if (sep === 'semicolon') return ';';
            return ',';
          };

          const checkSingle = (raw: string): string | null => {
            const trimmed = (raw || '').trim();
            if (!trimmed) return 'مقدار نامعتبر است';

            const num = Number(trimmed.replace(/,/g, ''));
            if (Number.isNaN(num)) return 'عدد نامعتبر است';

            // min/max
            if (numberField.minValue !== undefined && num < numberField.minValue) {
              return `حداقل مقدار مجاز ${numberField.minValue} است`;
            }
            if (numberField.maxValue !== undefined && num > numberField.maxValue) {
              return `حداکثر مقدار مجاز ${numberField.maxValue} است`;
            }

            // numberType
            const nt = numberField.numberType as ('integer'|'decimal'|'positive'|'negative'|undefined);
            if (nt === 'integer' && !Number.isInteger(num)) {
              return 'فقط اعداد صحیح مجاز است';
            }
            if (nt === 'positive' && !(num > 0)) {
              return 'فقط اعداد مثبت مجاز است';
            }
            if (nt === 'negative' && !(num < 0)) {
              return 'فقط اعداد منفی مجاز است';
            }

            // decimal precision
            if (numberField.decimalPrecision !== undefined) {
              const dotIdx = trimmed.indexOf('.');
              if (dotIdx >= 0) {
                const decimals = trimmed.length - dotIdx - 1;
                if (decimals > numberField.decimalPrecision) {
                  return `حداکثر ${numberField.decimalPrecision} رقم اعشار مجاز است`;
                }
              } else if (nt === 'decimal' || nt === undefined) {
                // ok
              }
            }

            // pattern per-item (if defined)
            if (rules.pattern) {
              const isOk = this.validatePattern(trimmed, rules.pattern);
              if (!isOk) return rules.patternMessage || 'فرمت وارد شده صحیح نیست';
            }

            return null;
          };

          if (enableMultipleValues) {
            const sep = getSeparator();
            const items = value.split(sep).map(p => p.trim()).filter(Boolean);
            if (field.isRequired && items.length === 0) {
              validationErrors.push('حداقل یک مقدار باید وارد شود');
            }
            for (const item of items) {
              const err = checkSingle(item);
              if (err) { validationErrors.push(err); break; }
            }
          } else {
            if (field.isRequired && (!value || value.trim() === '')) {
              validationErrors.push('این فیلد اجباری است');
            } else if (value && value.trim() !== '') {
              const err = checkSingle(value);
              if (err) validationErrors.push(err);
            }
          }

          // misconfiguration: min>max
          if (numberField.minValue !== undefined && numberField.maxValue !== undefined && numberField.minValue > numberField.maxValue) {
            validationErrors.push('پیکربندی نامعتبر: حداقل مقدار بزرگ‌تر از حداکثر مقدار است');
          }
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
        validationErrors: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Validate value against pattern
   * اعتبارسنجی مقدار در برابر الگو
   */
  private validatePattern(value: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(value);
    } catch (error) {
      console.warn('Invalid regex pattern:', pattern, error);
      return true; // Don't fail validation for invalid regex
    }
  }

  /**
   * Generate pattern suggestions
   * تولید پیشنهادات الگو
   */
  private generatePatternSuggestions(value: string, pattern: string): string[] {
    const suggestions: string[] = [];

    try {
      // Common pattern suggestions
      if (pattern.includes('@')) {
        suggestions.push('مثال: example@domain.com');
      }
      
      if (pattern.includes('\\d')) {
        suggestions.push('فقط عدد وارد کنید');
      }
      
      if (pattern.includes('[0-9]')) {
        suggestions.push('از اعداد ۰ تا ۹ استفاده کنید');
      }
      
      if (pattern.includes('a-zA-Z')) {
        suggestions.push('از حروف انگلیسی استفاده کنید');
      }
      
      if (pattern.includes('\\u0600-\\u06FF')) {
        suggestions.push('از حروف فارسی استفاده کنید');
      }

      // Length-based suggestions
      if (pattern.includes('{')) {
        const lengthMatch = pattern.match(/\{(\d+),?(\d+)?\}/);
        if (lengthMatch) {
          const minLength = parseInt(lengthMatch[1]);
          const maxLength = lengthMatch[2] ? parseInt(lengthMatch[2]) : minLength;
          
          if (value.length < minLength) {
            suggestions.push(`حداقل ${minLength} کاراکتر وارد کنید`);
          } else if (value.length > maxLength) {
            suggestions.push(`حداکثر ${maxLength} کاراکتر مجاز است`);
          }
        }
      }

    } catch (error) {
      console.warn('Error generating pattern suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Validate regex pattern syntax
   * اعتبارسنجی نحو الگوی regex
   */
  private isValidRegexPattern(pattern: string): boolean {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize regex pattern
   * پاکسازی الگوی regex
   */
  private sanitizePattern(pattern: string): string {
    // Remove potentially dangerous patterns and limit length
    return pattern
      .replace(/\\[^\\]/g, '') // Remove escape sequences
      .replace(/[{}]/g, '') // Remove quantifiers
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[|&]/g, '') // Remove logical operators
      .substring(0, 100); // Limit length to prevent DoS
  }

  /**
   * Validate and sanitize regex pattern for security
   * اعتبارسنجی و پاکسازی الگوی regex برای امنیت
   */
  private validatePatternSecurity(pattern: string): { isValid: boolean; sanitized: string; warnings: string[] } {
    const warnings: string[] = [];
    let sanitized = pattern;

    // Check for potentially dangerous patterns
    if (pattern.includes('.*') || pattern.includes('.+')) {
      warnings.push('استفاده از .* یا .+ ممکن است باعث مشکل عملکرد شود');
    }

    if (pattern.includes('\\d+') || pattern.includes('\\w+')) {
      warnings.push('استفاده از \\d+ یا \\w+ ممکن است باعث مشکل عملکرد شود');
    }

    if (pattern.length > 50) {
      warnings.push('الگوی regex طولانی ممکن است باعث مشکل عملکرد شود');
      sanitized = sanitized.substring(0, 50);
    }

    // Check for nested quantifiers
    if (/\{\d+,\d*\}\s*[\*\+\?]/.test(pattern)) {
      warnings.push('استفاده از quantifier های تودرتو ممکن است باعث مشکل عملکرد شود');
    }

    return {
      isValid: warnings.length === 0,
      sanitized,
      warnings
    };
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}
