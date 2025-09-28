// Security Filter module - Advanced security and content filtering
// ماژول فیلتر امنیتی - فیلترینگ پیشرفته امنیتی و محتوا

import { IFieldProcessor, ProcessingContext, ProcessingResult } from '../core/ProcessingContext';

/**
 * Sensitive data detector with pattern matching
 * شناساگر اطلاعات حساس با تطبیق الگو
 */
export class SensitiveDataDetector implements IFieldProcessor {
  name = 'SensitiveDataDetector';
  priority = 70;
  enabled = true;
  
  // Sensitive data patterns
  private readonly patterns = {
    // Iranian National ID
    iranianNationalId: /^\d{10}$/,
    // Credit card numbers (basic pattern)
    creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/,
    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    // Phone numbers
    phoneNumber: /\b(?:\+98|0)?9\d{9}\b/,
    // IBAN codes
    iban: /\bIR\d{2}\d{4}\d{4}\d{4}\d{4}\d{4}\d{2}\b/,
    // Social security patterns
    socialSecurity: /\b\d{3}-\d{2}-\d{4}\b/,
    // Bank account numbers
    bankAccount: /\b\d{10,16}\b/,
    // Passport numbers
    passport: /\b[A-Z]\d{8}\b/
  };

  canProcess(context: ProcessingContext): boolean {
    return !!(context.field.enableSensitiveDataDetection && context.currentValue);
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    
    if (!currentValue || typeof currentValue !== 'string') {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }

    try {
      const detectedTypes = this.detectSensitiveData(currentValue);
      const action = field.sensitiveDataAction || 'warn';
      
      if (detectedTypes.length > 0) {
        return this.handleSensitiveData(currentValue, detectedTypes, action, context);
      }

      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }
  }

  /**
   * Detect sensitive data types in the input
   * شناسایی انواع اطلاعات حساس در ورودی
   */
  private detectSensitiveData(value: string): string[] {
    const detected: string[] = [];
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(value)) {
        detected.push(type);
      }
    }
    
    return detected;
  }

  /**
   * Handle detected sensitive data based on action
   * مدیریت اطلاعات حساس شناسایی شده بر اساس عمل
   */
  private handleSensitiveData(
    value: string, 
    detectedTypes: string[], 
    action: string, 
    context: ProcessingContext
  ): ProcessingResult {
    const typeNames = detectedTypes.map(t => this.getTypeDisplayName(t)).join('، ');
    
    switch (action) {
      case 'block':
        return {
          value: '',
          isValid: false,
          hasChanges: true,
          context,
          validationErrors: [`ورود اطلاعات حساس مجاز نیست: ${typeNames}`]
        };
      
      case 'mask':
        const maskedValue = this.maskSensitiveData(value, detectedTypes);
        return {
          value: maskedValue,
          isValid: true,
          hasChanges: maskedValue !== value,
          context,
          validationErrors: [`اطلاعات حساس ماسک شد: ${typeNames}`]
        };
      
      case 'warn':
      default:
        return {
          value: value,
          isValid: true,
          hasChanges: false,
          context,
          validationErrors: [`هشدار: اطلاعات حساس شناسایی شد: ${typeNames}`]
        };
    }
  }

  /**
   * Mask sensitive data while keeping some visible characters
   * ماسک کردن اطلاعات حساس با حفظ برخی کاراکترهای مرئی
   */
  private maskSensitiveData(value: string, detectedTypes: string[]): string {
    let maskedValue = value;
    
    for (const type of detectedTypes) {
      switch (type) {
        case 'iranianNationalId':
          maskedValue = maskedValue.replace(/\d{10}/, (match) => 
            match.substring(0, 3) + '*'.repeat(4) + match.substring(7)
          );
          break;
        
        case 'creditCard':
          maskedValue = maskedValue.replace(/\b(?:\d{4}[\s-]?){3}\d{4}\b/, (match) => 
            match.substring(0, 4) + '*'.repeat(8) + match.substring(match.length - 4)
          );
          break;
        
        case 'email':
          maskedValue = maskedValue.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, (match) => {
            const [username, domain] = match.split('@');
            const maskedUsername = username.length > 2 ? 
              username.substring(0, 2) + '*'.repeat(username.length - 2) : 
              '*'.repeat(username.length);
            return `${maskedUsername}@${domain}`;
          });
          break;
        
        case 'phoneNumber':
          maskedValue = maskedValue.replace(/\b(?:\+98|0)?9\d{9}\b/, (match) => 
            match.substring(0, 4) + '*'.repeat(4) + match.substring(match.length - 3)
          );
          break;
        
        default:
          // Generic masking: show first 2 and last 2 characters
          maskedValue = maskedValue.replace(this.patterns[type as keyof typeof this.patterns], (match) => {
            if (match.length <= 4) return '*'.repeat(match.length);
            return match.substring(0, 2) + '*'.repeat(match.length - 4) + match.substring(match.length - 2);
          });
      }
    }
    
    return maskedValue;
  }

  /**
   * Get display name for sensitive data type
   * دریافت نام نمایشی برای نوع اطلاعات حساس
   */
  private getTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      iranianNationalId: 'کد ملی',
      creditCard: 'شماره کارت اعتباری',
      email: 'آدرس ایمیل',
      phoneNumber: 'شماره تلفن',
      iban: 'شماره شبا',
      socialSecurity: 'شماره تأمین اجتماعی',
      bankAccount: 'شماره حساب',
      passport: 'شماره گذرنامه'
    };
    
    return displayNames[type] || type;
  }

  cleanup(): void {}
}

/**
 * Inappropriate words filter with customizable word lists
 * فیلتر کلمات نامناسب با لیست کلمات قابل تنظیم
 */
