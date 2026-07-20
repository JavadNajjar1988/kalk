// Composite Input Component for Smart Field Builder System
// کامپوننت ورودی مرکب برای سیستم سازنده فیلد هوشمند

import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Alert,
  Divider,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

import type { CompositeFieldConfig } from '../enhancement/CompositeFieldManager';
// Smart Field Builder types disabled
type SmartFieldConfig = any;

interface CompositeInputComponentProps {
  config: SmartFieldConfig;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  error?: string;
  disabled?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
}

const CompositeInputComponent: React.FC<CompositeInputComponentProps> = ({
  config,
  value = {},
  onChange,
  error,
  disabled = false,
  variant = 'outlined',
  size = 'medium'
}) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Get composite configuration from field enhancements
  const compositeConfig = config.enhancements.find(e => e.type === 'composite')?.config as CompositeFieldConfig;
  
  if (!compositeConfig?.subFields) {
    return (
      <Alert severity="error">
        پیکربندی فیلد مرکب نامعتبر است
      </Alert>
    );
  }

  // Handle sub-field value change
  const handleSubFieldChange = useCallback((fieldId: string, fieldValue: any) => {
    const newValue = { ...value, [fieldId]: fieldValue };
    onChange(newValue);

    // Clear field error when user starts typing
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [value, onChange, fieldErrors]);

  // Validate sub-field
  const validateSubField = useCallback((subField: any, fieldValue: any): string | undefined => {
    if (subField.isRequired && (!fieldValue || fieldValue.toString().trim() === '')) {
      return `${subField.name} الزامی است`;
    }

    if (fieldValue && subField.validation) {
      const { rules, minLength, maxLength } = subField.validation;
      
      if (rules.includes('minLength') && minLength && fieldValue.length < minLength) {
        return `${subField.name} باید حداقل ${minLength} کاراکتر باشد`;
      }
      
      if (rules.includes('maxLength') && maxLength && fieldValue.length > maxLength) {
        return `${subField.name} نباید بیشتر از ${maxLength} کاراکتر باشد`;
      }
      
      if (rules.includes('englishOnly') && !/^[a-zA-Z\s.-]+$/.test(fieldValue)) {
        return `${subField.name} باید فقط شامل حروف انگلیسی باشد`;
      }
      
      if (rules.includes('persianOnly') && !/[\u0600-\u06FF]/.test(fieldValue)) {
        return `${subField.name} باید شامل حروف فارسی باشد`;
      }
    }

    return undefined;
  }, []);

  // Get field icon based on composite type
  const getFieldIcon = () => {
    switch (compositeConfig.compositeType) {
      case 'name-split':
      case 'full-name-dual':
        return <PersonIcon />;
      case 'address-parts':
        return <LanguageIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Render sub-field input
  const renderSubField = (subField: any) => {
    const fieldValue = value[subField.id] || '';
    const fieldError = validateSubField(subField, fieldValue);

    return (
      <TextField
        key={subField.id}
        fullWidth
        label={compositeConfig.ui?.showLabels ? subField.name : undefined}
        value={fieldValue}
        onChange={(e) => handleSubFieldChange(subField.id, e.target.value)}
        error={!!fieldError}
        helperText={fieldError}
        disabled={disabled}
        variant={variant}
        size={size}
        placeholder={subField.placeholder}
        required={subField.isRequired}
      />
    );
  };

  // Render fields based on layout
  const renderFields = () => {
    const sortedFields = [...compositeConfig.subFields].sort((a, b) => a.order - b.order);

    switch (compositeConfig.layout?.arrangement) {
      case 'horizontal':
        return (
          <Grid container spacing={2}>
            {sortedFields.map((subField) => (
              <Grid 
                item 
                xs={compositeConfig.layout?.equalWidth ? 12 / sortedFields.length : undefined}
                key={subField.id}
              >
                {renderSubField(subField)}
              </Grid>
            ))}
          </Grid>
        );
        
      case 'grid':
        return (
          <Grid container spacing={2}>
            {sortedFields.map((subField) => (
              <Grid item xs={12} sm={6} key={subField.id}>
                {renderSubField(subField)}
              </Grid>
            ))}
          </Grid>
        );
        
      default: // vertical
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedFields.map((subField) => renderSubField(subField))}
          </Box>
        );
    }
  };

  // Get spacing style
  const getSpacingStyle = () => {
    switch (compositeConfig.layout?.spacing) {
      case 'compact':
        return { p: 1 };
      case 'spacious':
        return { p: 3 };
      default:
        return { p: 2 };
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {getFieldIcon()}
        <Typography variant="subtitle1" sx={{ ml: 1 }}>
          {config.name}
          {config.isRequired && (
            <Typography component="span" color="error" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Group title */}
      {compositeConfig.ui?.groupTitle && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {compositeConfig.ui.groupTitle}
        </Typography>
      )}

      {/* Fields container */}
      {compositeConfig.ui?.groupBorder ? (
        <Paper
          variant="outlined"
          sx={{
            ...getSpacingStyle(),
            backgroundColor: alpha('rgb(158, 158, 158)', 0.02)
          }}
        >
          {renderFields()}
        </Paper>
      ) : (
        <Box sx={getSpacingStyle()}>
          {renderFields()}
        </Box>
      )}

      {/* Cross-field validation */}
      {compositeConfig.validation?.crossFieldValidation && 
       compositeConfig.compositeType === 'full-name-dual' && (
        <Box sx={{ mt: 2 }}>
          {value.persianName && value.englishName && (
            <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
              نام فارسی: {value.persianName} | نام انگلیسی: {value.englishName}
            </Alert>
          )}
        </Box>
      )}

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Description */}
      {config.description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {config.description}
        </Typography>
      )}
    </Box>
  );
};

export default CompositeInputComponent;