/**
 * Enhanced Validation System for Smart Field Builder
 * Provides real-time validation with smart error handling
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Alert, 
  AlertTitle, 
  Collapse, 
  Typography, 
  Button,
  Chip,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';

export interface ValidationRule {
  id: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'dependency';
  message: string;
  severity: 'error' | 'warning' | 'info';
  validator: (value: any, context?: any) => boolean | Promise<boolean>;
  dependencies?: string[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  progress: number;
}

// Enhanced validation hook
export const useEnhancedValidation = (rules: ValidationRule[], realTimeValidation = true) => {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    infos: [],
    progress: 0
  });
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (fieldName: string, value: any, context?: any) => {
    const fieldRules = rules.filter(rule => rule.id === fieldName);
    const results: ValidationError[] = [];

    for (const rule of fieldRules) {
      try {
        const isValid = await rule.validator(value, context);
        if (!isValid) {
          results.push({
            field: fieldName,
            rule: rule.type,
            message: rule.message,
            severity: rule.severity,
            suggestion: getSuggestionForRule(rule, value)
          });
        }
      } catch (error) {
        results.push({
          field: fieldName,
          rule: rule.type,
          message: `خطا در اعتبارسنجی: ${rule.message}`,
          severity: 'error'
        });
      }
    }

    return results;
  }, [rules]);

  const validateAll = useCallback(async (formData: Record<string, any>) => {
    setIsValidating(true);
    const allResults: ValidationError[] = [];
    const totalFields = Object.keys(formData).length;
    let completedFields = 0;

    for (const [fieldName, value] of Object.entries(formData)) {
      const fieldResults = await validateField(fieldName, value, formData);
      allResults.push(...fieldResults);
      
      completedFields++;
      const progress = (completedFields / totalFields) * 100;
      
      setValidationState(prev => ({
        ...prev,
        progress
      }));
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const errors = allResults.filter(r => r.severity === 'error');
    const warnings = allResults.filter(r => r.severity === 'warning');
    const infos = allResults.filter(r => r.severity === 'info');

    const finalState = {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      progress: 100
    };

    setValidationState(finalState);
    setIsValidating(false);
    
    return finalState;
  }, [validateField]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      infos: [],
      progress: 0
    });
  }, []);

  return {
    validationState,
    isValidating,
    validateField,
    validateAll,
    clearValidation
  };
};

// Smart suggestion system
const getSuggestionForRule = (rule: ValidationRule, value: any): string | undefined => {
  switch (rule.type) {
    case 'required':
      return 'این فیلد اجباری است و نمی‌تواند خالی باشد';
    case 'minLength':
      const currentLength = value?.toString().length || 0;
      return `حداقل ${rule.message.match(/\d+/)?.[0] || '1'} کاراکتر وارد کنید (فعلی: ${currentLength})`;
    case 'maxLength':
      return 'متن وارد شده بیش از حد مجاز است';
    case 'pattern':
      return 'فرمت وارد شده صحیح نیست. لطفاً مثال داده شده را دنبال کنید';
    default:
      return undefined;
  }
};

// Validation display component
interface ValidationDisplayProps {
  validationResult: ValidationResult;
  isValidating: boolean;
  compact?: boolean;
  showProgress?: boolean;
}

export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
  validationResult,
  isValidating,
  compact = false,
  showProgress = true
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['errors']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      default: return <ErrorIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'error';
    }
  };

  if (isValidating) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          در حال اعتبارسنجی...
        </Typography>
        {showProgress && (
          <LinearProgress 
            variant="determinate" 
            value={validationResult.progress}
            sx={{ borderRadius: 1 }}
          />
        )}
      </Box>
    );
  }

  const { errors, warnings, infos, isValid } = validationResult;
  const totalIssues = errors.length + warnings.length + infos.length;

  if (totalIssues === 0 && isValid) {
    return compact ? null : (
      <Alert severity="success" sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SuccessIcon />
          <Typography variant="body2">
            همه فیلدها معتبر هستند ✓
          </Typography>
        </Box>
      </Alert>
    );
  }

  const sections = [
    { key: 'errors', items: errors, label: 'خطاها', severity: 'error' as const },
    { key: 'warnings', items: warnings, label: 'هشدارها', severity: 'warning' as const },
    { key: 'infos', items: infos, label: 'اطلاعات', severity: 'info' as const }
  ].filter(section => section.items.length > 0);

  return (
    <Box sx={{ mt: 2 }}>
      {sections.map(section => (
        <Alert 
          key={section.key}
          severity={getSeverityColor(section.severity)}
          sx={{ 
            mb: 1,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer' 
              }}
              onClick={() => toggleSection(section.key)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTitle sx={{ mb: 0 }}>
                  {section.label} ({section.items.length})
                </AlertTitle>
                <Chip 
                  label={section.items.length}
                  size="small"
                  color={getSeverityColor(section.severity)}
                  variant="outlined"
                />
              </Box>
              {expandedSections.has(section.key) ? <CollapseIcon /> : <ExpandIcon />}
            </Box>
            
            <Collapse in={expandedSections.has(section.key)}>
              <Box sx={{ mt: 1 }}>
                {section.items.map((item, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      py: 1,
                      px: 2,
                      mb: 1,
                      backgroundColor: alpha(theme.palette[getSeverityColor(section.severity)].main, 0.05),
                      borderRadius: 1,
                      borderRight: `3px solid ${theme.palette[getSeverityColor(section.severity)].main}`
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.message}
                    </Typography>
                    {item.suggestion && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.text.secondary,
                          mt: 0.5,
                          display: 'block'
                        }}
                      >
                        💡 {item.suggestion}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        </Alert>
      ))}
    </Box>
  );
};

// Real-time field validation component
interface ValidatedFieldProps {
  children: React.ReactElement;
  rules: ValidationRule[];
  value: any;
  context?: any;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
  showInlineErrors?: boolean;
}

export const ValidatedField: React.FC<ValidatedFieldProps> = ({
  children,
  rules,
  value,
  context,
  onValidationChange,
  showInlineErrors = true
}) => {
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const theme = useTheme();

  const validate = useCallback(async () => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      try {
        const isValid = await rule.validator(value, context);
        if (!isValid) {
          errors.push({
            field: rule.id,
            rule: rule.type,
            message: rule.message,
            severity: rule.severity,
            suggestion: getSuggestionForRule(rule, value)
          });
        }
      } catch (error) {
        errors.push({
          field: rule.id,
          rule: rule.type,
          message: `خطا در اعتبارسنجی`,
          severity: 'error'
        });
      }
    }

    setFieldErrors(errors);
    setIsValidating(false);
    onValidationChange?.(errors.length === 0, errors);
  }, [rules, value, context, onValidationChange]);

  useEffect(() => {
    const timeoutId = setTimeout(validate, 300); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [validate]);

  const hasErrors = fieldErrors.some(e => e.severity === 'error');
  const hasWarnings = fieldErrors.some(e => e.severity === 'warning');

  return (
    <Box>
      {React.cloneElement(children, {
        error: hasErrors,
        helperText: showInlineErrors && fieldErrors.length > 0 
          ? fieldErrors[0].message 
          : children.props.helperText,
        sx: {
          ...children.props.sx,
          ...(hasErrors && {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.error.main,
                borderWidth: 2
              }
            }
          }),
          ...(hasWarnings && !hasErrors && {
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.warning.main,
                borderWidth: 1
              }
            }
          })
        }
      })}
      
      {isValidating && (
        <LinearProgress 
          size={2} 
          sx={{ 
            mt: 0.5,
            height: 2,
            borderRadius: 1 
          }} 
        />
      )}
    </Box>
  );
};