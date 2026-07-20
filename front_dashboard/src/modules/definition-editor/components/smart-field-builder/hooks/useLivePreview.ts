/**
 * Live Preview Hook for Smart Field Builder
 * Provides real-time field preview with validation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdvancedMemo, useSmartCallback } from './useAdvancedMemoization';
import { useEnhancedValidation } from '../components/validation/EnhancedValidation';
import { fieldValidationRules } from '../components/validation/ValidationRules';

interface PreviewField {
  id: string;
  type: string;
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: any;
  options?: any[];
  metadata?: any;
}

interface PreviewConfig {
  fields: PreviewField[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  compact?: boolean;
  showValidation?: boolean;
  showMetadata?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

interface PreviewState {
  values: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isValid: boolean;
  validationCount: number;
}

export const useLivePreview = (
  config: PreviewConfig,
  updateInterval: number = 500
) => {
  const [previewState, setPreviewState] = useState<PreviewState>({
    values: {},
    errors: {},
    touched: {},
    isValid: true,
    validationCount: 0
  });

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [previewSize, setPreviewSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Enhanced validation for live preview
  const validationRules = useMemo(() => {
    return config.fields.flatMap(field => 
      fieldValidationRules(field.type, field.name, field)
    );
  }, [config.fields]);

  const { validationState, validateField, validateAll, isValidating } = useEnhancedValidation(
    validationRules,
    true
  );

  // Update field value with live validation
  const updateFieldValue = useSmartCallback(
    async (fieldName: string, value: any) => {
      setPreviewState(prev => ({
        ...prev,
        values: { ...prev.values, [fieldName]: value },
        touched: { ...prev.touched, [fieldName]: true }
      }));

      // Validate field after update
      if (config.showValidation) {
        const validation = await validateField(fieldName, value);
        
        setPreviewState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: validation.errors
          },
          validationCount: prev.validationCount + 1
        }));
      }
    },
    [validateField, config.showValidation],
    { debounce: updateInterval }
  );

  // Get field value
  const getFieldValue = useCallback((fieldName: string) => {
    return previewState.values[fieldName] || '';
  }, [previewState.values]);

  // Get field error
  const getFieldError = useCallback((fieldName: string) => {
    return previewState.errors[fieldName] || [];
  }, [previewState.errors]);

  // Check if field is touched
  const isFieldTouched = useCallback((fieldName: string) => {
    return previewState.touched[fieldName] || false;
  }, [previewState.touched]);

  // Validate all fields
  const validateAllFields = useCallback(async () => {
    const validation = await validateAll(previewState.values);
    
    setPreviewState(prev => ({
      ...prev,
      errors: validation.fieldErrors || {},
      isValid: validation.isValid,
      validationCount: prev.validationCount + 1
    }));

    return validation;
  }, [validateAll, previewState.values]);

  // Reset preview state
  const resetPreview = useCallback(() => {
    setPreviewState({
      values: {},
      errors: {},
      touched: {},
      isValid: true,
      validationCount: 0
    });
  }, []);

  // Get preview data for display
  const getPreviewData = useAdvancedMemo(
    () => {
      return {
        fields: config.fields.map(field => ({
          ...field,
          value: getFieldValue(field.name),
          error: getFieldError(field.name),
          touched: isFieldTouched(field.name),
          hasError: getFieldError(field.name).length > 0
        })),
        isValid: previewState.isValid,
        hasErrors: Object.values(previewState.errors).some(errors => errors.length > 0),
        totalFields: config.fields.length,
        touchedFields: Object.keys(previewState.touched).length,
        validatedFields: previewState.validationCount
      };
    },
    [config.fields, previewState, getFieldValue, getFieldError, isFieldTouched],
    { ttl: 200, deep: true }
  );

  // Auto-validate when all fields are filled
  useEffect(() => {
    const allFieldsFilled = config.fields.every(field => 
      getFieldValue(field.name) !== '' && getFieldValue(field.name) !== undefined
    );

    if (allFieldsFilled && config.showValidation) {
      validateAllFields();
    }
  }, [config.fields, getFieldValue, validateAllFields, config.showValidation]);

  // Initialize default values
  useEffect(() => {
    const defaultValues: Record<string, any> = {};
    
    config.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultValues[field.name] = field.defaultValue;
      }
    });

    if (Object.keys(defaultValues).length > 0) {
      setPreviewState(prev => ({
        ...prev,
        values: { ...prev.values, ...defaultValues }
      }));
    }
  }, [config.fields]);

  // Generate preview styles based on config
  const getPreviewStyles = useCallback(() => {
    const baseStyles = {
      padding: previewSize === 'small' ? '12px' : previewSize === 'large' ? '24px' : '16px',
      borderRadius: '8px',
      border: '1px solid',
      borderColor: previewState.isValid ? '#e0e0e0' : '#f44336',
      backgroundColor: config.theme === 'dark' ? '#121212' : '#ffffff',
      color: config.theme === 'dark' ? '#ffffff' : '#000000',
      transition: 'all 0.3s ease',
      opacity: isPreviewVisible ? 1 : 0.5
    };

    if (config.layout === 'grid') {
      return {
        ...baseStyles,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      };
    }

    if (config.layout === 'horizontal') {
      return {
        ...baseStyles,
        display: 'flex',
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: '16px'
      };
    }

    return {
      ...baseStyles,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    };
  }, [previewSize, previewState.isValid, config.theme, config.layout, isPreviewVisible]);

  // Export preview data
  const exportPreviewData = useCallback(() => {
    return {
      configuration: config,
      currentValues: previewState.values,
      validation: {
        isValid: previewState.isValid,
        errors: previewState.errors,
        touched: previewState.touched
      },
      metadata: {
        timestamp: new Date().toISOString(),
        totalFields: config.fields.length,
        validationCount: previewState.validationCount
      }
    };
  }, [config, previewState]);

  return {
    // State
    previewState,
    isPreviewVisible,
    previewSize,
    isValidating,
    
    // Field operations
    updateFieldValue,
    getFieldValue,
    getFieldError,
    isFieldTouched,
    
    // Validation
    validateAllFields,
    validationState,
    
    // Preview management
    resetPreview,
    getPreviewData,
    getPreviewStyles,
    exportPreviewData,
    
    // UI controls
    setIsPreviewVisible,
    setPreviewSize,
    
    // Configuration
    config
  };
};

// Hook for managing multiple previews
export const useMultiPreview = (
  configs: PreviewConfig[],
  options: {
    maxPreviews?: number;
    syncValidation?: boolean;
    autoSwitch?: boolean;
  } = {}
) => {
  const { maxPreviews = 3, syncValidation = false, autoSwitch = false } = options;
  
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previews, setPreviews] = useState<any[]>([]);

  // Initialize previews
  useEffect(() => {
    const newPreviews = configs.slice(0, maxPreviews).map((config, index) => ({
      id: `preview_${index}`,
      config,
      isActive: index === activePreviewIndex
    }));
    
    setPreviews(newPreviews);
  }, [configs, maxPreviews, activePreviewIndex]);

  // Switch active preview
  const switchPreview = useCallback((index: number) => {
    if (index >= 0 && index < previews.length) {
      setActivePreviewIndex(index);
    }
  }, [previews.length]);

  // Get active preview
  const getActivePreview = useCallback(() => {
    return previews[activePreviewIndex];
  }, [previews, activePreviewIndex]);

  return {
    previews,
    activePreviewIndex,
    switchPreview,
    getActivePreview,
    totalPreviews: previews.length
  };
};