/**
 * Enhanced Validation and Error Handling System for Smart Field Builder
 * Provides comprehensive validation, error messaging, and user feedback
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Snackbar,
  Chip,
  useTheme,
  alpha,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Validation rule types
export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'minLength',
  MAX_LENGTH = 'maxLength',
  PATTERN = 'pattern',
  CUSTOM = 'custom',
  UNIQUE = 'unique',
  DEPENDENCY = 'dependency'
}

// Error severity levels
export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success'
}

// Validation error interface
export interface ValidationError {
  field: string;
  type: ValidationType;
  message: string;
  severity: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
}

// Field validation rule interface
export interface FieldValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
  validator?: (value: any, context?: any) => boolean | Promise<boolean>;
}

// Validation context
export interface ValidationContext {
  fieldId: string;
  fieldType: string;
  currentStep: number;
  allFields: any[];
  formData: Record<string, any>;
}

// Persian error messages
const ERROR_MESSAGES: Record<string, string> = {
  REQUIRED: 'این فیلد اجباری است',
  MIN_LENGTH: 'حداقل {min} کاراکتر وارد کنید',
  MAX_LENGTH: 'حداکثر {max} کاراکتر مجاز است',
  PATTERN: 'فرمت وارد شده صحیح نیست',
  UNIQUE: 'این مقدار قبلاً استفاده شده است',
  INVALID_EMAIL: 'آدرس ایمیل صحیح نیست',
  INVALID_PHONE: 'شماره تلفن صحیح نیست',
  INVALID_URL: 'آدرس وب صحیح نیست',
  FIELD_NAME_EXISTS: 'نام فیلد تکراری است',
  DEPENDENCY_NOT_MET: 'وابستگی فیلد برآورده نشده است',
  STEP_INCOMPLETE: 'مرحله ناکامل است',
  CONFIGURATION_INVALID: 'تنظیمات فیلد نامعتبر است'
};

// Validation rules for different field types
export const FIELD_VALIDATION_RULES: Record<string, FieldValidationRule[]> = {
  text: [
    {
      type: ValidationType.REQUIRED,
      message: ERROR_MESSAGES.REQUIRED
    },
    {
      type: ValidationType.MIN_LENGTH,
      value: 1,
      message: ERROR_MESSAGES.MIN_LENGTH.replace('{min}', '1')
    },
    {
      type: ValidationType.MAX_LENGTH,
      value: 255,
      message: ERROR_MESSAGES.MAX_LENGTH.replace('{max}', '255')
    }
  ],
  email: [
    {
      type: ValidationType.REQUIRED,
      message: ERROR_MESSAGES.REQUIRED
    },
    {
      type: ValidationType.PATTERN,
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: ERROR_MESSAGES.INVALID_EMAIL
    }
  ],
  phone: [
    {
      type: ValidationType.REQUIRED,
      message: ERROR_MESSAGES.REQUIRED
    },
    {
      type: ValidationType.PATTERN,
      value: /^[\+]?[0-9]{10,15}$/,
      message: ERROR_MESSAGES.INVALID_PHONE
    }
  ]
};

// Enhanced validation engine
export class ValidationEngine {
  private rules: Map<string, FieldValidationRule[]> = new Map();
  private customValidators: Map<string, Function> = new Map();

  constructor() {
    // Initialize with default rules
    Object.entries(FIELD_VALIDATION_RULES).forEach(([type, rules]) => {
      this.rules.set(type, rules);
    });
  }

  // Add custom validation rule
  addRule(fieldType: string, rule: FieldValidationRule): void {
    const existingRules = this.rules.get(fieldType) || [];
    this.rules.set(fieldType, [...existingRules, rule]);
  }

  // Add custom validator function
  addValidator(name: string, validator: Function): void {
    this.customValidators.set(name, validator);
  }

  // Validate a single field
  async validateField(
    fieldType: string,
    value: any,
    context: ValidationContext
  ): Promise<ValidationError[]> {
    const rules = this.rules.get(fieldType) || [];
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const isValid = await this.executeRule(rule, value, context);
      
      if (!isValid) {
        errors.push({
          field: context.fieldId,
          type: rule.type,
          message: rule.message,
          severity: ErrorSeverity.ERROR,
          context: { value, rule }
        });
      }
    }

    return errors;
  }

  // Execute a validation rule
  private async executeRule(
    rule: FieldValidationRule,
    value: any,
    context: ValidationContext
  ): Promise<boolean> {
    switch (rule.type) {
      case ValidationType.REQUIRED:
        return value !== null && value !== undefined && value !== '';

      case ValidationType.MIN_LENGTH:
        return typeof value === 'string' && value.length >= (rule.value || 0);

      case ValidationType.MAX_LENGTH:
        return typeof value === 'string' && value.length <= (rule.value || Infinity);

      case ValidationType.PATTERN:
        return rule.value instanceof RegExp ? rule.value.test(value) : true;

      case ValidationType.UNIQUE:
        return !context.allFields.some(field => 
          field.id !== context.fieldId && field.value === value
        );

      case ValidationType.CUSTOM:
        if (rule.validator) {
          return await rule.validator(value, context);
        }
        return true;

      default:
        return true;
    }
  }

  // Validate entire form/step
  async validateStep(
    stepData: Record<string, any>,
    context: Partial<ValidationContext>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const [fieldId, fieldData] of Object.entries(stepData)) {
      const fieldContext: ValidationContext = {
        fieldId,
        fieldType: fieldData.type || 'text',
        currentStep: context.currentStep || 0,
        allFields: context.allFields || [],
        formData: stepData
      };

      const fieldErrors = await this.validateField(
        fieldData.type || 'text',
        fieldData.value,
        fieldContext
      );

      errors.push(...fieldErrors);
    }

    return errors;
  }
}

// Error display component
interface ErrorDisplayProps {
  errors: ValidationError[];
  showDetails?: boolean;
  maxErrors?: number;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  showDetails = false,
  maxErrors = 5
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const sortedErrors = useMemo(() => {
    return [...errors].sort((a, b) => {
      const severityOrder = {
        [ErrorSeverity.ERROR]: 0,
        [ErrorSeverity.WARNING]: 1,
        [ErrorSeverity.INFO]: 2,
        [ErrorSeverity.SUCCESS]: 3
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [errors]);

  const visibleErrors = expanded ? sortedErrors : sortedErrors.slice(0, maxErrors);
  const hasMoreErrors = sortedErrors.length > maxErrors;

  const getErrorIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.ERROR:
        return <ErrorIcon color="error" />;
      case ErrorSeverity.WARNING:
        return <WarningIcon color="warning" />;
      case ErrorSeverity.INFO:
        return <InfoIcon color="info" />;
      case ErrorSeverity.SUCCESS:
        return <SuccessIcon color="success" />;
    }
  };

  const getErrorColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.ERROR:
        return theme.palette.error.main;
      case ErrorSeverity.WARNING:
        return theme.palette.warning.main;
      case ErrorSeverity.INFO:
        return theme.palette.info.main;
      case ErrorSeverity.SUCCESS:
        return theme.palette.success.main;
    }
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity={sortedErrors[0]?.severity || 'error'}
        sx={{ 
          mb: 1,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle>
          {errors.length === 1 ? 'خطا در فرم' : `${errors.length} خطا در فرم`}
        </AlertTitle>
        
        <List dense sx={{ mt: 1 }}>
          {visibleErrors.map((error, index) => (
            <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {getErrorIcon(error.severity)}
              </ListItemIcon>
              <ListItemText
                primary={error.message}
                secondary={showDetails ? `فیلد: ${error.field}` : undefined}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    color: getErrorColor(error.severity)
                  },
                  '& .MuiListItemText-secondary': {
                    fontSize: '0.75rem'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>

        {hasMoreErrors && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Chip
              label={expanded ? 'کمتر نمایش بده' : `${sortedErrors.length - maxErrors} خطای دیگر`}
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}
      </Alert>
    </Box>
  );
};

// Real-time validation hook
export const useRealTimeValidation = (
  fieldType: string,
  debounceMs: number = 300
) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const validationEngine = useMemo(() => new ValidationEngine(), []);

  const validateValue = useCallback(async (
    value: any,
    context: ValidationContext
  ) => {
    setIsValidating(true);
    
    try {
      const fieldErrors = await validationEngine.validateField(fieldType, value, context);
      setErrors(fieldErrors);
    } catch (error) {
      console.error('Validation error:', error);
      setErrors([{
        field: context.fieldId,
        type: ValidationType.CUSTOM,
        message: 'خطا در اعتبارسنجی',
        severity: ErrorSeverity.ERROR
      }]);
    } finally {
      setIsValidating(false);
    }
  }, [fieldType, validationEngine]);

  // Debounced validation
  const debouncedValidate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (value: any, context: ValidationContext) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        validateValue(value, context);
      }, debounceMs);
    };
  }, [validateValue, debounceMs]);

  return {
    errors,
    isValidating,
    validate: debouncedValidate,
    hasErrors: errors.length > 0,
    clearErrors: () => setErrors([])
  };
};

// Success/confirmation messages
export const SuccessMessage: React.FC<{
  message: string;
  details?: string;
  onClose?: () => void;
}> = ({ message, details, onClose }) => {
  return (
    <Alert 
      severity="success" 
      onClose={onClose}
      sx={{ mb: 2 }}
    >
      <AlertTitle>{message}</AlertTitle>
      {details && <Typography variant="body2">{details}</Typography>}
    </Alert>
  );
};

// Global error state management
export const useGlobalErrorState = () => {
  const [globalErrors, setGlobalErrors] = useState<ValidationError[]>([]);

  const addError = useCallback((error: ValidationError) => {
    setGlobalErrors(prev => [...prev, { ...error, code: Date.now().toString() }]);
  }, []);

  const removeError = useCallback((errorCode: string) => {
    setGlobalErrors(prev => prev.filter(error => error.code !== errorCode));
  }, []);

  const clearErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  return {
    globalErrors,
    addError,
    removeError,
    clearErrors,
    hasErrors: globalErrors.length > 0
  };
};