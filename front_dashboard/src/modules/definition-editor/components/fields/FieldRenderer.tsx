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
  OutlinedInput,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CustomField } from '../../types/equipment';

interface FieldRendererProps {
  field: CustomField;
  value?: any;
  onChange?: (value: any) => void;
  error?: boolean;
  helperText?: string;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ 
  field, 
  value, 
  onChange, 
  error = false, 
  helperText 
}) => {
  const [fieldValue, setFieldValue] = useState(value || '');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);

  // Helper function to evaluate conditions
  const evaluateCondition = (value: any, condition: string, expectedValue: string): boolean => {
    const stringValue = String(value || '');
    const stringExpected = String(expectedValue || '');

    switch (condition) {
      case 'equals':
        return stringValue === stringExpected;
      case 'not_equals':
        return stringValue !== stringExpected;
      case 'contains':
        return stringValue.includes(stringExpected);
      case 'not_contains':
        return !stringValue.includes(stringExpected);
      case 'empty':
        return !stringValue || stringValue.trim() === '';
      case 'not_empty':
        return stringValue && stringValue.trim() !== '';
      case 'greater_than':
        return parseFloat(stringValue) > parseFloat(stringExpected);
      case 'less_than':
        return parseFloat(stringValue) < parseFloat(stringExpected);
      default:
        return true;
    }
  };

  // Apply conditional rules
  const applyConditionalRules = () => {
    // Check visibility rules
    if (field.conditionalRules?.visibility?.enabled) {
      const rule = field.conditionalRules.visibility;
      if (rule.dependsOn) {
        // For demo purposes, simulate conditional display
        // In real implementation, this would check against actual form data
        const referenceValue = 'demo'; // This would come from form data
        const condition = rule.condition || 'equals';
        const expectedValue = rule.value || '';
        
        setIsVisible(evaluateCondition(referenceValue, condition, expectedValue));
      }
    }

    // Check enable rules
    if (field.conditionalRules?.enable?.enabled) {
      const rule = field.conditionalRules.enable;
      if (rule.dependsOn) {
        // For demo purposes, simulate conditional enable
        // In real implementation, this would check against actual form data
        const referenceValue = 'demo'; // This would come from form data
        const condition = rule.condition || 'equals';
        const expectedValue = rule.value || '';
        
        setIsEnabled(evaluateCondition(referenceValue, condition, expectedValue));
      }
    }
  };

  // Apply conditional rules on mount and when field changes
  React.useEffect(() => {
    applyConditionalRules();
  }, [field.conditionalRules]);

  // Apply control rules
  React.useEffect(() => {
    // Apply default value
    if (field.controlRules?.defaultValue && !fieldValue) {
      setFieldValue(field.controlRules.defaultValue);
    }
  }, [field.controlRules?.defaultValue, fieldValue]);

  const handleValueChange = (newValue: any) => {
    let processedValue = newValue;
    
    // Apply character control if defined
    if (field.characterControl && field.characterControl !== 'all') {
      switch (field.characterControl) {
        case 'letters':
          processedValue = newValue.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
          break;
        case 'alphanumeric':
          processedValue = newValue.replace(/[^a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\s]/g, '');
          break;
        case 'custom':
          if (field.customRegex) {
            try {
              // For custom regex, keep only characters that match the pattern
              const regex = new RegExp(field.customRegex, 'g');
              const matches = newValue.match(regex);
              processedValue = matches ? matches.join('') : '';
            } catch (error) {
              console.warn('Invalid custom regex:', field.customRegex);
            }
          }
          break;
      }
    }
    
    // Apply validation rules
    const validationErrors: string[] = [];
    
    // Required validation
    if (field.isRequired && (!processedValue || processedValue.trim() === '')) {
      validationErrors.push('این فیلد اجباری است');
    }
    
    // Length validation
    if (field.validationRules) {
      const rules = field.validationRules;
      
      if (rules.minLength !== undefined && processedValue.length < rules.minLength) {
        validationErrors.push(`حداقل ${rules.minLength} کاراکتر وارد کنید`);
      }
      
      if (rules.maxLength !== undefined && processedValue.length > rules.maxLength) {
        validationErrors.push(`حداکثر ${rules.maxLength} کاراکتر مجاز است`);
      }
      
      // Pattern validation
      if (rules.pattern) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(processedValue)) {
            const errorMessage = rules.patternMessage || 'فرمت وارد شده صحیح نیست';
            validationErrors.push(errorMessage);
          }
        } catch (error) {
          console.warn('Invalid regex pattern:', rules.pattern);
        }
      }
    }
    
    setValidationErrors(validationErrors);
    setFieldValue(processedValue);
    if (onChange) {
      onChange(processedValue);
    }
  };

  const renderField = () => {
    // Don't render if not visible
    if (!isVisible) {
      return null;
    }

    // Apply control rules with priority
    const isReadOnly = field.controlRules?.readOnly || false;
    const isLocked = field.controlRules?.lockAfterSave || false;
    const isEditableAfterSave = field.editableAfterSave !== false; // Default to true
    const isDisabled = !isEnabled || isReadOnly || isLocked || !isEditableAfterSave;

    const commonProps = {
      fullWidth: true,
      disabled: isDisabled, // Apply conditional enable and control rules
      error: error || validationErrors.length > 0,
      helperText: validationErrors.length > 0 ? validationErrors[0] : (helperText || ((field.helpText && field.helpText.trim()) || '')),
      dir: field.direction === 'ltr' ? 'ltr' : 'rtl',
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
        // Handle accordion display
        if (field.variant === 'accordion') {
          return (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{field.accordionTitle || field.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {field.accordionDisplayMode === 'options' && field.options && field.options.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    {field.selectionAid === 'single' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب گزینه</InputLabel>
                        <Select
                          value={fieldValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          label="انتخاب گزینه"
                        >
                          {field.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : field.selectionAid === 'multi' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب چندگانه</InputLabel>
                        <Select
                          multiple
                          value={fieldValue ? fieldValue.split(',') : []}
                          onChange={(e) => handleValueChange(Array.isArray(e.target.value) ? e.target.value.join(',') : '')}
                          label="انتخاب چندگانه"
                        >
                          {field.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        {...commonProps}
                        label={field.name + (field.isRequired ? ' *' : '')}
                        placeholder={field.placeholder || ''}
                        value={fieldValue}
                        onChange={(e) => handleValueChange(e.target.value)}
                        type={field.type === 'password' ? 'password' : 'text'}
                        InputProps={{
                          startAdornment: field.prefix ? (
                            <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                          ) : undefined,
                          endAdornment: field.suffix ? (
                            <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                          ) : undefined,
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  <TextField
                    {...commonProps}
                    label={field.name + (field.isRequired ? ' *' : '')}
                    placeholder={field.placeholder || ''}
                    value={fieldValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    type={field.type === 'password' ? 'password' : 'text'}
                    InputProps={{
                      startAdornment: field.prefix ? (
                        <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                      ) : undefined,
                      endAdornment: field.suffix ? (
                        <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                      ) : undefined,
                    }}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          );
        }

        // Handle richtext display
        if (field.variant === 'richtext') {
          return (
            <Box>
              <TextField
                {...commonProps}
                label={field.name + (field.isRequired ? ' *' : '')}
                placeholder={field.placeholder || ''}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                multiline
                rows={Math.max(3, Math.floor((field.richtextHeight || 200) / 24))}
                InputProps={{
                  startAdornment: field.prefix ? (
                    <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                  ) : undefined,
                  endAdornment: field.suffix ? (
                    <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                  ) : undefined,
                }}
              />
              {/* Richtext Toolbar Simulation */}
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(field.richtextToolbar || ['bold', 'italic', 'underline']).map((tool, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: 'rgba(74, 144, 226, 0.1)',
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      color: '#4A90E2',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.2)' }
                    }}
                  >
                    {tool}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        }

        // Handle chips display
        if (field.variant === 'chips') {
          const chipValues = fieldValue ? fieldValue.split(',').filter(v => v.trim()) : [];
          return (
            <Box>
              <TextField
                {...commonProps}
                label={field.name + (field.isRequired ? ' *' : '')}
                placeholder={field.placeholder || ''}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newValue = fieldValue + (fieldValue ? ',' : '') + 'گزینه جدید';
                    handleValueChange(newValue);
                  }
                }}
              />
              {chipValues.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {chipValues.map((value, index) => (
                    <Chip
                      key={index}
                      label={value.trim()}
                      color={field.chipsColor === 'primary' ? 'primary' : field.chipsColor === 'secondary' ? 'secondary' : 'default'}
                      variant={field.chipsVariant || 'filled'}
                      onDelete={field.chipsDeletable ? () => {
                        const newValues = chipValues.filter((_, i) => i !== index);
                        handleValueChange(newValues.join(','));
                      } : undefined}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        }

        // Handle pill display
        if (field.variant === 'pill') {
          const pillValues = fieldValue ? fieldValue.split(',').filter(v => v.trim()) : [];
          return (
            <Box>
              <TextField
                {...commonProps}
                label={field.name + (field.isRequired ? ' *' : '')}
                placeholder={field.placeholder || ''}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newValue = fieldValue + (fieldValue ? ',' : '') + 'گزینه جدید';
                    handleValueChange(newValue);
                  }
                }}
              />
              {pillValues.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {pillValues.map((value, index) => (
                    <Box
                      key={index}
                      sx={{
                        px: 2,
                        py: 0.5,
                        bgcolor: field.pillColor === 'primary' ? '#4A90E2' : 
                                field.pillColor === 'secondary' ? '#757575' :
                                field.pillColor === 'success' ? '#4CAF50' :
                                field.pillColor === 'warning' ? '#FF9800' :
                                field.pillColor === 'error' ? '#F44336' : '#E0E0E0',
                        color: field.pillColor === 'default' ? '#000' : '#fff',
                        borderRadius: field.pillSize === 'small' ? 1 : 2,
                        fontSize: field.pillSize === 'small' ? '0.75rem' : '0.875rem',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                      {value.trim()}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        }

        // Handle popover display
        if (field.variant === 'popover') {
          return (
            <Box>
              <TextField
                {...commonProps}
                label={field.name + (field.isRequired ? ' *' : '')}
                placeholder={field.placeholder || ''}
                value={fieldValue}
                onChange={(e) => handleValueChange(e.target.value)}
                InputProps={{
                  startAdornment: field.prefix ? (
                    <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                  ) : undefined,
                  endAdornment: field.suffix ? (
                    <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                  ) : undefined,
                }}
              />
              {/* Popover Simulation */}
              <Box sx={{ 
                mt: 1, 
                p: 2, 
                bgcolor: 'rgba(74, 144, 226, 0.05)', 
                borderRadius: 1, 
                border: '1px dashed rgba(74, 144, 226, 0.3)',
                fontSize: '0.75rem',
                color: '#4A90E2'
              }}>
                پاپ‌اور ({field.popoverSize || 'medium'}) - {field.popoverTrigger || 'click'} - {field.popoverPosition || 'top'}
              </Box>
            </Box>
          );
        }

        // Handle inline display
        if (field.variant === 'inline') {
          return (
            <Box sx={{ 
              display: 'flex', 
              alignItems: field.inlineLabelPosition === 'top' ? 'flex-start' : 'center',
              flexDirection: field.inlineLabelPosition === 'top' ? 'column' : 'row',
              gap: field.inlineSpacing === 'compact' ? 1 : field.inlineSpacing === 'comfortable' ? 3 : 2
            }}>
              <Box sx={{ 
                width: field.inlineLabelPosition === 'top' ? '100%' : `${field.inlineLabelWidth || 30}%`,
                minWidth: field.inlineLabelPosition === 'top' ? 'auto' : 120
              }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748B' }}>
                  {field.name + (field.isRequired ? ' *' : '')}
                </Typography>
              </Box>
              <Box sx={{ 
                width: field.inlineLabelPosition === 'top' ? '100%' : `${100 - (field.inlineLabelWidth || 30)}%`,
                flex: 1
              }}>
                <TextField
                  {...commonProps}
                  placeholder={field.placeholder || ''}
                  value={fieldValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  type={field.type === 'password' ? 'password' : 'text'}
                  InputProps={{
                    startAdornment: field.prefix ? (
                      <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                    ) : undefined,
                    endAdornment: field.suffix ? (
                      <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                    ) : undefined,
                  }}
                />
              </Box>
            </Box>
          );
        }

        // Handle masked display
        if (field.variant === 'masked') {
          const applyMask = (value: string, pattern: string) => {
            if (!pattern) return value;
            
            // Common masking patterns
            switch (pattern) {
              case 'phone':
                return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
              case 'card':
                return value.replace(/(\d{4})/g, '$1-').slice(0, -1);
              case 'national-id':
                return value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
              case 'iban':
                return value.replace(/(IR)(\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4 $5 $6 $7 $8');
              default:
                // Custom pattern: 9 = digit, * = masked, others = separators
                let result = '';
                let valueIndex = 0;
                
                for (let i = 0; i < pattern.length && valueIndex < value.length; i++) {
                  const patternChar = pattern[i];
                  const valueChar = value[valueIndex];
                  
                  if (patternChar === '9') {
                    if (/\d/.test(valueChar)) {
                      result += valueChar;
                      valueIndex++;
                    } else {
                      break;
                    }
                  } else if (patternChar === 'A') {
                    if (/[a-zA-Z\u0600-\u06FF]/.test(valueChar)) {
                      result += valueChar;
                      valueIndex++;
                    } else {
                      break;
                    }
                  } else if (patternChar === '*') {
                    result += '*';
                    valueIndex++;
                  } else {
                    result += patternChar;
                  }
                }
                return result;
            }
          };

          const maskedValue = applyMask(fieldValue, field.maskPattern || '');

          return (
            <Box>
              <TextField
                {...commonProps}
                label={field.name + (field.isRequired ? ' *' : '')}
                placeholder={field.placeholder || ''}
                value={maskedValue}
                onChange={(e) => {
                  // Remove mask characters for processing
                  let cleanValue = e.target.value;
                  
                  // Apply character control if defined and not masked
                  if (field.characterControl && field.characterControl !== 'all') {
                    switch (field.characterControl) {
                      case 'letters':
                        cleanValue = cleanValue.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
                        break;
                      case 'alphanumeric':
                        cleanValue = cleanValue.replace(/[^a-zA-Z0-9\u0600-\u06FF\u06F0-\u06F9\s]/g, '');
                        break;
                      case 'custom':
                        if (field.customRegex) {
                          try {
                            const regex = new RegExp(field.customRegex, 'g');
                            const matches = cleanValue.match(regex);
                            cleanValue = matches ? matches.join('') : '';
                          } catch (error) {
                            console.warn('Invalid custom regex:', field.customRegex);
                          }
                        }
                        break;
                    }
                  } else if (field.variant === 'masked') {
                    // For masked fields, only keep digits and letters
                    cleanValue = cleanValue.replace(/[^\d\w\u0600-\u06FF]/g, '');
                  }
                  
                  handleValueChange(cleanValue);
                }}
                type={field.type === 'password' ? 'password' : 'text'}
                size={field.size === 'sm' ? 'small' : field.size === 'lg' ? 'medium' : 'medium'}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {field.icon && (
                        <Typography sx={{ fontSize: '1.2rem' }}>{field.icon}</Typography>
                      )}
                      {field.prefix && (
                        <Typography sx={{ color: '#64748B' }}>{field.prefix}</Typography>
                      )}
                    </Box>
                  ),
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {field.suffix && (
                        <Typography sx={{ color: '#64748B' }}>{field.suffix}</Typography>
                      )}
                      {field.copyButton && (
                        <Box
                          sx={{
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' }
                          }}
                          onClick={() => navigator.clipboard.writeText(maskedValue)}
                        >
                          📋
                        </Box>
                      )}
                    </Box>
                  ),
                }}
              />
              {/* Mask Pattern Display */}
              {field.maskPattern && (
                <Box sx={{ 
                  mt: 0.5, 
                  fontSize: '0.75rem',
                  color: '#4A90E2',
                  fontFamily: 'monospace'
                }}>
                  الگو: {field.maskPattern}
                </Box>
              )}
              {/* Counter Display */}
              {field.counterDisplay && field.counterDisplay !== 'off' && (
                <Box sx={{ 
                  mt: 0.5, 
                  textAlign: field.counterDisplay === 'inside' ? 'right' : 'left',
                  fontSize: '0.75rem',
                  color: '#64748B'
                }}>
                  {fieldValue.length} / {field.maxLength || 'نامحدود'}
                </Box>
              )}
            </Box>
          );
        }

        // Handle other display types
        if (field.variant === 'textarea') {
          return (
            <TextField
              {...commonProps}
              label={field.name + (field.isRequired ? ' *' : '')}
              placeholder={field.placeholder || ''}
              value={fieldValue}
              onChange={(e) => handleValueChange(e.target.value)}
              multiline
              rows={field.textareaRows || 4}
              maxRows={field.textareaMaxRows || 10}
              sx={{
                ...commonProps.sx,
                '& .MuiOutlinedInput-root': {
                  ...commonProps.sx?.['& .MuiOutlinedInput-root'],
                  resize: field.textareaResize || 'both'
                }
              }}
              InputProps={{
                startAdornment: field.prefix ? (
                  <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                ) : undefined,
                endAdornment: field.suffix ? (
                  <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                ) : undefined,
              }}
            />
          );
        }

        // Default text field
        return (
          <Box>
            <TextField
              {...commonProps}
              label={field.name + (field.isRequired ? ' *' : '')}
              placeholder={field.placeholder || ''}
              value={fieldValue}
              onChange={(e) => handleValueChange(e.target.value)}
              type={field.type === 'password' ? 'password' : 'text'}
              size={field.size === 'sm' ? 'small' : field.size === 'lg' ? 'medium' : 'medium'}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {field.icon && (
                      <Typography sx={{ fontSize: '1.2rem' }}>{field.icon}</Typography>
                    )}
                    {field.prefix && (
                      <Typography sx={{ color: '#64748B' }}>{field.prefix}</Typography>
                    )}
                  </Box>
                ),
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {field.suffix && (
                      <Typography sx={{ color: '#64748B' }}>{field.suffix}</Typography>
                    )}
                    {field.copyButton && (
                      <Box
                        sx={{
                          cursor: 'pointer',
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' }
                        }}
                        onClick={() => navigator.clipboard.writeText(fieldValue)}
                      >
                        📋
                      </Box>
                    )}
                  </Box>
                ),
              }}
            />
            {/* Counter Display */}
            {field.counterDisplay && field.counterDisplay !== 'off' && (
              <Box sx={{ 
                mt: 0.5, 
                textAlign: field.counterDisplay === 'inside' ? 'right' : 'left',
                fontSize: '0.75rem',
                color: '#64748B'
              }}>
                {fieldValue.length} / {field.maxLength || 'نامحدود'}
              </Box>
            )}
          </Box>
        );

      case 'textarea':
        // Handle accordion display for textarea
        if (field.variant === 'accordion') {
          return (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{field.accordionTitle || field.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {field.accordionDisplayMode === 'options' && field.options && field.options.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    {field.selectionAid === 'single' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب گزینه</InputLabel>
                        <Select
                          value={fieldValue}
                          onChange={(e) => handleValueChange(e.target.value)}
                          label="انتخاب گزینه"
                        >
                          {field.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : field.selectionAid === 'multi' ? (
                      <FormControl fullWidth>
                        <InputLabel>انتخاب چندگانه</InputLabel>
                        <Select
                          multiple
                          value={fieldValue ? fieldValue.split(',') : []}
                          onChange={(e) => handleValueChange(Array.isArray(e.target.value) ? e.target.value.join(',') : '')}
                          label="انتخاب چندگانه"
                        >
                          {field.options.map((option: any, index: number) => (
                            <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                              {typeof option === 'string' ? option : option.label || option.value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        {...commonProps}
                        label={field.name + (field.isRequired ? ' *' : '')}
                        placeholder={field.placeholder || ''}
                        value={fieldValue}
                        onChange={(e) => handleValueChange(e.target.value)}
                        multiline
                        rows={field.textareaRows || 4}
                        InputProps={{
                          startAdornment: field.prefix ? (
                            <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                          ) : undefined,
                          endAdornment: field.suffix ? (
                            <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                          ) : undefined,
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  <TextField
                    {...commonProps}
                    label={field.name + (field.isRequired ? ' *' : '')}
                    placeholder={field.placeholder || ''}
                    value={fieldValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    multiline
                    rows={field.textareaRows || 4}
                    InputProps={{
                      startAdornment: field.prefix ? (
                        <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
                      ) : undefined,
                      endAdornment: field.suffix ? (
                        <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
                      ) : undefined,
                    }}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          );
        }

        // Default textarea
        return (
          <Box>
            <TextField
              {...commonProps}
              label={field.name + (field.isRequired ? ' *' : '')}
              placeholder={field.placeholder || ''}
              value={fieldValue}
              onChange={(e) => handleValueChange(e.target.value)}
              multiline
              rows={field.textareaRows || 4}
              maxRows={field.textareaMaxRows || 10}
              size={field.size === 'sm' ? 'small' : field.size === 'lg' ? 'medium' : 'medium'}
              sx={{
                ...commonProps.sx,
                '& .MuiOutlinedInput-root': {
                  ...commonProps.sx?.['& .MuiOutlinedInput-root'],
                  resize: field.textareaResize || 'both'
                }
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {field.icon && (
                      <Typography sx={{ fontSize: '1.2rem' }}>{field.icon}</Typography>
                    )}
                    {field.prefix && (
                      <Typography sx={{ color: '#64748B' }}>{field.prefix}</Typography>
                    )}
                  </Box>
                ),
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {field.suffix && (
                      <Typography sx={{ color: '#64748B' }}>{field.suffix}</Typography>
                    )}
                    {field.copyButton && (
                      <Box
                        sx={{
                          cursor: 'pointer',
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.1)' }
                        }}
                        onClick={() => navigator.clipboard.writeText(fieldValue)}
                      >
                        📋
                      </Box>
                    )}
                  </Box>
                ),
              }}
            />
            {/* Counter Display */}
            {field.counterDisplay && field.counterDisplay !== 'off' && (
              <Box sx={{ 
                mt: 0.5, 
                textAlign: field.counterDisplay === 'inside' ? 'right' : 'left',
                fontSize: '0.75rem',
                color: '#64748B'
              }}>
                {fieldValue.length} / {field.maxLength || 'نامحدود'}
              </Box>
            )}
          </Box>
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            label={field.name + (field.isRequired ? ' *' : '')}
            placeholder={field.placeholder || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            type="number"
            InputProps={{
              startAdornment: field.prefix ? (
                <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
              ) : undefined,
              endAdornment: field.suffix ? (
                <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
              ) : undefined,
            }}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth error={error}>
            <InputLabel>{field.name + (field.isRequired ? ' *' : '')}</InputLabel>
            <Select
              value={field.selectionAid === 'multi' ? (fieldValue ? fieldValue.split(',') : []) : fieldValue}
              onChange={(e) => {
                if (field.selectionAid === 'multi') {
                  handleValueChange(Array.isArray(e.target.value) ? e.target.value.join(',') : '');
                } else {
                  handleValueChange(e.target.value as string);
                }
              }}
              label={field.name + (field.isRequired ? ' *' : '')}
              multiple={field.selectionAid === 'multi'}
            >
              {field.options?.map((option: any, index: number) => (
                <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                  {typeof option === 'string' ? option : option.label || option.value}
                </MenuItem>
              )) || <MenuItem value="">گزینه‌ای موجود نیست</MenuItem>}
            </Select>
            {helperText && <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{helperText}</Typography>}
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl fullWidth error={error}>
            <InputLabel>{field.name + (field.isRequired ? ' *' : '')}</InputLabel>
            <Select
              multiple
              value={fieldValue ? fieldValue.split(',') : []}
              onChange={(e) => handleValueChange((e.target.value as string[]).join(','))}
              label={field.name + (field.isRequired ? ' *' : '')}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {field.options?.map((option: any, index: number) => (
                <MenuItem key={index} value={typeof option === 'string' ? option : option.value}>
                  {typeof option === 'string' ? option : option.label || option.value}
                </MenuItem>
              )) || <MenuItem value="">گزینه‌ای موجود نیست</MenuItem>}
            </Select>
            {helperText && <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{helperText}</Typography>}
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={fieldValue === 'true' || fieldValue === true}
                onChange={(e) => handleValueChange(e.target.checked ? 'true' : 'false')}
              />
            }
            label={field.name + (field.isRequired ? ' *' : '')}
          />
        );

      default:
        return (
          <TextField
            {...commonProps}
            label={field.name + (field.isRequired ? ' *' : '')}
            placeholder={field.placeholder || ''}
            value={fieldValue}
            onChange={(e) => handleValueChange(e.target.value)}
            InputProps={{
              startAdornment: field.prefix ? (
                <Typography sx={{ mr: 1, color: '#64748B' }}>{field.prefix}</Typography>
              ) : undefined,
              endAdornment: field.suffix ? (
                <Typography sx={{ ml: 1, color: '#64748B' }}>{field.suffix}</Typography>
              ) : undefined,
            }}
          />
        );
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      {renderField()}
    </Box>
  );
};

export default FieldRenderer;
