import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  Typography,
  Chip,
  InputAdornment,
  OutlinedInput
} from '@mui/material';
import { ExtendedCustomFieldDefinition, FieldType } from '../types/FieldEditTypes';
import { FieldEnhancer } from '../processors/FieldEnhancer';

// Define the option type
type FieldOption = string | { value: string; label: string; description?: string };

interface LiveFieldPreviewProps {
  formData: ExtendedCustomFieldDefinition;
  originalType?: FieldType;
}

export const LiveFieldPreview: React.FC<LiveFieldPreviewProps> = ({ formData }) => {
  const [fieldValue, setFieldValue] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // Handle field value changes with real-time processing
  const handleValueChange = async (value: string) => {
    setFieldValue(value);
    setFieldErrors([]);
    
    try {
      // Apply sync processing for immediate feedback
      const processedValue = FieldEnhancer.processValueSync(value, formData);
      
      // If processing made changes, update the field value
      if (processedValue !== value) {
        setFieldValue(processedValue);
      }
      
      // Apply async processing for validation
      const result = await FieldEnhancer.processValue(processedValue, formData);
      
      // Handle validation errors
      if (!result.isValid && result.validationErrors) {
        setFieldErrors(result.validationErrors);
      }
    } catch (error) {
      console.warn('Field processing failed:', error);
      setFieldErrors(['خطا در پردازش فیلد']);
    }
  };

  // Handle different field types
  const renderField = () => {
    switch (formData.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <TextField
            fullWidth
            label={formData.name + (formData.isRequired ? ' *' : '')}
            placeholder={formData.placeholder || ''}
            helperText={formData.helpText || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            type={formData.type === 'password' ? 'password' : 'text'}
            dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
            error={fieldErrors.length > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
              }
            }}
            InputProps={{
              startAdornment: formData.prefix ? (
                <Typography sx={{ mr: 1, color: '#64748B' }}>{formData.prefix}</Typography>
              ) : undefined,
              endAdornment: formData.suffix ? (
                <Typography sx={{ ml: 1, color: '#64748B' }}>{formData.suffix}</Typography>
              ) : undefined,
            }}
          />
        );
      
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={formData.name + (formData.isRequired ? ' *' : '')}
            placeholder={formData.placeholder || ''}
            helperText={formData.helpText || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            multiline
            rows={formData.textareaRows || 4}
            dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
            error={fieldErrors.length > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
              }
            }}
          />
        );
      
      case 'number':
        return (
          <TextField
            fullWidth
            label={formData.name + (formData.isRequired ? ' *' : '')}
            placeholder={formData.placeholder || ''}
            helperText={formData.helpText || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            type="number"
            error={fieldErrors.length > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
              }
            }}
          />
        );
      
      case 'select':
        return (
          <FormControl fullWidth error={fieldErrors.length > 0}>
            <InputLabel>{formData.name + (formData.isRequired ? ' *' : '')}</InputLabel>
            <Select
              value={fieldValue}
              onChange={(e) => handleValueChange(e.target.value as string)}
              label={formData.name + (formData.isRequired ? ' *' : '')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                }
              }}
            >
              {formData.options?.map((option: FieldOption, index) => (
                <MenuItem 
                  key={typeof option === 'string' ? option : option.value || index} 
                  value={typeof option === 'string' ? option : option.value}
                >
                  {typeof option === 'string' ? option : option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'multiselect':
        return (
          <FormControl fullWidth error={fieldErrors.length > 0}>
            <InputLabel>{formData.name + (formData.isRequired ? ' *' : '')}</InputLabel>
            <Select
              multiple
              value={fieldValue ? fieldValue.split(',') : []}
              onChange={(e) => handleValueChange((e.target.value as string[]).join(','))}
              label={formData.name + (formData.isRequired ? ' *' : '')}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                  '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
                }
              }}
            >
              {formData.options?.map((option: FieldOption, index) => (
                <MenuItem 
                  key={typeof option === 'string' ? option : option.value || index} 
                  value={typeof option === 'string' ? option : option.value}
                >
                  <Checkbox checked={fieldValue?.split(',').includes(typeof option === 'string' ? option : option.value)} />
                  <Typography>{typeof option === 'string' ? option : option.label}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={fieldValue === 'true'}
                onChange={(e) => handleValueChange(e.target.checked ? 'true' : 'false')}
              />
            }
            label={formData.name + (formData.isRequired ? ' *' : '')}
          />
        );
      
      default:
        return (
          <TextField
            fullWidth
            label={formData.name + (formData.isRequired ? ' *' : '')}
            placeholder={formData.placeholder || ''}
            helperText={formData.helpText || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            dir={formData.direction === 'ltr' ? 'ltr' : 'rtl'}
            error={fieldErrors.length > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': { boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(74, 144, 226, 0.1)' },
              }
            }}
          />
        );
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '2px dashed rgba(74, 144, 226, 0.3)',
        boxShadow: '0 4px 16px rgba(74, 144, 226, 0.1)',
      }}
      role="region"
      aria-label="پیش‌نمایش زنده فیلد"
    >
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3, 
          color: '#4A90E2', 
          fontWeight: 600, 
          textAlign: 'center'
        }}
      >
        🎯 پیش‌نمایش زنده فیلد (با پردازش فعال)
      </Typography>
      
      {renderField()}
      
      {/* Show validation errors */}
      {fieldErrors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {fieldErrors.map((error, index) => (
            <Typography 
              key={index} 
              variant="body2" 
              color="error" 
              sx={{ mb: 1 }}
            >
              ⚠️ {error}
            </Typography>
          ))}
        </Box>
      )}
      
      {/* Show active processing features */}
      {(formData.caseTransform || formData.trimExtraSpaces || formData.characterControl) && (
        <Box sx={{ 
          mt: 2, 
          p: 1.5, 
          backgroundColor: 'rgba(74, 144, 226, 0.1)', 
          borderRadius: 1 
        }}>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ 
              fontWeight: 600, 
              display: 'block'
            }}
          >
            ⚡ پردازش فعال:
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mt: 0.5 
          }}>
            {formData.caseTransform && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                  borderRadius: 0.5
                }}
              >
                تبدیل حروف: {formData.caseTransform}
              </Typography>
            )}
            {formData.trimExtraSpaces && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                  borderRadius: 0.5
                }}
              >
                حذف فاصله اضافی
              </Typography>
            )}
            {formData.characterControl && (
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  backgroundColor: 'rgba(74, 144, 226, 0.2)', 
                  borderRadius: 0.5
                }}
              >
                کنترل کاراکتر: {formData.characterControl}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};