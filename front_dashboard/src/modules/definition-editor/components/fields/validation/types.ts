// Advanced Field Validation System - Type Definitions
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: ValidationRuleType;
  config: ValidationRuleConfig;
  enabled: boolean;
  priority: number;
  errorMessage: string;
  warningMessage?: string;
}

export enum ValidationRuleType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  PATTERN = 'pattern',
  CUSTOM = 'custom',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  NUMBER_RANGE = 'numberRange',
  DATE_RANGE = 'dateRange',
  FILE_TYPE = 'fileType',
  FILE_SIZE = 'fileSize',
  UNIQUE = 'unique',
  DEPENDENCY = 'dependency',
  CONDITIONAL = 'conditional'
}

export interface ValidationRuleConfig {
  // String validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  caseSensitive?: boolean;
  
  // Number validation
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  
  // Date validation
  minDate?: string;
  maxDate?: string;
  allowWeekends?: boolean;
  allowPastDates?: boolean;
  
  // File validation
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  minSize?: number;
  
  // Custom validation
  customFunction?: string; // JavaScript function as string
  
  // Dependency validation
  dependsOn?: string; // field ID
  dependencyValue?: any;
  dependencyOperator?: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';
  
  // Conditional validation
  conditions?: ValidationCondition[];
}

export interface ValidationCondition {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fieldId: string;
  timestamp: number;
}

export interface ValidationError {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  field: string;
  value: any;
}

export interface ValidationWarning {
  ruleId: string;
  message: string;
  code: string;
  field: string;
  value: any;
}

export interface ValidationContext {
  fieldId: string;
  value: any;
  formData: Record<string, any>;
  fieldDefinition: any;
  previousValue?: any;
  isUserInput: boolean;
  validationMode: ValidationMode;
}

export enum ValidationMode {
  ON_CHANGE = 'onChange',
  ON_BLUR = 'onBlur',
  ON_SUBMIT = 'onSubmit',
  REAL_TIME = 'realTime'
}

export interface ValidationOptions {
  mode: ValidationMode;
  debounceDelay?: number;
  showWarnings?: boolean;
  validateOnMount?: boolean;
  stopOnFirstError?: boolean;
  enableAsync?: boolean;
  timeout?: number;
}

export interface ValidationRulePreset {
  id: string;
  name: string;
  description: string;
  rules: ValidationRule[];
  category: 'common' | 'advanced' | 'custom';
  tags: string[];
}

// Built-in validation rule presets
export const VALIDATION_PRESETS: ValidationRulePreset[] = [
  {
    id: 'required-text',
    name: 'Required Text Field',
    description: 'Basic required text field with minimum length',
    category: 'common',
    tags: ['required', 'text'],
    rules: [
      {
        id: 'req-1',
        name: 'Required',
        description: 'Field is required',
        type: ValidationRuleType.REQUIRED,
        config: {},
        enabled: true,
        priority: 1,
        errorMessage: 'This field is required'
      },
      {
        id: 'min-1',
        name: 'Minimum Length',
        description: 'Minimum 2 characters',
        type: ValidationRuleType.MIN_LENGTH,
        config: { minLength: 2 },
        enabled: true,
        priority: 2,
        errorMessage: 'Must be at least 2 characters'
      }
    ]
  },
  {
    id: 'email-validation',
    name: 'Email Validation',
    description: 'Complete email validation with format checking',
    category: 'common',
    tags: ['email', 'format'],
    rules: [
      {
        id: 'email-1',
        name: 'Email Format',
        description: 'Valid email format required',
        type: ValidationRuleType.EMAIL,
        config: {},
        enabled: true,
        priority: 1,
        errorMessage: 'Please enter a valid email address'
      }
    ]
  },
  {
    id: 'phone-validation',
    name: 'Phone Number Validation',
    description: 'Iranian phone number validation',
    category: 'common',
    tags: ['phone', 'iranian'],
    rules: [
      {
        id: 'phone-1',
        name: 'Phone Format',
        description: 'Valid Iranian phone number',
        type: ValidationRuleType.PATTERN,
        config: { 
          pattern: '^(\\+98|0)?9\\d{9}$',
          caseSensitive: false
        },
        enabled: true,
        priority: 1,
        errorMessage: 'Please enter a valid Iranian mobile number'
      }
    ]
  },
  {
    id: 'strong-password',
    name: 'Strong Password',
    description: 'Strong password with special characters',
    category: 'advanced',
    tags: ['password', 'security'],
    rules: [
      {
        id: 'pass-1',
        name: 'Minimum Length',
        description: 'At least 8 characters',
        type: ValidationRuleType.MIN_LENGTH,
        config: { minLength: 8 },
        enabled: true,
        priority: 1,
        errorMessage: 'Password must be at least 8 characters'
      },
      {
        id: 'pass-2',
        name: 'Complex Pattern',
        description: 'Contains uppercase, lowercase, number and special char',
        type: ValidationRuleType.PATTERN,
        config: { 
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
          caseSensitive: true
        },
        enabled: true,
        priority: 2,
        errorMessage: 'Password must contain uppercase, lowercase, number and special character'
      }
    ]
  }
];