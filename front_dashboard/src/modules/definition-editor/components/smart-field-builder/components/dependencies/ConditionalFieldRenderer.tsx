import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Switch,
  Chip,
  Alert,
  alpha,
  useTheme
} from '@mui/material';
import { SmartFieldConfig, BaseFieldType } from '../../types/smartFieldTypes';
import { FieldDependency, ConditionOperator } from './FieldDependencyBuilder';

interface ConditionalFieldRendererProps {
  fields: SmartFieldConfig[];
  dependencies: FieldDependency[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  onValidationChange?: (fieldId: string, isValid: boolean, message?: string) => void;
}

interface FieldState {
  visible: boolean;
  required: boolean;
  disabled: boolean;
  options?: { id: string; label: string }[];
  validationMessage?: string;
}

const ConditionalFieldRenderer: React.FC<ConditionalFieldRendererProps> = ({
  fields,
  dependencies,
  values,
  onChange,
  onValidationChange
}) => {
  const theme = useTheme();

  // Evaluate condition for a dependency
  const evaluateCondition = useCallback((dependency: FieldDependency): boolean => {
    const sourceValue = values[dependency.sourceFieldId];
    const { operator, value, values: conditionValues } = dependency.condition;

    switch (operator) {
      case ConditionOperator.EQUALS:
        return sourceValue === value;
      
      case ConditionOperator.NOT_EQUALS:
        return sourceValue !== value;
      
      case ConditionOperator.GREATER_THAN:
        return Number(sourceValue) > Number(value);
      
      case ConditionOperator.LESS_THAN:
        return Number(sourceValue) < Number(value);
      
      case ConditionOperator.GREATER_EQUAL:
        return Number(sourceValue) >= Number(value);
      
      case ConditionOperator.LESS_EQUAL:
        return Number(sourceValue) <= Number(value);
      
      case ConditionOperator.CONTAINS:
        return String(sourceValue).includes(String(value));
      
      case ConditionOperator.NOT_CONTAINS:
        return !String(sourceValue).includes(String(value));
      
      case ConditionOperator.STARTS_WITH:
        return String(sourceValue).startsWith(String(value));
      
      case ConditionOperator.ENDS_WITH:
        return String(sourceValue).endsWith(String(value));
      
      case ConditionOperator.IS_EMPTY:
        return !sourceValue || String(sourceValue).trim() === '';
      
      case ConditionOperator.IS_NOT_EMPTY:
        return sourceValue && String(sourceValue).trim() !== '';
      
      case ConditionOperator.IN:
        return conditionValues?.includes(sourceValue) || false;
      
      case ConditionOperator.NOT_IN:
        return !conditionValues?.includes(sourceValue) || false;
      
      default:
        return false;
    }
  }, [values]);

  // Calculate field states based on dependencies
  const fieldStates = useMemo((): Record<string, FieldState> => {
    const states: Record<string, FieldState> = {};

    // Initialize default states
    fields.forEach(field => {
      states[field.id] = {
        visible: true,
        required: field.isRequired,
        disabled: false
      };
    });

    // Apply dependencies
    dependencies
      .filter(dep => dep.enabled)
      .forEach(dependency => {
        const conditionMet = evaluateCondition(dependency);
        const targetState = states[dependency.targetFieldId];

        if (!targetState) return;

        switch (dependency.action.type) {
          case 'show':
            targetState.visible = conditionMet;
            break;
          
          case 'hide':
            targetState.visible = !conditionMet;
            break;
          
          case 'require':
            targetState.required = conditionMet;
            break;
          
          case 'optional':
            targetState.required = !conditionMet;
            break;
          
          case 'setValue':
            if (conditionMet && dependency.action.value !== undefined) {
              onChange(dependency.targetFieldId, dependency.action.value);
            }
            break;
          
          case 'setOptions':
            if (conditionMet && dependency.action.options) {
              targetState.options = dependency.action.options;
            }
            break;
        }
      });

    return states;
  }, [fields, dependencies, evaluateCondition, onChange]);

  // Validate field value
  const validateField = useCallback((field: SmartFieldConfig, value: any, state: FieldState): { isValid: boolean; message?: string } => {
    if (!state.visible) {
      return { isValid: true };
    }

    // Required validation
    if (state.required && (!value || String(value).trim() === '')) {
      return { isValid: false, message: `${field.name} الزامی است` };
    }

    // Field-specific validation
    if (field.validation && field.validation.length > 0) {
      for (const rule of field.validation) {
        if (!rule.enabled) continue;

        switch (rule.type) {
          case 'MIN_LENGTH':
            if (value && String(value).length < (rule.config.min || 0)) {
              return { isValid: false, message: rule.message };
            }
            break;
          
          case 'MAX_LENGTH':
            if (value && String(value).length > (rule.config.max || Infinity)) {
              return { isValid: false, message: rule.message };
            }
            break;
          
          case 'PATTERN':
            if (value && rule.config.pattern && !new RegExp(rule.config.pattern).test(String(value))) {
              return { isValid: false, message: rule.message };
            }
            break;
          
          case 'EMAIL':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
              return { isValid: false, message: rule.message };
            }
            break;
        }
      }
    }

    return { isValid: true };
  }, []);

