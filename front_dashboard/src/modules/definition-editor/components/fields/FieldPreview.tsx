import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  FormGroup,
  FormHelperText,
  Button,
  IconButton,
  Divider,
  alpha,
  Grid,
  Chip,
  InputAdornment,
  OutlinedInput,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import faIR from 'date-fns/locale/fa-IR';

// Icons
import PreviewIcon from '@mui/icons-material/Preview';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Types
import { CustomField } from '../../types/equipment';

// Field Enhancement System
import { FieldEnhancer } from './processors/FieldEnhancer';

// Reference Field Renderer
import ReferenceFieldRenderer from './ReferenceFieldRenderer';

// Enhanced field components
import {
  EnglishTextFieldComponent,
  NumericTextFieldComponent,
  ConditionalNationalIdComponent,
  NameSplitFieldComponent,
  FullNameDualFieldComponent
} from '../forms/EnhancedFieldComponents';
import PhoneArrayFieldComponent from '../forms/PhoneArrayField';
import HierarchicalAddressComponent from '../forms/HierarchicalAddressField';

// Removed legacy imports

// Enhanced field types
import { ENHANCED_FIELD_TYPES } from '../../types/enhancedFields';

interface FieldPreviewProps {
  fields: CustomField[];
  title?: string;
  description?: string;
  nodeName?: string;
  readOnly?: boolean;
  onSubmit?: (formData: Record<string, any>) => void;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({
  fields,
  title = 'پیش‌نمایش فرم',
  description = 'نمایش فرم ایجاد شده بر اساس فیلدهای تعریف شده',
  nodeName,
  readOnly = false,
  onSubmit
}) => {
  // حالت‌های کامپوننت
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      // Use type assertion to handle enhanced field types
      const fieldType = field.type as string;
      
      // Extract Smart Field metadata if available
      const getSmartFieldMetadata = () => {
        try {
          if (typeof field.defaultValue === 'string' && field.defaultValue) {
            const metadata = JSON.parse(field.defaultValue);
            // Check if this is the new Smart Field format with finalSettings
            if (metadata && metadata.finalSettings) {
              return metadata;
            }
            // Check if this is the old enhancement-only format
            if (metadata && typeof metadata === 'object' && !metadata.finalSettings) {
              return { enhancements: metadata, finalSettings: {} };
            }
          }
        } catch (e) {
          // If parsing fails, treat as regular field
        }
        return { enhancements: {}, finalSettings: {} };
      };
      
      const smartFieldMetadata = getSmartFieldMetadata();
      
      // Check if this is a composite field
      const isComposite = () => {
        return smartFieldMetadata.enhancements && smartFieldMetadata.enhancements.composite;
      };
      
      // Set appropriate initial value based on field type and enhancements
      if (isComposite()) {
        initialValues[field.id] = [];
      } else if (fieldType === 'phone' || fieldType === 'phone-array') {
        initialValues[field.id] = fieldType === 'phone' ? [''] : [];
      } else if (fieldType === 'social') {
        initialValues[field.id] = [{ platform: '', username: '' }];
      } else if (fieldType === 'address-array') {
        initialValues[field.id] = [];
      } else if (fieldType === 'name-split') {
        initialValues[field.id] = { firstName: '', lastName: '' };
      } else if (fieldType === 'full-name-dual') {
        initialValues[field.id] = { persian: '', english: '' };
      } else if (fieldType === 'hierarchical-address') {
        initialValues[field.id] = null;
      } else {
        // For Smart Fields, don't use defaultValue as initial value (it contains metadata)
        // For regular fields, use defaultValue only if it's not JSON metadata
        let initialValue = '';
        if (typeof field.defaultValue === 'string' && field.defaultValue) {
          try {
            JSON.parse(field.defaultValue);
            // If it's valid JSON, it's probably metadata, so use empty string
            initialValue = '';
          } catch (e) {
            // If it's not valid JSON, it's probably a real default value
            initialValue = field.defaultValue;
          }
        }
        initialValues[field.id] = initialValue;
      }
    });
    return initialValues;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // مدیریت تغییر مقدار فیلدها با تقویت پردازش
  const handleChange = async (fieldId: string, value: any) => {
    // Find the field definition
    const field = fields.find(f => f.id === fieldId);
    
    if (field && typeof value === 'string' && FieldEnhancer.fieldNeedsProcessing(field as any)) {
      try {
        // Apply sync processing for immediate feedback
        const processedValue = FieldEnhancer.processValueSync(value, field as any);
        
        setFormValues({
          ...formValues,
          [fieldId]: processedValue
        });
        
        // Clear error if exists
        if (formErrors[fieldId]) {
          setFormErrors({
            ...formErrors,
            [fieldId]: ''
          });
        }
        
        // Apply async processing in background for validation
        try {
          const fullResult = await FieldEnhancer.processValue(processedValue, field as any);
          
          // Update with any additional changes
          if (fullResult.hasChanges && fullResult.value !== processedValue) {
            setFormValues(prev => ({
              ...prev,
              [fieldId]: fullResult.value
            }));
          }
          
          // Handle validation errors
          if (!fullResult.isValid && fullResult.validationErrors) {
            setFormErrors(prev => ({
              ...prev,
              [fieldId]: fullResult.validationErrors![0]
            }));
          }
        } catch (asyncError) {
          console.warn('Async field processing failed:', asyncError);
        }
        
      } catch (error) {
        console.warn('Field processing failed, using original value:', error);
        // Fallback to original behavior
        setFormValues({
          ...formValues,
          [fieldId]: value
        });
      }
    } else {
      // Original behavior for non-text fields or fields without processing
      setFormValues({
        ...formValues,
        [fieldId]: value
      });
    }
    
    // پاک کردن خطا در صورت وجود
    if (formErrors[fieldId]) {
      setFormErrors({
        ...formErrors,
        [fieldId]: ''
      });
    }
  };
  
  // اعتبارسنجی فرم
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(field => {
      const value = formValues[field.id];
      
      // بررسی فیلدهای اجباری
      if (field.isRequired) {
        if (value === undefined || value === null || value === '') {
          errors[field.id] = 'این فیلد الزامی است';
          isValid = false;
        }
      }
      
      // بررسی قوانین اعتبارسنجی
      if (value && field.validationRules) {
        if (field.type === 'text' && field.validationRules.minLength && value.length < field.validationRules.minLength) {
          errors[field.id] = `حداقل ${field.validationRules.minLength} کاراکتر وارد کنید`;
          isValid = false;
        }
        
        if (field.type === 'text' && field.validationRules.maxLength && value.length > field.validationRules.maxLength) {
          errors[field.id] = `حداکثر ${field.validationRules.maxLength} کاراکتر مجاز است`;
          isValid = false;
        }
        
        if (field.type === 'number' && field.validationRules.minValue && value < field.validationRules.minValue) {
          errors[field.id] = `حداقل مقدار مجاز ${field.validationRules.minValue} است`;
          isValid = false;
        }
        
        if (field.type === 'number' && field.validationRules.maxValue && value > field.validationRules.maxValue) {
          errors[field.id] = `حداکثر مقدار مجاز ${field.validationRules.maxValue} است`;
          isValid = false;
        }
        
        if (field.validationRules.pattern && !new RegExp(field.validationRules.pattern).test(value)) {
          errors[field.id] = 'فرمت وارد شده صحیح نیست';
          isValid = false;
        }
      }
    });
    
    setFormErrors(errors);
    return isValid;
  };
  
  // ارسال فرم
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      onSubmit(formValues);
    }
  };
  
  // رندر فیلد بر اساس نوع
  const renderField = (field: CustomField) => {
    // Get the current form value, but don't use field.defaultValue as fallback since it may contain metadata
    const value = formValues[field.id] !== undefined ? formValues[field.id] : '';
    const error = !!formErrors[field.id];
    const helperText = formErrors[field.id] || '';
    
    // Extract Smart Field metadata if available
    const getSmartFieldMetadata = () => {
      try {
        if (typeof field.defaultValue === 'string' && field.defaultValue) {
          const metadata = JSON.parse(field.defaultValue);
          // Check if this is the new Smart Field format with finalSettings
          if (metadata && metadata.finalSettings) {
            return metadata;
          }
          // Check if this is the old enhancement-only format
          if (metadata && typeof metadata === 'object' && !metadata.finalSettings) {
            return { enhancements: metadata, finalSettings: {} };
          }
        }
      } catch (e) {
        // If parsing fails, return empty metadata
      }
      return { enhancements: {}, finalSettings: {} };
    };
    
    const smartFieldMetadata = getSmartFieldMetadata();
    const finalSettings = smartFieldMetadata.finalSettings || {};
    
    // Use Smart Field Final Settings for display properties
    const displayName = finalSettings.name || field.name;
    const placeholder = finalSettings.placeholder || undefined;
    const smartHelpText = finalSettings.helpText || undefined;
    const fieldHelperText = error ? helperText : (smartHelpText || '');
    
    // Check for composite field enhancement
    const isCompositeField = () => {
      return smartFieldMetadata.enhancements && smartFieldMetadata.enhancements.composite;
    };

    const isMultilineField = () => {
      return smartFieldMetadata.enhancements && smartFieldMetadata.enhancements.multiline;
    };

    switch (field.type) {
      case 'text':
        // Handle composite fields
        if (isCompositeField()) {
          const compositeConfig = smartFieldMetadata.enhancements.composite;
          const compositeValue = Array.isArray(value) ? value : [];
          
          return (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {displayName}
                {field.isRequired && <span style={{ color: 'red' }}> *</span>}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                {compositeConfig.parts.map((part: any, index: number) => {
                  const partValue = compositeValue[index] || '';
                  const partProps = {
                    key: part.id,
                    size: 'small' as const,
                    sx: { minWidth: 120, flex: 1 },
                    value: partValue,
                    onChange: (e: any) => {
                      const newValues = Array.isArray(value) ? [...value] : [];
                      newValues[index] = e.target.value;
                      handleChange(field.id, newValues);
                    }
                  };
                  
                  return (
                    <React.Fragment key={part.id}>
                      {part.type === 'select' && part.options && part.options.length > 0 ? (
                        <FormControl sx={{ minWidth: 120, flex: 1 }}>
                          <InputLabel size="small">{part.label}</InputLabel>
                          <Select
                            {...partProps}
                            label={part.label}
                            size="small"
                            disabled={readOnly}
                          >
                            {part.options.map((option: string) => (
                              <MenuItem key={option} value={option}>
                                {option && typeof option === 'string' ? option : String(option)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          {...partProps}
                          label={part.label}
                          placeholder={part.label}
                          required={part.required}
                          disabled={readOnly}
                        />
                      )}
                      
                      {/* Display separator between fields (but not after the last one) */}
                      {index < compositeConfig.parts.length - 1 && compositeConfig.separator && (
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ 
                            px: 0.5,
                            fontSize: '1rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 'auto'
                          }}
                        >
                          {compositeConfig.separator}
                        </Typography>
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
              {/* Optional: Show separator info only if no parts exist yet */}
              {compositeConfig.parts.length === 0 && compositeConfig.separator && (
                <Typography variant="caption" color="text.secondary">
                  جداکننده: "{compositeConfig.separator}"
                </Typography>
              )}
              {fieldHelperText && (
                <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
              )}
            </Box>
          );
        }
        
        // Handle multiline fields
        if (isMultilineField()) {
          return (
            <TextField
              label={displayName}
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              fullWidth
              multiline
              rows={4}
              required={field.isRequired}
              error={error}
              helperText={fieldHelperText || field.helpText}
              placeholder={placeholder || field.placeholder}
              disabled={readOnly}
              sx={{ 
                direction: field.direction === 'ltr' ? 'ltr' : field.direction === 'rtl' ? 'rtl' : 'rtl' // default RTL
              }}
              inputProps={{
                maxLength: field.maxLength,
                minLength: field.minLength
              }}
            />
          );
        }
        
        // Handle different variants
        const renderTextFieldByVariant = () => {
          const getFieldSize = (): 'small' | 'medium' | undefined => {
            if (field.size === 'sm') return 'small';
            if (field.size === 'lg') return 'medium';
            return 'medium';
          };

          const commonProps = {
            label: displayName,
            value: value || '',
            onChange: (e: any) => handleChange(field.id, e.target.value),
            fullWidth: field.size !== 'sm' && field.size !== 'md' && field.size !== 'lg',
            required: field.isRequired,
            error: error,
            helperText: fieldHelperText || field.helpText,
            placeholder: placeholder || field.placeholder,
            disabled: readOnly,
            size: getFieldSize(),
            sx: { 
              direction: field.direction === 'ltr' ? 'ltr' : field.direction === 'rtl' ? 'rtl' : 'rtl',
              ...(field.size === 'full' && { width: '100%' }),
              ...(field.size === 'sm' && { maxWidth: '200px' }),
              ...(field.size === 'md' && { maxWidth: '300px' }),
              ...(field.size === 'lg' && { maxWidth: '500px' })
            },
            inputProps: {
              maxLength: field.maxLength,
              minLength: field.minLength,
              spellCheck: field.spellcheck !== 'off',
              ...(field.allowedCharset === 'letters' && {
                pattern: '[A-Za-z\u0600-\u06FF\s]+'
              }),
              ...(field.allowedCharset === 'alphanumeric' && {
                pattern: '[A-Za-z0-9\u0600-\u06FF\s]+'
              }),
              ...(field.allowedCharset === 'custom' && field.customRegex && {
                pattern: field.customRegex
              })
            },
            InputProps: {
              ...(field.prefix && {
                startAdornment: <InputAdornment position="start">{field.prefix}</InputAdornment>
              }),
              ...(field.suffix && {
                endAdornment: <InputAdornment position="end">{field.suffix}</InputAdornment>
              }),
              ...(field.icon && {
                startAdornment: <InputAdornment position="start"><span>{field.icon}</span></InputAdornment>
              })
            }
          };

          // Check both displayType and variant for backward compatibility
          const fieldVariant = (field as any).displayType || field.variant;
          
          switch (fieldVariant) {
            case 'accordion':
              // Check if accordion display mode is set to 'options'
              if (field.accordionDisplayMode === 'options' && field.options && field.options.length > 0) {
                return (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{field.accordionTitle || displayName}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormControl fullWidth>
                        <InputLabel>انتخاب گزینه</InputLabel>
                        <Select
                          value={value || ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          label="انتخاب گزینه"
                          disabled={readOnly}
                        >
                          {field.options.map((option, index) => (
                            <MenuItem key={index} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </AccordionDetails>
                  </Accordion>
                );
              } else {
                // Default title mode - just display the title with no interactive content
                return (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>{field.accordionTitle || displayName}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField {...commonProps} />
                    </AccordionDetails>
                  </Accordion>
                );
              }
              
            case 'textarea':
              return <TextField 
                {...commonProps} 
                multiline 
                rows={field.textareaRows || 4}
                maxRows={field.textareaMaxRows || 10}
                sx={{
                  ...commonProps.sx,
                  '& .MuiInputBase-root': {
                    resize: field.textareaResize || 'vertical'
                  }
                }}
              />;
              
            case 'richtext':
              return (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>{displayName}</Typography>
                  <TextField 
                    {...commonProps} 
                    multiline 
                    rows={Math.ceil((field.richtextHeight || 300) / 24)} // Approximate rows based on height
                    sx={{
                      ...commonProps.sx,
                      '& .MuiInputBase-root': {
                        minHeight: field.richtextHeight || 300
                      }
                    }}
                  />
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Tools:</Typography>
                    {(field.richtextToolbar || []).map((tool, index) => (
                      <Chip key={index} label={tool} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Rich Text editing (preview mode)
                  </Typography>
                </Box>
              );
              
            case 'chips':
              const chipValues = field.multiValue ? 
                (typeof value === 'string' ? value.split(field.multiValueSeparator === 'comma' ? ',' : field.multiValueSeparator === 'space' ? ' ' : '\n') : []) 
                : [value || ''];
              const displayedChips = chipValues.slice(0, field.chipsMaxCount || 10);
              const hasMore = chipValues.length > (field.chipsMaxCount || 10);
              
              return (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>{displayName}</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {displayedChips.filter(v => v).map((chip, index) => (
                      <Chip 
                        key={index} 
                        label={chip} 
                        size="small" 
                        variant={field.chipsVariant || 'filled'}
                        color={field.chipsColor || 'default'}
                        onDelete={field.chipsDeletable !== false ? () => {} : undefined}
                      />
                    ))}
                    {hasMore && (
                      <Chip 
                        label={`+${chipValues.length - (field.chipsMaxCount || 10)} more`} 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                      />
                    )}
                  </Box>
                  <TextField {...commonProps} size="small" />
                </Box>
              );
              
            case 'pill':
              const getPillColor = () => {
                switch (field.pillColor) {
                  case 'primary': return { bgcolor: 'primary.main', color: 'primary.contrastText' };
                  case 'secondary': return { bgcolor: 'secondary.main', color: 'secondary.contrastText' };
                  case 'success': return { bgcolor: 'success.main', color: 'success.contrastText' };
                  case 'error': return { bgcolor: 'error.main', color: 'error.contrastText' };
                  case 'warning': return { bgcolor: 'warning.main', color: 'warning.contrastText' };
                  default: return { bgcolor: 'grey.300', color: 'text.primary' };
                }
              };
              
              const getPillSize = () => {
                switch (field.pillSize) {
                  case 'small': return { height: '24px', fontSize: '0.75rem' };
                  case 'large': return { height: '40px', fontSize: '1rem' };
                  default: return { height: '32px', fontSize: '0.875rem' };
                }
              };
              
              const getChipSize = (): 'small' | 'medium' => {
                return field.pillSize === 'small' ? 'small' : 'medium';
              };
              
              return (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>{displayName}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {value && (
                      <Chip 
                        label={value} 
                        size={getChipSize()}
                        sx={{ 
                          borderRadius: '16px',
                          ...getPillColor(),
                          ...getPillSize()
                        }} 
                      />
                    )}
                    <TextField {...commonProps} size="small" sx={{ flex: 1 }} />
                  </Box>
                  {field.pillColor && (
                    <Typography variant="caption" color="text.secondary">Color: {field.pillColor}</Typography>
                  )}
                </Box>
              );
              
            case 'masked':
              return (
                <Box>
                  <TextField {...commonProps} placeholder={field.maskPattern || placeholder} />
                  {field.maskPattern && (
                    <Typography variant="caption" color="text.secondary">
                      Pattern: {field.maskPattern}
                    </Typography>
                  )}
                </Box>
              );
              
            case 'popover':
              const getPopoverTrigger = () => {
                switch (field.popoverTrigger) {
                  case 'hover': return 'Hover to edit';
                  case 'focus': return 'Focus to edit';
                  default: return 'Click to edit';
                }
              };
              
              const getPopoverSize = () => {
                switch (field.popoverSize) {
                  case 'small': return { minWidth: '200px' };
                  case 'medium': return { minWidth: '300px' };
                  case 'large': return { minWidth: '500px' };
                  default: return { minWidth: '250px' };
                }
              };
              
              return (
                <Box>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    onClick={() => {}}
                    sx={getPopoverSize()}
                  >
                    {getPopoverTrigger()}: {displayName}
                  </Button>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Mode: {field.popoverMode || 'popover'} | Position: {field.popoverPosition || 'bottom'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Current value: {value || 'Empty'}
                  </Typography>
                </Box>
              );
              
            case 'inline':
              const getInlineLayout = () => {
                switch (field.inlineLabelPosition) {
                  case 'top': return { flexDirection: 'column', alignItems: 'flex-start' };
                  case 'right': return { flexDirection: 'row-reverse', alignItems: 'center' };
                  default: return { flexDirection: 'row', alignItems: 'center' };
                }
              };
              
              const getInlineSpacing = () => {
                switch (field.inlineSpacing) {
                  case 'tight': return 1;
                  case 'normal': return 2;
                  case 'loose': return 3;
                  default: return 2;
                }
              };
              
              const getLabelWidth = () => {
                if (field.inlineWidth === 'auto') return { minWidth: 'auto' };
                return { minWidth: field.inlineWidth || 100 };
              };
              
              return (
                <Box sx={{ 
                  display: 'flex', 
                  gap: getInlineSpacing(),
                  ...getInlineLayout()
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{
                      ...getLabelWidth(),
                      textAlign: field.inlineLabelPosition === 'right' ? 'right' : 'left'
                    }}
                  >
                    {displayName}:
                  </Typography>
                  <TextField 
                    {...commonProps} 
                    variant="standard" 
                    size="small" 
                    sx={{ flex: 1 }} 
                    label="" // Remove label since it's displayed separately
                  />
                </Box>
              );
              
            default: // 'plain'
              return <TextField {...commonProps} />;
          }
        };

        // Add suggestions/autocomplete support
        const renderWithSuggestions = (textField: React.ReactElement) => {
          if (!field.suggestions || field.suggestions.length === 0) {
            return textField;
          }

          if (field.selectionAid === 'single' || field.selectionAid === 'multi') {
            return (
              <Box>
                {textField}
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Suggestions ({field.selectionAid === 'multi' ? 'multiple selection' : 'single selection'}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {field.suggestions.map((suggestion, index) => (
                      <Chip 
                        key={index}
                        label={suggestion}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => {
                          if (field.selectionAid === 'multi' && field.multiValue) {
                            const currentValues = value ? value.split(field.multiValueSeparator === 'comma' ? ',' : ' ') : [];
                            if (!currentValues.includes(suggestion)) {
                              const newValue = [...currentValues, suggestion].join(field.multiValueSeparator === 'comma' ? ',' : ' ');
                              handleChange(field.id, newValue);
                            }
                          } else {
                            handleChange(field.id, suggestion);
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          }

          return textField;
        };

        // Add character counter
        const renderWithCounter = (element: React.ReactElement) => {
          if (field.counterDisplay === 'off' || !field.maxLength) {
            return element;
          }

          const currentLength = value ? value.length : 0;
          const counter = (
            <Typography 
              variant="caption" 
              color={currentLength > field.maxLength ? 'error' : 'text.secondary'}
              sx={{ 
                position: field.counterDisplay === 'inside' ? 'absolute' : 'relative',
                right: field.counterDisplay === 'inside' ? 8 : 'auto',
                bottom: field.counterDisplay === 'inside' ? 8 : 'auto',
                mt: field.counterDisplay === 'bottom' ? 0.5 : 0
              }}
            >
              {currentLength}/{field.maxLength}
            </Typography>
          );

          if (field.counterDisplay === 'inside') {
            return (
              <Box sx={{ position: 'relative' }}>
                {element}
                {counter}
              </Box>
            );
          }

          return (
            <Box>
              {element}
              {counter}
            </Box>
          );
        };

        // Add copy button
        const renderWithCopyButton = (element: React.ReactElement) => {
          if (!field.copyButton || !value) {
            return element;
          }

          return (
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <Box sx={{ flex: 1 }}>{element}</Box>
              <IconButton 
                size="small" 
                onClick={() => navigator.clipboard.writeText(value)}
                title="Copy to clipboard"
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>
          );
        };

        // Render the complete text field with all features
        const baseTextField = renderTextFieldByVariant();
        const withSuggestions = renderWithSuggestions(baseTextField);
        const withCounter = renderWithCounter(withSuggestions);
        const finalTextField = renderWithCopyButton(withCounter);

        return finalTextField;
        
      case 'number':
        return (
          <TextField
            label={displayName}
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText || field.helpText}
            placeholder={placeholder || field.placeholder}
            disabled={readOnly}
            InputProps={{
              endAdornment: field.unit && (
                <InputAdornment position="end">
                  {field.unit}
                </InputAdornment>
              )
            }}
            inputProps={{
              min: field.validationRules?.minValue,
              max: field.validationRules?.maxValue
            }}
          />
        );
        
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={faIR}>
            <DatePicker
              label={displayName}
              value={value || null}
              onChange={(newValue) => handleChange(field.id, newValue)}
              renderInput={(params) => <TextField {...params} fullWidth helperText={fieldHelperText} />}
            />
          </LocalizationProvider>
        );
        
      case 'select':
        // ویژگی خاص برای فیلد آواتار
        if (field.id === 'af-avatar' && field.options) {
          return (
            <FormControl 
              fullWidth 
              required={field.isRequired}
              error={error}
              disabled={readOnly}
            >
              <InputLabel id={`select-label-${field.id}`}>{displayName}</InputLabel>
              <Select
                labelId={`select-label-${field.id}`}
                value={value || ''}
                label={displayName}
                onChange={(e) => handleChange(field.id, e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {selected && (
                      <img 
                        src={`/src/assets/avatars/${selected}`} 
                        alt="Avatar" 
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <Typography>{selected || 'انتخاب آواتار'}</Typography>
                  </Box>
                )}
              >
                {field.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img 
                        src={`/src/assets/avatars/${option}`} 
                        alt={option} 
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <Typography>{option.replace('.png', '').replace('.svg', '')}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {error && <FormHelperText>{fieldHelperText}</FormHelperText>}
            </FormControl>
          );
        }
        
        // حالت عادی فیلد select
        return (
          <FormControl 
            fullWidth 
            required={field.isRequired}
            error={error}
            disabled={readOnly}
          >
            <InputLabel id={`select-label-${field.id}`}>{displayName}</InputLabel>
            <Select
              labelId={`select-label-${field.id}`}
              value={value !== undefined && value !== null ? value : ''}
              label={displayName}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem 
                  key={option} 
                  value={option}
                >
                  {option && typeof option === 'string' ? option : String(option)}
                </MenuItem>
              ))}
            </Select>
            {fieldHelperText && <FormHelperText error={error}>{fieldHelperText}</FormHelperText>}
          </FormControl>
        );
        
      case 'multiselect':
        return (
          <FormControl 
            fullWidth 
            required={field.isRequired}
            error={error}
            disabled={readOnly}
          >
            <InputLabel id={`multiselect-label-${field.id}`}>{displayName}</InputLabel>
            <Select
              labelId={`multiselect-label-${field.id}`}
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleChange(field.id, e.target.value)}
              input={<OutlinedInput label={displayName} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option && typeof option === 'string' ? option : String(option)}
                </MenuItem>
              ))}
            </Select>
            {fieldHelperText && <FormHelperText error={error}>{fieldHelperText}</FormHelperText>}
          </FormControl>
        );
        
      case 'boolean':
        return (
          <FormControl 
            fullWidth 
            required={field.isRequired}
            error={error}
            disabled={readOnly}
            component="fieldset"
            variant="outlined"
            sx={{ p: 2, borderRadius: 1 }}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!value}
                    onChange={(e) => handleChange(field.id, e.target.checked)}
                  />
                }
                label={displayName}
              />
            </FormGroup>
            {fieldHelperText && <FormHelperText error={error}>{fieldHelperText}</FormHelperText>}
          </FormControl>
        );
        
      case 'email':
        return (
          <TextField
            label={displayName}
            type="email"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText || field.helpText}
            placeholder={placeholder || field.placeholder}
            disabled={readOnly}
            sx={{ 
              direction: field.direction === 'ltr' ? 'ltr' : field.direction === 'rtl' ? 'rtl' : 'ltr' // default LTR for email
            }}
            inputProps={{
              maxLength: field.maxLength,
              minLength: field.minLength
            }}
          />
        );
        
      case 'password':
        return (
          <TextField
            label={displayName}
            type="password"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText || field.helpText}
            placeholder={placeholder || field.placeholder}
            disabled={readOnly}
            sx={{ 
              direction: field.direction === 'ltr' ? 'ltr' : field.direction === 'rtl' ? 'rtl' : 'ltr' // default LTR for password
            }}
            inputProps={{
              maxLength: field.maxLength,
              minLength: field.minLength
            }}
          />
        );
        
      case 'textarea':
        return (
          <TextField
            label={displayName}
            multiline
            rows={4}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            fullWidth
            required={field.isRequired}
            error={error}
            helperText={fieldHelperText || field.helpText}
            placeholder={placeholder || field.placeholder}
            disabled={readOnly}
            sx={{ 
              direction: field.direction === 'ltr' ? 'ltr' : field.direction === 'rtl' ? 'rtl' : 'rtl' // default RTL
            }}
            inputProps={{
              maxLength: field.maxLength,
              minLength: field.minLength
            }}
          />
        );
        
      case 'phone':
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {(value || []).map((phone: string, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label={`شماره ${index + 1}`}
                  value={phone}
                  onChange={(e) => {
                    const newPhones = [...(value || [])];
                    newPhones[index] = e.target.value;
                    handleChange(field.id, newPhones);
                  }}
                  fullWidth
                  disabled={readOnly}
                  placeholder="مثال: 09123456789"
                />
                {!readOnly && (value || []).length > 1 && (
                  <IconButton
                    onClick={() => {
                      const newPhones = [...(value || [])];
                      newPhones.splice(index, 1);
                      handleChange(field.id, newPhones);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newPhones = [...(value || []), ''];
                  handleChange(field.id, newPhones);
                }}
                variant="outlined"
                size="small"
              >
                افزودن شماره
              </Button>
            )}
            {error && (
              <FormHelperText error>{helperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'social':
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {(value || []).map((social: { platform: string; username: string }, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>پلتفرم</InputLabel>
                  <Select
                    value={social?.platform || ''}
                    onChange={(e) => {
                      const newSocials = [...(value || [])];
                      newSocials[index] = { ...newSocials[index], platform: e.target.value };
                      handleChange(field.id, newSocials);
                    }}
                    disabled={readOnly}
                    label="پلتفرم"
                  >
                    <MenuItem value="telegram">تلگرام</MenuItem>
                    <MenuItem value="whatsapp">واتساپ</MenuItem>
                    <MenuItem value="instagram">اینستاگرام</MenuItem>
                    <MenuItem value="twitter">توییتر</MenuItem>
                    <MenuItem value="linkedin">لینکدین</MenuItem>
                    <MenuItem value="eitaa">ایتا</MenuItem>
                    <MenuItem value="soroush">سروش</MenuItem>
                    <MenuItem value="bale">بله</MenuItem>
                    <MenuItem value="igap">آی گپ</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="نام کاربری"
                  value={social?.username || ''}
                  onChange={(e) => {
                    const newSocials = [...(value || [])];
                    newSocials[index] = { ...newSocials[index], username: e.target.value };
                    handleChange(field.id, newSocials);
                  }}
                  fullWidth
                  disabled={readOnly}
                  placeholder="مثال: @username"
                />
                {!readOnly && (value || []).length > 1 && (
                  <IconButton
                    onClick={() => {
                      const newSocials = [...(value || [])];
                      newSocials.splice(index, 1);
                      handleChange(field.id, newSocials);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newSocials = [...(value || []), { platform: '', username: '' }];
                  handleChange(field.id, newSocials);
                }}
                variant="outlined"
                size="small"
              >
                افزودن شبکه اجتماعی
              </Button>
            )}
            {error && (
              <FormHelperText error>{helperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'file':
        return (
          <Box sx={{ mb: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileUploadIcon />}
              sx={{ mb: 1 }}
              disabled={readOnly}
            >
              {`انتخاب ${displayName}`}
              <input
                type="file"
                hidden
                onChange={(e) => handleChange(field.id, e.target.files?.[0] || null)}
                disabled={readOnly}
              />
            </Button>
            {value && (
              <Typography variant="body2">
                فایل انتخاب شده: {typeof value === 'string' ? value : value.name}
              </Typography>
            )}
            {fieldHelperText && (
              <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
            )}
          </Box>
        );
        
      // Enhanced field types
      case ENHANCED_FIELD_TYPES.TEXT_ENGLISH:
      case 'text-english':
        return (
          <EnglishTextFieldComponent
            value={value || ''}
            onChange={(newValue) => handleChange(field.id, newValue)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            placeholder={placeholder || `${displayName} را به انگلیسی وارد کنید`}
          />
        );

      case ENHANCED_FIELD_TYPES.TEXT_NUMERIC:
      case 'text-numeric':
        return (
          <NumericTextFieldComponent
            value={value || ''}
            onChange={(newValue) => handleChange(field.id, newValue)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            placeholder={placeholder || `${displayName} را وارد کنید`}
            minLength={field.validationRules?.minLength}
            maxLength={field.validationRules?.maxLength}
          />
        );

      case ENHANCED_FIELD_TYPES.CONDITIONAL_NATIONAL_ID:
      case 'conditional-national-id':
        // Find nationality field value
        const nationalityField = fields.find(f => f.type === 'select' && (f.name.includes('تابعیت') || f.name.includes('ملیت') || f.englishName.toLowerCase().includes('nationality')));
        const nationalityValue = nationalityField ? formValues[nationalityField.id] : '';
        return (
          <ConditionalNationalIdComponent
            nationalityValue={nationalityValue}
            idValue={value || ''}
            onIdChange={(newValue) => handleChange(field.id, newValue)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
          />
        );

      case ENHANCED_FIELD_TYPES.PHONE_ARRAY:
      case 'phone-array':
        // Fallback to legacy component
        return (
          <PhoneArrayFieldComponent
            value={value || []}
            onChange={(phones: any) => handleChange(field.id, phones)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            minItems={field.minItems || 1}
            maxItems={field.maxItems || 5}
          />
        );

      case ENHANCED_FIELD_TYPES.ADDRESS_ARRAY:
      case 'address-array':
        // Fallback to legacy component
        return (
          <HierarchicalAddressComponent
            value={value || []}
            onChange={(addresses: any) => handleChange(field.id, addresses)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            minItems={field.minItems || 0}
            maxItems={field.maxItems || 3}
            rootCategory={field.hierarchicalCategory || 'geographical'}
            levels={['استان', 'شهر', 'منطقه']}
            allowFreeText={field.allowFreeText !== false}
          />
        );

      case ENHANCED_FIELD_TYPES.HIERARCHICAL_ADDRESS:
      case 'hierarchical-address':
        // Fallback to legacy component
        return (
          <HierarchicalAddressComponent
            value={value ? [value] : []}
            onChange={(addresses: any) => handleChange(field.id, addresses[0] || null)}
            label={displayName}
            required={field.isRequired}
            error={error ? fieldHelperText : undefined}
            minItems={field.isRequired ? 1 : 0}
            maxItems={1}
            rootCategory={field.hierarchicalCategory || 'geographical'}
            levels={['استان', 'شهر', 'منطقه']}
            allowFreeText={field.allowFreeText !== false}
          />
        );

      case ENHANCED_FIELD_TYPES.NAME_SPLIT:
      case 'name-split':
        // Fallback to legacy component
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {displayName} (تفکیک نام - در حال توسعه)
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Alert severity="info">
              این نوع فیلد در حال توسعه است و به زودی قابل استفاده خواهد بود.
            </Alert>
          </Box>
        );

      case ENHANCED_FIELD_TYPES.FULL_NAME_DUAL:
      case 'full-name-dual':
        // Fallback to legacy component
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {displayName} (نام دوزبانه - در حال توسعه)
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Alert severity="info">
              این نوع فیلد در حال توسعه است و به زودی قابل استفاده خواهد بود.
            </Alert>
          </Box>
        );

      case 'reference':
        return (
          <ReferenceFieldRenderer
            field={field}
            value={value}
            onChange={(newValue) => handleChange(field.id, newValue)}
            error={error ? helperText : undefined}
            disabled={readOnly}
            fullWidth
          />
        );
        
      case 'array-text':
        const arrayValue = Array.isArray(value) ? value : [];
        const minItems = field.arrayTextMinItems || 1;
        const maxItems = field.arrayTextMaxItems || 10;
        const itemLabel = field.arrayTextItemLabel || 'آیتم';
        const itemPlaceholder = field.arrayTextItemPlaceholder || `${itemLabel} را وارد کنید`;
        const itemType = field.arrayTextItemType || 'text';
        
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {arrayValue.map((item: string, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label={`${itemLabel} ${index + 1}`}
                  value={item || ''}
                  onChange={(e) => {
                    const newArray = [...arrayValue];
                    newArray[index] = e.target.value;
                    handleChange(field.id, newArray);
                  }}
                  fullWidth
                  multiline={itemType === 'textarea'}
                  rows={itemType === 'textarea' ? 3 : undefined}
                  disabled={readOnly}
                  placeholder={itemPlaceholder}
                  sx={{ 
                    direction: field.direction === 'ltr' ? 'ltr' : field.direction === 'rtl' ? 'rtl' : 'rtl'
                  }}
                />
                {!readOnly && arrayValue.length > minItems && (
                  <IconButton
                    onClick={() => {
                      const newArray = [...arrayValue];
                      newArray.splice(index, 1);
                      handleChange(field.id, newArray);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && arrayValue.length < maxItems && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newArray = [...arrayValue, ''];
                  handleChange(field.id, newArray);
                }}
                variant="outlined"
                size="small"
              >
                افزودن {itemLabel}
              </Button>
            )}
            {fieldHelperText && (
              <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'key-value':
        const kvValue = Array.isArray(value) ? value : [];
        const kvMinPairs = field.keyValueMinPairs || 1;
        const kvMaxPairs = field.keyValueMaxPairs || 20;
        const keyLabel = field.keyValueKeyLabel || 'ویژگی';
        const valueLabel = field.keyValueValueLabel || 'مقدار';
        const keyPlaceholder = field.keyValueKeyPlaceholder || `${keyLabel} را وارد کنید`;
        const valuePlaceholder = field.keyValueValuePlaceholder || `${valueLabel} را وارد کنید`;
        
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {kvValue.map((pair: {key: string, value: string}, index: number) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label={keyLabel}
                  value={pair?.key || ''}
                  onChange={(e) => {
                    const newArray = [...kvValue];
                    newArray[index] = { ...newArray[index], key: e.target.value };
                    handleChange(field.id, newArray);
                  }}
                  sx={{ flex: 1 }}
                  disabled={readOnly}
                  placeholder={keyPlaceholder}
                />
                <TextField
                  label={valueLabel}
                  value={pair?.value || ''}
                  onChange={(e) => {
                    const newArray = [...kvValue];
                    newArray[index] = { ...newArray[index], value: e.target.value };
                    handleChange(field.id, newArray);
                  }}
                  sx={{ flex: 1 }}
                  disabled={readOnly}
                  placeholder={valuePlaceholder}
                />
                {!readOnly && kvValue.length > kvMinPairs && (
                  <IconButton
                    onClick={() => {
                      const newArray = [...kvValue];
                      newArray.splice(index, 1);
                      handleChange(field.id, newArray);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            {field.keyValuePredefinedKeys && field.keyValuePredefinedKeys.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  ویژگی‌های پیشنهادی:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {field.keyValuePredefinedKeys.map((key, index) => (
                    <Chip 
                      key={index}
                      label={key}
                      size="small"
                      variant="outlined"
                      clickable
                      onClick={() => {
                        if (!readOnly && kvValue.length < kvMaxPairs) {
                          const newArray = [...kvValue, { key, value: '' }];
                          handleChange(field.id, newArray);
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {!readOnly && kvValue.length < kvMaxPairs && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  const newArray = [...kvValue, { key: '', value: '' }];
                  handleChange(field.id, newArray);
                }}
                variant="outlined"
                size="small"
              >
                افزودن ویژگی
              </Button>
            )}
            {fieldHelperText && (
              <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
            )}
          </Box>
        );
        
      case 'grouped':
        const groupedValue = value || {};
        const sections = field.groupedSections || [];
        
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {displayName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            {sections.map((section, sectionIndex) => (
              <Accordion 
                key={section.id}
                defaultExpanded={section.defaultExpanded !== false}
                disabled={readOnly}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">{section.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {section.fields.map((sectionField, fieldIndex) => {
                      const fieldValue = groupedValue[section.id]?.[sectionField.key] || '';
                      return (
                        <Grid item xs={12} sm={6} key={sectionField.key}>
                          {sectionField.type === 'select' ? (
                            <FormControl fullWidth>
                              <InputLabel>{sectionField.label}</InputLabel>
                              <Select
                                value={fieldValue}
                                onChange={(e) => {
                                  const newValue = {
                                    ...groupedValue,
                                    [section.id]: {
                                      ...groupedValue[section.id],
                                      [sectionField.key]: e.target.value
                                    }
                                  };
                                  handleChange(field.id, newValue);
                                }}
                                label={sectionField.label}
                                disabled={readOnly}
                              >
                                {(sectionField.options || []).map((option, optIndex) => (
                                  <MenuItem key={optIndex} value={option}>{option}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <TextField
                              label={sectionField.label}
                              value={fieldValue}
                              onChange={(e) => {
                                const newValue = {
                                  ...groupedValue,
                                  [section.id]: {
                                    ...groupedValue[section.id],
                                    [sectionField.key]: e.target.value
                                  }
                                };
                                handleChange(field.id, newValue);
                              }}
                              fullWidth
                              multiline={sectionField.type === 'textarea'}
                              rows={sectionField.type === 'textarea' ? 3 : undefined}
                              type={sectionField.type === 'number' ? 'number' : 'text'}
                              required={sectionField.required}
                              disabled={readOnly}
                              placeholder={sectionField.placeholder}
                            />
                          )}
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
            {fieldHelperText && (
              <FormHelperText error={error}>{fieldHelperText}</FormHelperText>
            )}
          </Box>
        );
        
      default:
        return <Typography>نوع فیلد پشتیبانی نمی‌شود</Typography>;
    }
  };
  
  return (
    <Paper 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        overflow: 'hidden'
      }}
    >
      {/* عنوان و توضیحات */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PreviewIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
              {nodeName && ` - ${nodeName}`}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* فرم پیش‌نمایش */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {fields.length === 0 ? (
            <Grid item xs={12}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.05)
                }}
              >
                <Typography color="text.secondary">
                  هیچ فیلدی برای نمایش وجود ندارد. ابتدا فیلدهای مورد نیاز را تعریف کنید.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            [...fields].sort((a, b) => a.order - b.order)
              .map((field) => (
                <Grid item xs={12} sm={6} key={field.id}>
                  {renderField(field)}
                </Grid>
              ))
          )}
          
          {fields.length > 0 && !readOnly && onSubmit && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  ثبت اطلاعات
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </form>
    </Paper>
  );
};

export default FieldPreview;
