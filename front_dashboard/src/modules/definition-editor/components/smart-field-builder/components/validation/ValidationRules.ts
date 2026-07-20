/**
 * Smart Field Validation Rules
 * Provides pre-built validation rules for different field types
 */

import { ValidationRule } from './EnhancedValidation';

// Common validation rules
export const createRequiredRule = (fieldId: string, message = 'این فیلد اجباری است'): ValidationRule => ({
  id: fieldId,
  type: 'required',
  message,
  severity: 'error',
  validator: (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  }
});

export const createMinLengthRule = (fieldId: string, minLength: number): ValidationRule => ({
  id: fieldId,
  type: 'minLength',
  message: `حداقل ${minLength} کاراکتر وارد کنید`,
  severity: 'error',
  validator: (value) => {
    const str = String(value || '');
    return str.length >= minLength;
  }
});

export const createMaxLengthRule = (fieldId: string, maxLength: number): ValidationRule => ({
  id: fieldId,
  type: 'maxLength',
  message: `حداکثر ${maxLength} کاراکتر مجاز است`,
  severity: 'error',
  validator: (value) => {
    const str = String(value || '');
    return str.length <= maxLength;
  }
});

export const createPatternRule = (fieldId: string, pattern: RegExp, message: string): ValidationRule => ({
  id: fieldId,
  type: 'pattern',
  message,
  severity: 'error',
  validator: (value) => {
    if (!value) return true; // Allow empty if not required
    return pattern.test(String(value));
  }
});

// Field-specific validation rules
export const fieldNameRules = (fieldId = 'fieldName'): ValidationRule[] => [
  createRequiredRule(fieldId, 'نام فیلد اجباری است'),
  createMinLengthRule(fieldId, 2),
  createMaxLengthRule(fieldId, 50),
  createPatternRule(
    fieldId,
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'نام فیلد باید با حرف شروع شود و فقط شامل حروف، اعداد و خط تیره باشد'
  ),
  {
    id: fieldId,
    type: 'custom',
    message: 'نام فیلد نباید با کلمات رزرو شده تداخل داشته باشد',
    severity: 'warning',
    validator: (value) => {
      const reservedWords = ['id', 'created', 'updated', 'deleted', 'type', 'class', 'function'];
      return !reservedWords.includes(String(value).toLowerCase());
    }
  }
];

export const fieldLabelRules = (fieldId = 'fieldLabel'): ValidationRule[] => [
  createRequiredRule(fieldId, 'برچسب فیلد اجباری است'),
  createMinLengthRule(fieldId, 1),
  createMaxLengthRule(fieldId, 100),
  {
    id: fieldId,
    type: 'custom',
    message: 'برچسب فیلد نباید فقط شامل اعداد باشد',
    severity: 'warning',
    validator: (value) => {
      return !/^\d+$/.test(String(value || '').trim());
    }
  }
];

export const fieldDescriptionRules = (fieldId = 'fieldDescription'): ValidationRule[] => [
  createMaxLengthRule(fieldId, 500),
  {
    id: fieldId,
    type: 'custom',
    message: 'توضیحات مفصل بهتر است',
    severity: 'info',
    validator: (value) => {
      const str = String(value || '').trim();
      return str.length === 0 || str.length >= 10;
    }
  }
];

// Text field specific rules
export const textFieldRules = (fieldId: string, config: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}): ValidationRule[] => {
  const rules: ValidationRule[] = [];
  
  if (config.minLength) {
    rules.push(createMinLengthRule(fieldId, config.minLength));
  }
  
  if (config.maxLength) {
    rules.push(createMaxLengthRule(fieldId, config.maxLength));
  }
  
  if (config.pattern && config.patternMessage) {
    rules.push(createPatternRule(fieldId, config.pattern, config.patternMessage));
  }
  
  return rules;
};

