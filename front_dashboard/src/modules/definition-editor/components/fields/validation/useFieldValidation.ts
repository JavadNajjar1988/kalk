import { useState, useEffect, useCallback, useRef } from 'react';
import { ValidationEngine } from './ValidationEngine';
import {
  ValidationResult,
  ValidationContext,
  ValidationMode,
  ValidationOptions,
  ValidationRule
} from './types';

interface UseFieldValidationOptions {
  mode?: ValidationMode;
  debounceDelay?: number;
  showWarnings?: boolean;
  validateOnMount?: boolean;
  clearOnUnmount?: boolean;
  stopOnFirstError?: boolean;
  enableAsync?: boolean;
  timeout?: number;
}

interface UseFieldValidationReturn {
  validationResult: ValidationResult | null;
  isValidating: boolean;
  validate: (value: any, context?: Partial<ValidationContext>) => Promise<ValidationResult>;
  clearValidation: () => void;
  addRule: (rule: ValidationRule) => void;
  removeRule: (ruleId: string) => void;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: string[];
  warnings: string[];
}

export const useFieldValidation = (
  fieldId: string,
  initialRules: ValidationRule[] = [],
  options: UseFieldValidationOptions = {}
): UseFieldValidationReturn => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const validationEngine = useRef(ValidationEngine.getInstance());
  const isMountedRef = useRef(true);

  const defaultOptions: ValidationOptions = {
    mode: options.mode || ValidationMode.ON_CHANGE,
    debounceDelay: options.debounceDelay || 300,
    showWarnings: options.showWarnings ?? true,
    stopOnFirstError: options.stopOnFirstError ?? false,
    enableAsync: options.enableAsync ?? true,
    timeout: options.timeout || 5000
  };

  const validateOnMount = options.validateOnMount ?? false;
  const clearOnUnmount = options.clearOnUnmount ?? true;

  // Initialize rules
  useEffect(() => {
    initialRules.forEach(rule => {
      validationEngine.current.addRule({
        ...rule,
        id: `${fieldId}_${rule.id}`
      });
    });

    return () => {
      if (clearOnUnmount) {
        initialRules.forEach(rule => {
          validationEngine.current.removeRule(`${fieldId}_${rule.id}`);
        });
      }
    };
  }, [fieldId, initialRules, clearOnUnmount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      validationEngine.current.cleanup();
    };
  }, []);

  const validate = useCallback(async (
    value: any,
    contextOverrides: Partial<ValidationContext> = {}
  ): Promise<ValidationResult> => {
    if (!isMountedRef.current) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        fieldId,
        timestamp: Date.now()
      };
    }

    setIsValidating(true);

    const context: ValidationContext = {
      fieldId,
      value,
      formData: {},
      fieldDefinition: {},
      isUserInput: true,
      validationMode: defaultOptions.mode,
      ...contextOverrides
    };

    try {
      const result = await validationEngine.current.validateField(context, defaultOptions);
      
      if (isMountedRef.current) {
        setValidationResult(result);
        setIsValidating(false);
      }
      
      return result;
    } catch (error) {
      console.error('Validation failed:', error);
      
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          ruleId: 'validation_error',
          message: 'Validation failed due to internal error',
          severity: 'error',
          code: 'VALIDATION_INTERNAL_ERROR',
          field: fieldId,
          value
        }],
        warnings: [],
        fieldId,
        timestamp: Date.now()
      };

      if (isMountedRef.current) {
        setValidationResult(errorResult);
        setIsValidating(false);
      }
      
      return errorResult;
    }
  }, [fieldId, defaultOptions]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setIsValidating(false);
  }, []);

  const addRule = useCallback((rule: ValidationRule) => {
    validationEngine.current.addRule({
      ...rule,
      id: `${fieldId}_${rule.id}`
    });
  }, [fieldId]);

  const removeRule = useCallback((ruleId: string) => {
    validationEngine.current.removeRule(`${fieldId}_${ruleId}`);
  }, [fieldId]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validate('');
    }
  }, [validateOnMount, validate]);

  // Computed properties
  const isValid = validationResult?.isValid ?? true;
  const hasErrors = (validationResult?.errors?.length ?? 0) > 0;
  const hasWarnings = (validationResult?.warnings?.length ?? 0) > 0;
  const errors = validationResult?.errors?.map(error => error.message) ?? [];
  const warnings = validationResult?.warnings?.map(warning => warning.message) ?? [];

  return {
    validationResult,
    isValidating,
    validate,
    clearValidation,
    addRule,
    removeRule,
    isValid,
    hasErrors,
    hasWarnings,
    errors,
    warnings
  };
};