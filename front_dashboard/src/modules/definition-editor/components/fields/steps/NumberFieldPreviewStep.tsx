// Number Field Preview Step Component
// کامپوننت مرحله پیش‌نمایش فیلد عددی

import React, { memo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Chip,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { ExtendedCustomFieldDefinition } from '../types/FieldEditTypes';
import type { NumberFieldProperties } from '../types/FieldEditTypes';

interface NumberFieldPreviewStepProps {
  formData: ExtendedCustomFieldDefinition;
  originalType?: string;
}

const NumberFieldPreviewStep: React.FC<NumberFieldPreviewStepProps> = ({ 
  formData,
  originalType: _originalType 
}) => {
  const [fieldValue, setFieldValue] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [itemErrors, setItemErrors] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);

  const numberField: NumberFieldProperties = (formData?.numberField as NumberFieldProperties) || {} as NumberFieldProperties;
  const isMulti = !!numberField.enableMultipleValues;
  const muiSize = numberField.size === 'small' ? 'small' : 'medium';

  // Status color calculation
  const computeStatusColor = (valueNum: number): string | undefined => {
    if (!numberField.statusColor) return undefined;
    if (isNaN(valueNum)) return undefined;
    if (valueNum > 0 && numberField.statusColor.positive) return numberField.statusColor.positive;
    if (valueNum < 0 && numberField.statusColor.negative) return numberField.statusColor.negative;
    if (valueNum === 0 && numberField.statusColor.zero) return numberField.statusColor.zero;
    return undefined;
  };

  const getSeparatorChar = (): string => {
    const sep = numberField.multiValueSeparator || 'comma';
    switch (sep) {
      case 'space':
        return ' ';
      case 'semicolon':
        return ';';
      default:
        return ',';
    }
  };
  
  // Helper function to evaluate conditions
  const evaluateCondition = (value: any, condition: string, expectedValue: string): boolean => {
    const stringValue = String(value || '');
    const stringExpected = String(expectedValue || '');

    switch (condition) {
      case 'equals':
        return stringValue === stringExpected;
      case 'not_equals':
        return stringValue !== stringExpected;
      case 'greater_than':
        return parseFloat(stringValue) > parseFloat(stringExpected);
      case 'less_than':
        return parseFloat(stringValue) < parseFloat(stringExpected);
      case 'contains':
        return stringValue.includes(stringExpected);
      case 'not_contains':
        return !stringValue.includes(stringExpected);
      case 'empty':
        return !stringValue || stringValue.trim() === '';
      case 'not_empty':
        return !!(stringValue && stringValue.trim() !== '');
      default:
        return true;
    }
  };

  // Apply conditional rules
  useEffect(() => {
    if (formData?.conditionalRules) {
      const { visibility, enable } = formData.conditionalRules;

      // Check visibility rules
      if (visibility?.enabled && visibility.dependsOn) {
        // Simulate reference value for demo
        const referenceValue = 'demo';
        const condition = visibility.condition || 'equals';
        const expectedValue = visibility.value || '';
        setIsVisible(evaluateCondition(referenceValue, condition, expectedValue) as boolean);
      }

      // Check enable rules
      if (enable?.enabled && enable.dependsOn) {
        // Simulate reference value for demo
        const referenceValue = 'demo';
        const condition = enable.condition || 'equals';
        const expectedValue = enable.value || '';
        setIsEnabled(evaluateCondition(referenceValue, condition, expectedValue) as boolean);
      }
    }
  }, [formData?.conditionalRules]);

  // Apply default value
  useEffect(() => {
    const defaultValue = numberField.defaultValue;
    if (defaultValue !== undefined && !fieldValue) {
      setFieldValue(defaultValue.toString());
    }
  }, [numberField.defaultValue, fieldValue]);

  // Validate field value
  const validateField = (value: string): string[] => {
    const errors: string[] = [];
    const numValue = parseFloat(value);

    // Required validation
    if (formData?.isRequired && (!value || value.trim() === '')) {
      errors.push('این فیلد اجباری است');
    }

    // Min/Max validation
    if (numberField.minValue !== undefined && !isNaN(numValue) && numValue < numberField.minValue) {
      errors.push(`حداقل مقدار مجاز ${numberField.minValue} است`);
    }

    if (numberField.maxValue !== undefined && !isNaN(numValue) && numValue > numberField.maxValue) {
      errors.push(`حداکثر مقدار مجاز ${numberField.maxValue} است`);
    }

    // Number type validation
    if (numberField.numberType) {
      switch (numberField.numberType) {
        case 'integer':
          if (value && !Number.isInteger(parseFloat(value))) {
            errors.push('فقط اعداد صحیح مجاز است');
          }
          break;
        case 'decimal':
          // Decimal numbers allowed
          break;
      }
    }
    
    // Additional validation for positive/negative only (custom validation beyond default types)
    // Note: This validation can be added via custom pattern or additional validation rules
    if (!isNaN(numValue) && numValue <= 0 && formData?.validationRules?.pattern === 'positive') {
      errors.push('فقط اعداد مثبت مجاز است');
    }
    
    if (!isNaN(numValue) && numValue >= 0 && formData?.validationRules?.pattern === 'negative') {
      errors.push('فقط اعداد منفی مجاز است');
    }

    // Decimal precision validation
    if (numberField.decimalPrecision && value.includes('.')) {
      const decimalPart = value.split('.')[1];
      if (decimalPart && decimalPart.length > numberField.decimalPrecision) {
        errors.push(`حداکثر ${numberField.decimalPrecision} رقم اعشار مجاز است`);
      }
    }

    // Pattern validation
    if (formData?.validationRules?.pattern && value) {
      try {
        const regex = new RegExp(formData.validationRules.pattern);
        if (!regex.test(value)) {
          const errorMessage = formData.validationRules.patternMessage || 'فرمت وارد شده صحیح نیست';
          errors.push(errorMessage);
        }
      } catch (error) {
        console.warn('Invalid regex pattern:', formData.validationRules.pattern);
      }
    }

    return errors;
  };

  // Handle value change
  const handleValueChange = (newValue: string) => {
    setFieldValue(newValue);
    if (isMulti) {
      const sep = getSeparatorChar();
      const parts = (newValue || '').split(sep).map(p => p.trim()).filter(p => p.length > 0);
      const perItemErrors: string[] = [];
      parts.forEach((p) => {
        const errs = validateField(p);
        perItemErrors.push(errs[0] || '');
      });
      // For overall errors, if any item invalid, show generic error
      const firstError = perItemErrors.find(e => !!e) || '';
      setValidationErrors(firstError ? [firstError] : []);
      setItemErrors(perItemErrors);
    } else {
      const errors = validateField(newValue);
      setValidationErrors(errors);
      setItemErrors([]);
    }
  };

  // Format display value
  const formatDisplayValue = (value: string): string => {
    if (!value) return '';

    const format = numberField.displayFormat || {};
    
    // Apply thousand separator
    if (format.thousandSeparator) {
      const parts = value.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      value = parts.join('.');
    }

    // Add prefix/suffix from icon settings
    let prefix = numberField.icon?.prefix || '';
    let suffix = numberField.icon?.suffix || '';

    // Handle unit display - avoid duplication
    if (formData?.unit) {
      // Only add unit if autoFormat is not currency/percentage (to avoid duplication)
      const autoFormat = format?.autoFormat;
      if (autoFormat !== 'currency' && autoFormat !== 'percentage') {
        suffix = suffix ? `${suffix} ${formData.unit}` : formData.unit;
      }
    }

    return `${prefix}${value}${suffix}`;
  };

  // Apply control rules
  const isReadOnly = formData?.controlRules?.readOnly || false;
  const isLocked = formData?.controlRules?.lockAfterSave || false;
  const editableAfterSave = formData?.numberField?.editableAfterSave !== false;
  let isDisabled = !isEnabled || isReadOnly || isLocked || !editableAfterSave;
  // readOnlyStyle effects
  const readOnlyStyle = numberField.readOnlyStyle || 'normal';
  if (readOnlyStyle === 'disabled') {
    isDisabled = true;
  }


  return (
    <Box>
      {/* Header aligned with text preview style */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          پیش‌نمایش فیلد عددی
        </Typography>
        <Typography variant="body2" color="text.secondary">
          نتیجه نهایی تنظیمات فیلد عددی شما
        </Typography>
      </Box>

      {/* Controls - compact card */}
      <Paper sx={{ p: 2.5, mb: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
          کنترل‌های نمایش
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControlLabel control={<Switch checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} size="small" />} label="نمایش فیلد" />
          <FormControlLabel control={<Switch checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} size="small" />} label="فعال بودن فیلد" />
        </Box>
      </Paper>

      {/* Field Preview - neutral card */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
          پیش‌نمایش فیلد
        </Typography>

        {!isVisible ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>فیلد بر اساس شرایط نمایش داده نمی‌شود</Typography>
          </Box>
        ) : (
          <Box>
            {/* Display field information */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {formData.isRequired && <Chip label="اجباری" color="error" size="small" />}
              {formData.validationRules?.unique && <Chip label="یکتا" color="primary" size="small" />}
              {isReadOnly && <Chip label="فقط خواندنی" color="secondary" size="small" />}
              {numberField.displayType && (
                <Chip 
                  label={`نوع: ${numberField.displayType}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Box>

            {/* Render field based on display type */}
            {numberField.displayType === 'slider' ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {formData.name} {formData.isRequired && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                <Slider
                  value={parseFloat(fieldValue) || 0}
                  onChange={(_, newValue) => handleValueChange(newValue.toString())}
                  min={numberField.minValue || 0}
                  max={numberField.maxValue || 100}
                  step={numberField.step || 1}
                  disabled={isDisabled}
                  size={muiSize as any}
                  valueLabelDisplay="auto"
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} title={validationErrors[0] || ''}>
                  مقدار: <span style={{ color: computeStatusColor(parseFloat(fieldValue)) }}>{fieldValue}</span>
                </Typography>
                {/* Show helpText below slider when no validation errors */}
                {validationErrors.length === 0 && formData.helpText && formData.helpText.trim() && (
                  <Typography variant="caption" color="text.secondary">
                    {formData.helpText}
                  </Typography>
                )}
                {/* Show validation error below slider */}
                {validationErrors.length > 0 && (
                  <Typography variant="caption" color="error">
                    {validationErrors[0]}
                  </Typography>
                )}
              </Box>
            ) : numberField.displayType === 'progress' ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.name}
                </Typography>
                {numberField.size === 'full' ? (
                  <LinearProgress
                    variant="determinate"
                    value={(() => {
                      const min = numberField.minValue ?? 0;
                      const max = numberField.maxValue ?? 100;
                      const v = parseFloat(fieldValue) || 0;
                      const pct = ((v - min) * 100) / (max - min || 1);
                      return Math.min(100, Math.max(0, pct));
                    })()}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                ) : (
                  <CircularProgress
                    variant="determinate"
                    value={(() => {
                      const min = numberField.minValue ?? 0;
                      const max = numberField.maxValue ?? 100;
                      const v = parseFloat(fieldValue) || 0;
                      const pct = ((v - min) * 100) / (max - min || 1);
                      return Math.min(100, Math.max(0, pct));
                    })()}
                    size={numberField.size === 'small' ? 28 : numberField.size === 'large' ? 64 : 40}
                  />
                )}
              </Box>
            ) : numberField.displayType === 'spinner' ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() => {
                      const step = numberField.step ?? 1;
                      const next = (parseFloat(fieldValue) || 0) - step;
                      handleValueChange(String(next));
                    }}
                  >
                    −
                  </Button>
                  <TextField
                    sx={{ maxWidth: 160 }}
                    size={muiSize as any}
                    value={fieldValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    disabled={isDisabled}
                    type="number"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isDisabled}
                    onClick={() => {
                      const step = numberField.step ?? 1;
                      const next = (parseFloat(fieldValue) || 0) + step;
                      handleValueChange(String(next));
                    }}
                  >
                    +
                  </Button>
                </Box>
                {validationErrors.length > 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {validationErrors[0]}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                {/* Autocomplete (single value only) */}
                {numberField.enableAutoComplete && !isMulti ? (
                  <Autocomplete
                    freeSolo
                    disabled={isDisabled}
                    options={(function buildOptions() {
                      const opts: string[] = [];
                      const min = numberField.minValue ?? 0;
                      const max = numberField.maxValue ?? 100;
                      const step = numberField.step ?? 1;
                      for (let v = min; v <= max && opts.length < 10; v = v + step) {
                        opts.push(String(v));
                      }
                      return opts.length > 0 ? opts : ['0', '1', '10', '100'];
                    })()}
                    value={fieldValue}
                    onInputChange={(_, v) => handleValueChange(v)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size={muiSize as any}
                        label={`${formData.name}${formData.isRequired ? ' *' : ''}`}
                        placeholder={formData.placeholder || 'عدد وارد کنید'}
                        helperText={
                          validationErrors.length > 0 
                            ? validationErrors[0] 
                            : (formData.helpText && formData.helpText.trim()) || ''
                        }
                        error={validationErrors.length > 0}
                        type="number"
                        title={numberField.errorStyle === 'tooltip' && validationErrors[0] ? validationErrors[0] : ''}
                      />
                    )}
                  />
                ) : (
                  <TextField
                    fullWidth
                    size={muiSize as any}
                    label={`${formData.name}${formData.isRequired ? ' *' : ''}`}
                    placeholder={formData.placeholder || 'عدد وارد کنید'}
                    helperText={
                      validationErrors.length > 0 
                        ? validationErrors[0] 
                        : (formData.helpText && formData.helpText.trim()) || ''
                    }
                    error={validationErrors.length > 0}
                    value={isMulti ? fieldValue : formatDisplayValue(fieldValue)}
                    onChange={(e) => handleValueChange(e.target.value)}
                    disabled={isDisabled}
                    type={isMulti ? 'text' : 'number'}
                    inputProps={{
                      min: numberField.minValue,
                      max: numberField.maxValue,
                      step: numberField.step,
                    }}
                    InputProps={!isMulti ? {
                      startAdornment: numberField.icon?.prefix && (
                        <Typography sx={{ mr: 1 }}>{numberField.icon.prefix}</Typography>
                      ),
                      endAdornment: (
                        <Typography sx={{ ml: 1 }}>
                          {(() => {
                            const autoFormat = numberField.displayFormat?.autoFormat;
                            const suffix = numberField.icon?.suffix || '';
                            const unit = formData.unit || '';
                            if (autoFormat === 'currency' || autoFormat === 'percentage') {
                              return suffix;
                            }
                            return suffix && unit ? `${suffix} ${unit}` : (suffix || unit);
                          })()}
                        </Typography>
                      ),
                    } : undefined}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                        '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                        ...(readOnlyStyle === 'simple' ? { background: 'transparent', boxShadow: 'none' } : {}),
                      },
                      ...(numberField.statusColor ? { borderLeft: `3px solid ${computeStatusColor(parseFloat(fieldValue)) || 'transparent'}` } : {}),
                    }}
                  />
                )}

                {/* Spinner controls (single value only) */}
                {numberField.enableSpinner && !isMulti && (numberField.displayType as string) !== 'spinner' && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isDisabled}
                      onClick={() => {
                        const step = numberField.step ?? 1;
                        const next = (parseFloat(fieldValue) || 0) - step;
                        handleValueChange(String(next));
                      }}
                    >
                      −
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isDisabled}
                      onClick={() => {
                        const step = numberField.step ?? 1;
                        const next = (parseFloat(fieldValue) || 0) + step;
                        handleValueChange(String(next));
                      }}
                    >
                      +
                    </Button>
                  </Box>
                )}

                {/* Mini chart (compact slider) */}
                {numberField.enableMiniChart && !isMulti && (numberField.displayType as string) !== 'slider' && (
                  <Box sx={{ mt: 2 }}>
                    <Slider
                      size="small"
                      value={parseFloat(fieldValue) || 0}
                      onChange={(_, newValue) => handleValueChange(newValue.toString())}
                      min={numberField.minValue || 0}
                      max={numberField.maxValue || 100}
                      step={numberField.step || 1}
                      disabled={isDisabled}
                    />
                  </Box>
                )}

                {/* Multi-value item list with per-item validation */}
                {isMulti && fieldValue && (
                  <Box sx={{ mt: 1 }}>
                    {(() => {
                      const sep = getSeparatorChar();
                      const items = (fieldValue || '').split(sep).map(p => p.trim()).filter(p => p.length > 0);
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {items.map((it, idx) => (
                            <Typography key={idx} variant="caption" color={itemErrors[idx] ? 'error' : 'text.secondary'}>
                              {it}{itemErrors[idx] ? ` — ${itemErrors[idx]}` : ''}
                            </Typography>
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                )}
              </Box>
            )}

            {/* Show counter if enabled */}
            {numberField.showCounter && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {isMulti ? `${(fieldValue || '').split(getSeparatorChar()).filter(p => p.trim()).length} آیتم` : `${fieldValue || 0} / ${numberField.maxValue ?? '∞'}`}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Field Summary - compact */}
      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#4A90E2', fontWeight: 600 }}>
          خلاصه تنظیمات
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">نام فیلد:</Typography>
            <Typography>{formData.name}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">نوع عدد:</Typography>
            <Typography>{numberField.numberType || 'اعشاری'}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">محدوده:</Typography>
            <Typography>
              {numberField.minValue !== undefined ? numberField.minValue : '−∞'} تا {' '}
              {numberField.maxValue !== undefined ? numberField.maxValue : '∞'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">دقت اعشار:</Typography>
            <Typography>{numberField.decimalPrecision || 'بدون محدودیت'}</Typography>
          </Box>
          {formData.unit && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">واحد:</Typography>
              <Typography>{formData.unit}</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default memo(NumberFieldPreviewStep);
