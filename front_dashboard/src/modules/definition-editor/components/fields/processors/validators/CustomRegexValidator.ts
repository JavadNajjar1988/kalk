// Custom Regex Validator - Custom pattern validation processor
// اعتبارسنج Regex سفارشی - پردازشگر اعتبارسنجی الگوی سفارشی

import {
  IFieldProcessor,
  ProcessingContext,
  ProcessingResult
} from '../core/ProcessingContext';

/**
 * Custom regex validation processor
 * پردازشگر اعتبارسنجی regex سفارشی
 */
export class CustomRegexValidator implements IFieldProcessor {
  name = 'CustomRegexValidator';
  priority = 15;
  enabled = true;

  // Common regex patterns
  // الگوهای regex رایج
  private readonly COMMON_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    nationalId: /^\d{8,10}$/,
    postalCode: /^\d{5,10}$/,
    url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
    ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    persianText: /^[\u0600-\u06FF\s]*$/,
    englishText: /^[a-zA-Z\s]*$/,
    alphanumeric: /^[a-zA-Z0-9]*$/,
    numbersOnly: /^\d*$/
  };

  /**
   * Check if processor can handle the context
   * بررسی امکان پردازش زمینه
   */
  canProcess(context: ProcessingContext): boolean {
    return !!(
      context.field.customRegex &&
      context.currentValue
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
      if (field.customRegex) {
        const isValid = this.validatePattern(currentValue, field.customRegex);
        
        if (!isValid) {
          validationErrors.push(this.getPatternErrorMessage(field.customRegex));
          
          // Generate suggestions based on pattern
          const patternSuggestions = this.generateSuggestions(currentValue, field.customRegex);
          suggestions.push(...patternSuggestions);
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
        validationErrors: [`Regex validation failed: ${error}`]
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
   * Get pattern error message
   * دریافت پیام خطای الگو
   */
  private getPatternErrorMessage(pattern: string): string {
    // Check if it's a common pattern and provide user-friendly message
    const commonPatternMessages: Record<string, string> = {
      [this.COMMON_PATTERNS.email.source]: 'فرمت ایمیل صحیح نیست',
      [this.COMMON_PATTERNS.phone.source]: 'شماره تلفن صحیح نیست',
      [this.COMMON_PATTERNS.nationalId.source]: 'کد ملی صحیح نیست',
      [this.COMMON_PATTERNS.postalCode.source]: 'کد پستی صحیح نیست',
      [this.COMMON_PATTERNS.url.source]: 'آدرس وبسایت صحیح نیست',
      [this.COMMON_PATTERNS.ipAddress.source]: 'آدرس IP صحیح نیست',
      [this.COMMON_PATTERNS.persianText.source]: 'فقط متن فارسی مجاز است',
      [this.COMMON_PATTERNS.englishText.source]: 'فقط متن انگلیسی مجاز است',
      [this.COMMON_PATTERNS.alphanumeric.source]: 'فقط حروف و اعداد مجاز هستند',
      [this.COMMON_PATTERNS.numbersOnly.source]: 'فقط عدد مجاز است'
    };

    return commonPatternMessages[pattern] || 'فرمت وارد شده صحیح نیست';
  }

  /**
   * Generate suggestions based on pattern analysis
   * تولید پیشنهادات بر اساس تحلیل الگو
   */
  private generateSuggestions(value: string, pattern: string): string[] {
    const suggestions: string[] = [];

    try {
      // Analyze pattern to provide helpful suggestions
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
      console.warn('Error generating suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Test common patterns against value
   * تست الگوهای رایج در برابر مقدار
   */
  private testCommonPatterns(value: string): {
    pattern: string;
    matches: boolean;
    name: string;
  }[] {
    const results = [];
    
    for (const [name, regex] of Object.entries(this.COMMON_PATTERNS)) {
      results.push({
        pattern: regex.source,
        matches: regex.test(value),
        name
      });
    }
    
    return results.filter(result => result.matches);
  }

  /**
   * Suggest pattern based on value analysis
   * پیشنهاد الگو بر اساس تحلیل مقدار
   */
  private suggestPattern(value: string): string | null {
    const matches = this.testCommonPatterns(value);
    
    if (matches.length > 0) {
      // Return the most specific pattern
      return matches[0].pattern;
    }
    
    return null;
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
   * Extract pattern parts for analysis
   * استخراج بخش‌های الگو برای تحلیل
   */
  private analyzePattern(pattern: string): {
    hasCharacterClasses: boolean;
    hasQuantifiers: boolean;
    hasAnchors: boolean;
    hasGroups: boolean;
    complexity: 'simple' | 'medium' | 'complex';
  } {
    const analysis = {
      hasCharacterClasses: /\[[^\]]+\]/.test(pattern),
      hasQuantifiers: /[*+?{}]/.test(pattern),
      hasAnchors: /[^\\]\^|\$$/.test(pattern),
      hasGroups: /\([^)]+\)/.test(pattern),
      complexity: 'simple' as 'simple' | 'medium' | 'complex'
    };

    // Determine complexity
    const complexityScore = (
      (analysis.hasCharacterClasses ? 1 : 0) +
      (analysis.hasQuantifiers ? 1 : 0) +
      (analysis.hasAnchors ? 1 : 0) +
      (analysis.hasGroups ? 1 : 0)
    );

    if (complexityScore >= 3) {
      analysis.complexity = 'complex';
    } else if (complexityScore >= 1) {
      analysis.complexity = 'medium';
    }

    return analysis;
  }

  /**
   * Cleanup resources
   * پاکسازی منابع
   */
  cleanup(): void {
    // No resources to cleanup
  }
}