export class InappropriateWordsFilter implements IFieldProcessor {
  name = 'InappropriateWordsFilter';
  priority = 80;
  enabled = true;
  
  // Default inappropriate words list (basic examples)
  private readonly defaultInappropriateWords = [
    // Add common inappropriate words here
    'بد', 'بازی', 'مزاحم', 'آزاردهنده'
    // Note: In production, this should be loaded from a more comprehensive database
  ];

  canProcess(context: ProcessingContext): boolean {
    return !!(context.field.enableInappropriateWordsDetection && context.currentValue);
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    
    if (!currentValue || typeof currentValue !== 'string') {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }

    try {
      const inappropriateWords = this.getInappropriateWordsList(field);
      const detectedWords = this.findInappropriateWords(currentValue, inappropriateWords);
      const action = field.inappropriateWordsAction || 'warn';
      
      if (detectedWords.length > 0) {
        return this.handleInappropriateWords(currentValue, detectedWords, action, context);
      }

      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }
  }

  /**
   * Get the list of inappropriate words for this field
   * دریافت لیست کلمات نامناسب برای این فیلد
   */
  private getInappropriateWordsList(field: any): string[] {
    // Combine default words with custom words if provided
    const customWords = Array.isArray(field.profanityCheck?.customWords) 
      ? field.profanityCheck.customWords 
      : [];
    
    return [...this.defaultInappropriateWords, ...customWords];
  }

  /**
   * Find inappropriate words in the text
   * یافتن کلمات نامناسب در متن
   */
  private findInappropriateWords(text: string, wordList: string[]): string[] {
    const foundWords: string[] = [];
    const textLower = text.toLowerCase();
    
    for (const word of wordList) {
      const wordLower = word.toLowerCase();
      if (textLower.includes(wordLower)) {
        foundWords.push(word);
      }
    }
    
    return foundWords;
  }

  /**
   * Handle inappropriate words based on action
   * مدیریت کلمات نامناسب بر اساس عمل
   */
  private handleInappropriateWords(
    value: string, 
    detectedWords: string[], 
    action: string, 
    context: ProcessingContext
  ): ProcessingResult {
    const wordsList = detectedWords.join('، ');
    
    switch (action) {
      case 'block':
        return {
          value: '',
          isValid: false,
          hasChanges: true,
          context,
          validationErrors: [`متن حاوی کلمات نامناسب است: ${wordsList}`]
        };
      
      case 'replace':
        const cleanedValue = this.replaceInappropriateWords(value, detectedWords);
        return {
          value: cleanedValue,
          isValid: true,
          hasChanges: cleanedValue !== value,
          context,
          validationErrors: [`کلمات نامناسب جایگزین شدند: ${wordsList}`]
        };
      
      case 'warn':
      default:
        return {
          value: value,
          isValid: true,
          hasChanges: false,
          context,
          validationErrors: [`هشدار: متن حاوی کلمات نامناسب است: ${wordsList}`]
        };
    }
  }

  /**
   * Replace inappropriate words with asterisks
   * جایگزینی کلمات نامناسب با ستاره
   */
  private replaceInappropriateWords(text: string, words: string[]): string {
    let cleanedText = text;
    
    for (const word of words) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
    }
    
    return cleanedText;
  }

  cleanup(): void {}
}

/**
 * Data masking processor for protecting sensitive information display
 * پردازشگر ماسک کردن داده برای حفاظت از نمایش اطلاعات حساس
 */
export class DataMaskingProcessor implements IFieldProcessor {
  name = 'DataMaskingProcessor';
  priority = 75;
  enabled = true;

  canProcess(context: ProcessingContext): boolean {
    return !!(context.field.maskPattern && context.currentValue);
  }

  process(context: ProcessingContext): ProcessingResult {
    const { field, currentValue } = context;
    
    if (!currentValue || !field.maskPattern) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }

    try {
      const maskedValue = this.applyMask(currentValue, field.maskPattern);
      
      return {
        value: maskedValue,
        isValid: true,
        hasChanges: maskedValue !== currentValue,
        context
      };

    } catch (error) {
      return {
        value: currentValue,
        isValid: true,
        hasChanges: false,
        context
      };
    }
  }

  /**
   * Apply masking pattern to the value
   * اعمال الگوی ماسک به مقدار
   */
  private applyMask(value: string, pattern: string): string {
    // Common masking patterns
    switch (pattern) {
      case 'phone':
        // (XXX) XXX-XXXX
        return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      
      case 'card':
        // XXXX-XXXX-XXXX-XXXX
        return value.replace(/(\d{4})/g, '$1-').slice(0, -1);
      
      case 'national-id':
        // XXX-XXX-XXXX
        return value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      
      case 'iban':
        // IR XX XXXX XXXX XXXX XXXX XXXX XX
        return value.replace(/(IR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4 $5 $6 $7 $8');
      
      default:
        // Custom pattern
        return this.applyCustomMask(value, pattern);
    }
  }

  /**
   * Apply custom masking pattern
   * اعمال الگوی ماسک سفارشی
   */
  private applyCustomMask(value: string, pattern: string): string {
    // Simple pattern replacement where:
    // X = any character (kept as is)
    // * = masked character
    // - = separator
    
    let result = '';
    let valueIndex = 0;
    
    for (let i = 0; i < pattern.length && valueIndex < value.length; i++) {
      const patternChar = pattern[i];
      const valueChar = value[valueIndex];
      
      if (patternChar === 'X') {
        result += valueChar;
        valueIndex++;
      } else if (patternChar === '*') {
        result += '*';
        valueIndex++;
      } else {
        result += patternChar;
      }
    }
    
    return result;
  }

  cleanup(): void {}
}

export const SecurityFilter = { 
  SensitiveDataDetector, 
  InappropriateWordsFilter, 
  DataMaskingProcessor 
};