// Number field specific rules
export const numberFieldRules = (fieldId: string, config: {
  min?: number;
  max?: number;
  integer?: boolean;
}): ValidationRule[] => [
  {
    id: fieldId,
    type: 'pattern',
    message: 'لطفاً یک عدد معتبر وارد کنید',
    severity: 'error',
    validator: (value) => {
      if (!value && value !== 0) return true;
      const num = Number(value);
      if (isNaN(num)) return false;
      if (config.integer && !Number.isInteger(num)) return false;
      return true;
    }
  },
  ...(config.min !== undefined ? [{
    id: fieldId,
    type: 'custom' as const,
    message: `مقدار نباید کمتر از ${config.min} باشد`,
    severity: 'error' as const,
    validator: (value: any) => {
      if (!value && value !== 0) return true;
      return Number(value) >= config.min!;
    }
  }] : []),
  ...(config.max !== undefined ? [{
    id: fieldId,
    type: 'custom' as const,
    message: `مقدار نباید بیشتر از ${config.max} باشد`,
    severity: 'error' as const,
    validator: (value: any) => {
      if (!value && value !== 0) return true;
      return Number(value) <= config.max!;
    }
  }] : [])
];

// Choice field specific rules
export const choiceFieldRules = (fieldId: string, options: any[]): ValidationRule[] => [
  {
    id: fieldId,
    type: 'custom',
    message: 'حداقل یک گزینه باید تعریف شود',
    severity: 'error',
    validator: () => options.length > 0
  },
  {
    id: fieldId,
    type: 'custom',
    message: 'گزینه‌های تکراری وجود دارد',
    severity: 'error',
    validator: () => {
      const values = options.map(opt => opt.value || opt.id);
      return new Set(values).size === values.length;
    }
  },
  {
    id: fieldId,
    type: 'custom',
    message: 'برای تجربه بهتر، حداکثر 10 گزینه توصیه می‌شود',
    severity: 'info',
    validator: () => options.length <= 10
  }
];

// Email validation
export const emailRules = (fieldId: string): ValidationRule[] => [
  createPatternRule(
    fieldId,
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    'لطفاً یک آدرس ایمیل معتبر وارد کنید'
  ),
  {
    id: fieldId,
    type: 'custom',
    message: 'آدرس ایمیل بیش از حد طولانی است',
    severity: 'warning',
    validator: (value) => {
      return !value || String(value).length <= 254;
    }
  }
];

// Phone number validation
export const phoneRules = (fieldId: string): ValidationRule[] => [
  createPatternRule(
    fieldId,
    /^[\+]?[0-9\-\(\)\s]{10,15}$/,
    'لطفاً شماره تلفن معتبر وارد کنید'
  ),
  {
    id: fieldId,
    type: 'custom',
    message: 'شماره تلفن باید حداقل 10 رقم داشته باشد',
    severity: 'warning',
    validator: (value) => {
      if (!value) return true;
      const digits = String(value).replace(/\D/g, '');
      return digits.length >= 10;
    }
  }
];

// URL validation
export const urlRules = (fieldId: string): ValidationRule[] => [
  {
    id: fieldId,
    type: 'pattern',
    message: 'لطفاً آدرس وب معتبر وارد کنید',
    severity: 'error',
    validator: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  }
];

// Cross-field validation
export const createDependencyRule = (
  fieldId: string,
  dependentFieldId: string,
  validator: (value: any, dependentValue: any) => boolean,
  message: string
): ValidationRule => ({
  id: fieldId,
  type: 'dependency',
  message,
  severity: 'error',
  dependencies: [dependentFieldId],
  validator: (value, context) => {
    const dependentValue = context?.[dependentFieldId];
    return validator(value, dependentValue);
  }
});

// Async validation (e.g., checking uniqueness)
export const createAsyncUniqueRule = (
  fieldId: string,
  checkUnique: (value: string) => Promise<boolean>,
  message = 'این مقدار قبلاً استفاده شده است'
): ValidationRule => ({
  id: fieldId,
  type: 'custom',
  message,
  severity: 'error',
  validator: async (value) => {
    if (!value) return true;
    try {
      return await checkUnique(String(value));
    } catch {
      return false;
    }
  }
});

// Validation rule factory
export const createValidationRules = (fieldType: string, config: any = {}): ValidationRule[] => {
  switch (fieldType) {
    case 'text':
      return textFieldRules('value', config);
    case 'number':
      return numberFieldRules('value', config);
    case 'email':
      return emailRules('value');
    case 'phone':
      return phoneRules('value');
    case 'url':
      return urlRules('value');
    case 'choice':
      return choiceFieldRules('options', config.options || []);
    default:
      return [];
  }
};