  // Handle field value change
  const handleFieldChange = useCallback((field: SmartFieldConfig, newValue: any) => {
    onChange(field.id, newValue);

    // Validate the field
    const state = fieldStates[field.id];
    const validation = validateField(field, newValue, state);
    
    if (onValidationChange) {
      onValidationChange(field.id, validation.isValid, validation.message);
    }
  }, [fieldStates, onChange, onValidationChange, validateField]);

  // Render field based on type
  const renderField = useCallback((field: SmartFieldConfig) => {
    const state = fieldStates[field.id];
    const value = values[field.id] || '';
    const validation = validateField(field, value, state);

    if (!state.visible) {
      return null;
    }

    const fieldProps = {
      key: field.id,
      required: state.required,
      disabled: state.disabled,
      error: !validation.isValid,
      helperText: validation.message || field.helpText || '',
      fullWidth: true,
      sx: { mb: 2 }
    };

    switch (field.baseType) {
      case BaseFieldType.TEXT:
        return (
          <TextField
            {...fieldProps}
            label={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            multiline={field.enhancements?.some(e => e.type === 'MULTILINE')}
            rows={field.enhancements?.find(e => e.type === 'MULTILINE')?.config?.rows || 1}
          />
        );

      case BaseFieldType.NUMBER:
        return (
          <TextField
            {...fieldProps}
            label={field.name}
            placeholder={field.placeholder}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field, Number(e.target.value))}
          />
        );

      case BaseFieldType.CHOICE:
        const options = state.options || field.dataSource?.config?.items || [];
        return (
          <FormControl {...fieldProps}>
            <InputLabel>{field.name}</InputLabel>
            <Select
              value={value}
              label={field.name}
              onChange={(e) => handleFieldChange(field, e.target.value)}
            >
              {options.map(option => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case BaseFieldType.BOOLEAN:
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleFieldChange(field, e.target.checked)}
                disabled={state.disabled}
              />
            }
            label={field.name}
            sx={{ mb: 2 }}
          />
        );

      default:
        return (
          <TextField
            {...fieldProps}
            label={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
    }
  }, [fieldStates, values, validateField, handleFieldChange]);

  // Get dependency status for debugging
  const getDependencyStatus = useCallback(() => {
    const activeDependencies = dependencies.filter(dep => dep.enabled);
    const triggeredDependencies = activeDependencies.filter(dep => evaluateCondition(dep));
    
    return {
      total: activeDependencies.length,
      triggered: triggeredDependencies.length,
      details: triggeredDependencies.map(dep => ({
        id: dep.id,
        sourceField: fields.find(f => f.id === dep.sourceFieldId)?.name || 'نامشخص',
        targetField: fields.find(f => f.id === dep.targetFieldId)?.name || 'نامشخص',
        action: dep.action.type
      }))
    };
  }, [dependencies, evaluateCondition, fields]);

  const dependencyStatus = getDependencyStatus();

  return (
    <Box>
      {/* Dependency Status */}
      {dependencies.length > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, backgroundColor: alpha(theme.palette.info.main, 0.05) }}
        >
          <Typography variant="body2" gutterBottom>
            وضعیت وابستگی‌ها: {dependencyStatus.triggered} از {dependencyStatus.total} فعال
          </Typography>
          {dependencyStatus.details.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {dependencyStatus.details.map(detail => (
                <Chip
                  key={detail.id}
                  label={`${detail.sourceField} → ${detail.targetField} (${detail.action})`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* Fields */}
      <Box>
        {fields.map(field => renderField(field))}
      </Box>

      {/* Hidden Fields Info */}
      {(() => {
        const hiddenFields = fields.filter(field => !fieldStates[field.id]?.visible);
        if (hiddenFields.length === 0) return null;

        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              فیلدهای مخفی شده: {hiddenFields.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {hiddenFields.map(field => (
                <Chip
                  key={field.id}
                  label={field.name}
                  size="small"
                  color="default"
                  variant="outlined"
                />
              ))}
            </Box>
          </Alert>
        );
      })()}
    </Box>
  );
};

export default ConditionalFieldRenderer;